import avatar_upload from '@/assets/images/avatar_upload.png';
import SelectUserModal, {
  SelectModalOptions,
  SelectType,
  SelectedListItem,
} from '@/components/SelectUserModal';
import { AllowType, GroupVerificationType } from '@/constants/enum';
import { updateGroup } from '@/services/group';
import { createGroup as createGroupNew } from '@/services/group-new';
import { splitUpload } from '@/services/upload';
import { getResourceUrl } from '@/utils/common';
import { useIntl } from '@umijs/max';
import { Avatar, Button, Drawer, Form, Input, Select, Spin, Tag, Upload, message } from 'antd';
import { UploadRequestOption } from 'rc-upload/lib/interface';
import React, { FC, useEffect, useState } from 'react';

export type DrawerOptions = {
  open: boolean;
  opType: 'create' | 'edit';
  groupInfo?: API.GroupManage.GroupInfo;
};

type GroupActionDrawerProps = {
  drawerOptions: DrawerOptions;
  closeDrawer: () => void;
  reload: () => void;
};

const checkUpdatedFileds = [
  'applyMemberFriend',
  'needVerification',
  'lookMemberInfo',
  'groupName',
  'faceURL',
  'introduction',
  'notification',
];


const hasUpdated = (oldData: any, newData: any) =>
  checkUpdatedFileds.some((field) => oldData[field] !== newData[field]);

const GroupActionDrawer: FC<GroupActionDrawerProps> = ({
  closeDrawer,
  reload,
  drawerOptions: { open, groupInfo, opType },
}) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [fetching, setFetching] = useState(false);
  const [lookMemberInfo, setLookMemberInfo] = useState();

  const [uploadState, setUploadState] = useState({
    url: undefined as string | undefined,
    loading: false,
  });


  const [selectItems, setSelectItems] = useState({
    owner: {
      data: [] as API.UserManage.User[],
      keys: [] as React.Key[],
    },
    admin: {
      data: [] as API.UserManage.User[],
      keys: [] as React.Key[],
    },
    member: {
      data: [] as API.UserManage.User[],
      keys: [] as React.Key[],
    },
  });

  const [selectModalOptions, setSelectModalOptions] = useState<SelectModalOptions>({
    open: false,
    selectType: 'member',
  });

  const openSelectModal = (type: SelectType) => {
    let disabledData: string[] = [];
    if (type === 'owner') {
      disabledData = [...selectItems.admin.data, ...selectItems.member.data].map(
        (user) => user.userID,
      );
    }
    if (type === 'admin') {
      disabledData = [...selectItems.owner.data, ...selectItems.member.data].map(
        (user) => user.userID,
      );
    }
    if (type === 'member') {
      disabledData = [...selectItems.owner.data, ...selectItems.admin.data].map(
        (user) => user.userID,
      );
    }
    setSelectModalOptions({
      open: true,
      selectType: type,
      preSelectData: selectItems[type],
      disabledData,
    });
  };

  const closeSelectModal = () => {
    setSelectModalOptions({
      open: false,
      selectType: 'member',
    });
  };

  const selectedCallBack = (data: SelectedListItem, type: SelectType) => {
    const tmpData = { ...selectItems };
    tmpData[type] = data;
    setSelectItems(tmpData);
    if (type === 'owner') {
      form.setFieldValue('ownerUserID', data.data[0].userImID);
    }
    if (type === 'admin') {
      form.setFieldValue(
        'adminUserIDs',
        data.data.map((user) => user.userImID),
      );
    }
    if (type === 'member') {
      form.setFieldValue(
        'memberUserIDs',
        data.data.map((user) => user.userImID),
      );
    }
  };

  const customUpload = async (data: UploadRequestOption) => {
    setUploadState((state) => ({ ...state, loading: true }));
    try {
      const { url: avatarUrl } = await splitUpload(data.file as File);
      if (avatarUrl) {
        setUploadState({ url: avatarUrl, loading: false });
      }
    } catch (error) {
      setUploadState((state) => ({ ...state, loading: false }));
      console.log(error);
    }
  };

  const onFinish = async (values: any) => {
    setFetching(true);
    try {
      if (opType === 'create') {
        await createGroupNew({
          memberUserIDs: values.memberUserIDs,
          adminUserIDs: values.adminUserIDs,
          ownerUserID: values.ownerUserID,
          groupInfo: {
            groupName: values.groupName.trim(),
            notification: values.notification,
            introduction: values.introduction,
            faceURL: uploadState.url,
            groupType: 2,
            needVerification: values.needVerification,
            lookMemberInfo: values.lookMemberInfo,
            applyMemberFriend: values.applyMemberFriend,
          },
        });
      } else {
        if (!hasUpdated(groupInfo, { ...values, faceURL: uploadState.url ?? groupInfo?.faceURL })) {
          setFetching(false);
          return;
        }
        const updateParams = {
           groupID: values.groupID,
        }
        for (const key in groupInfo) {
          if (Object.prototype.hasOwnProperty.call(groupInfo, key)) {
            const element = groupInfo[key];
            if (values[key] !== element) {
              updateParams[key] = values[key];
            }
          }
        }
        for (const key in updateParams) {
          if (Object.prototype.hasOwnProperty.call(updateParams, key)) {
            const element = updateParams[key];
            if (element === undefined) {
              delete updateParams[key];
            }
          }
        }
        if (updateParams.groupName) {
          updateParams.groupName = updateParams.groupName.trim();
        }
        await updateGroup({
          groupInfoForSet: updateParams,
        });
      }
      message.success(intl.formatMessage({ id: 'api.success' }));
      reload();
      form.resetFields();
      setSelectItems({
        owner: {
          data: [] as API.UserManage.User[],
          keys: [] as React.Key[],
        },
        admin: {
          data: [] as API.UserManage.User[],
          keys: [] as React.Key[],
        },
        member: {
          data: [] as API.UserManage.User[],
          keys: [] as React.Key[],
        },
      });
      closeDrawer();
    } catch (error) {
      console.log(error);
    }
    setFetching(false);
  };

  useEffect(() => {
    form.resetFields();
    if (open && opType === 'create') {
      form.setFieldsValue({
        needVerification: GroupVerificationType.AllNeed,
        applyMemberFriend: AllowType.Allowed,
        lookMemberInfo: AllowType.Allowed,
      });
    }
    if (open && opType === 'edit') {
      form.setFieldsValue(groupInfo);
    }
  }, [open]);

  return (
    <Drawer
      title={
        opType === 'create'
          ? intl.formatMessage({ id: 'group.create' })
          : intl.formatMessage({ id: 'group.setting' })
      }
      placement="right"
      closable={false}
      onClose={closeDrawer}
      open={open}
      destroyOnClose
    >
      <div>
        <SelectUserModal
          selectModalOptions={selectModalOptions}
          selectedCallBack={selectedCallBack}
          closeSelectModal={closeSelectModal}
        />
        <div className="w-full text-center mb-6">
          <Spin spinning={uploadState.loading}>
            <div className="flex flex-col">
              <Upload accept="image/*" customRequest={customUpload} showUploadList={false}>
                <Avatar
                  shape="square"
                  size={55}
                  src={getResourceUrl(uploadState.url || groupInfo?.faceURL || avatar_upload)}
                />
                <div className="text-[#1890FFFF] mt-3">
                  {intl.formatMessage({ id: 'api.upload' })}
                </div>
              </Upload>
            </div>
          </Spin>
        </div>
        <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} onFinish={onFinish}>
          <Form.Item
            label={intl.formatMessage({ id: 'group.groupName' })}
            name="groupName"
            rules={[
              { required: true, message: intl.formatMessage({ id: 'group.groupName.tips' }) },
            ]}
          >
            <Input
              maxLength={15}
              placeholder={intl.formatMessage({ id: 'group.groupName.tips' })}
            />
          </Form.Item>

          {opType === 'edit' && (
            <Form.Item label={intl.formatMessage({ id: 'group.groupID' })} name="groupID">
              <Input disabled />
            </Form.Item>
          )}

          {opType === 'create' && (
            <>
              <Form.Item
                label={intl.formatMessage({ id: 'group.GroupOwner' })}
                name="ownerUserID"
                rules={[
                  { required: true, message: intl.formatMessage({ id: 'group.GroupOwner.tips' }) },
                ]}
              >
                <div
                  onClick={() => openSelectModal('owner')}
                  className="h-8 border border-solid border-[#D9D9D9] rounded cursor-pointer px-1 py-1 truncate"
                >
                  {selectItems.owner.data.map((item) => (
                    <Tag key={item.userID}>{item.nickname}</Tag>
                  ))}
                </div>
              </Form.Item>

              <Form.Item label={intl.formatMessage({ id: 'group.GroupAdmin' })} name="adminUserIDs">
                <div
                  onClick={() => openSelectModal('admin')}
                  className="h-8 border border-solid border-[#D9D9D9] rounded cursor-pointer px-1 py-1 truncate"
                >
                  {selectItems.admin.data.map((item) => (
                    <Tag key={item.userID}>{item.nickname}</Tag>
                  ))}
                </div>
              </Form.Item>

              <Form.Item
                label={intl.formatMessage({ id: 'group.GroupMember' })}
                name="memberUserIDs"
                rules={[
                  { required: true, message: intl.formatMessage({ id: 'group.GroupMember.tips' }) },
                ]}
              >
                <div
                  onClick={() => openSelectModal('member')}
                  className="h-8 border border-solid border-[#D9D9D9] rounded cursor-pointer px-1 py-1 truncate"
                >
                  {selectItems.member.data.map((item) => (
                    <Tag key={item.userID}>{item.nickname}</Tag>
                  ))}
                </div>
              </Form.Item>
            </>
          )}

          <Form.Item
            label={intl.formatMessage({ id: 'group.needVerification' })}
            name="needVerification"
          >
            <Select>
              <Select.Option value={GroupVerificationType.AllNeed}>
                {intl.formatMessage({ id: 'group.needVerification.allNeed' })}
              </Select.Option>
              <Select.Option value={GroupVerificationType.AllNot}>
                {intl.formatMessage({ id: 'group.needVerification.allNot' })}
              </Select.Option>
              <Select.Option value={GroupVerificationType.ApplyNeedInviteNot}>
                {intl.formatMessage({ id: 'group.needVerification.applyNeedInviteNot' })}
              </Select.Option>
               <Select.Option value={GroupVerificationType.DisallowAllJoins}>
                {intl.formatMessage({ id: 'group.needVerification.disallowAllJoins' })}
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({ id: 'group.applyMemberFriend' })}
            name="applyMemberFriend"
          >
            <Select>
              <Select.Option value={AllowType.Allowed}>
                {intl.formatMessage({ id: 'group.applyMemberFriend.allowed' })}
              </Select.Option>
              <Select.Option value={AllowType.NotAllowed}>
                {intl.formatMessage({ id: 'group.applyMemberFriend.notAllowed' })}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({ id: 'group.lookMemberInfo' })}
            name="lookMemberInfo"
          >
            <Select onChange={setLookMemberInfo}>
              <Select.Option value={AllowType.Allowed}>
                {intl.formatMessage({ id: 'group.lookMemberInfo.allowed' })}
              </Select.Option>
              <Select.Option value={AllowType.NotAllowed} style={{ backgroundColor: (lookMemberInfo === AllowType.DisallowAdminViewMembers || lookMemberInfo === AllowType.DisallowViewGroupInfo) ? '#eaf6fe' : '' }}>
                {intl.formatMessage({ id: 'group.lookMemberInfo.notAllowed' })}
              </Select.Option>
              <Select.Option value={AllowType.DisallowViewGroupInfo} style={{ backgroundColor: (lookMemberInfo === AllowType.DisallowAdminViewMembers) ? '#eaf6fe' : '' }}>
                {intl.formatMessage({ id: 'group.lookMemberInfo.disallowViewGroupInfo' })}
              </Select.Option>
              <Select.Option value={AllowType.DisallowAdminViewMembers}>
                {intl.formatMessage({ id: 'group.lookMemberInfo.disallowAdminViewMembers' })}
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label={intl.formatMessage({ id: 'group.notification' })} name="notification">
            <Input.TextArea
              autoSize={{ maxRows: 3, minRows: 3 }}
              maxLength={250}
              placeholder={intl.formatMessage({ id: 'group.notification.tips' })}
            />
          </Form.Item>
          <Form.Item label={intl.formatMessage({ id: 'group.introduction' })} name="introduction">
            <Input.TextArea
              autoSize={{ maxRows: 3, minRows: 3 }}
              maxLength={250}
              placeholder={intl.formatMessage({ id: 'group.introduction.tips' })}
            />
          </Form.Item>

          <div className="w-full text-right">
            <Button className="px-6" type="primary" htmlType="submit" loading={fetching}>
              {intl.formatMessage({ id: 'confirm' })}
            </Button>
          </div>
        </Form>
      </div>
    </Drawer>
  );
};

export default GroupActionDrawer;
