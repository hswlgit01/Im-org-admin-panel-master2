import { deleteReward, insertReward, selectRewardList, updateReward } from '@/services/checkin';
import { updateBlock } from '@/services/user';
import {
  ActionType,
  ModalForm,
  PageContainer,
  ProColumns,
  ProFormText,
  ProFormTextArea,
  ProFormUploadButton,
  ProTable,
} from '@ant-design/pro-components';
import { history, useIntl } from '@umijs/max';
import { useMemo, useRef, useState } from 'react';

import { splitUpload } from '@/services/upload';
import { Button, Form, Image, Popconfirm, Space, message } from 'antd';
import { UploadRequestOption } from 'rc-upload/lib/interface';
import { getResourceUrl } from '@/utils/common';

export type DrawerOptions = {
  visible: boolean;
  selectUser: API.UserManage.User | undefined;
};
const formatUTCTimeToLocal = (isoString: string) => {
  const date = new Date(isoString);
  const localTimeString = date
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(/\//g, '-')
    .replace(', ', ' ');

  return localTimeString;
};

const UserList = () => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const actionRef = useRef<ActionType>();
  const [drawerOptions, setDrawerOptions] = useState<DrawerOptions>({
    visible: false,
    selectUser: undefined,
  });
  const [fileList, setFileList] = useState<any[]>([]);
  const [selectedUserID, setSelectUserID] = useState('');
  const toRelationListHandler = (userId: string) => {
    history.push('/im/user/relation_list?userID=' + userId);
  };

  const modifyUserRole = async (user_id: string, role: string) => {
    await updateUserRole({ user_id, role: role === 'GroupManager' ? 'Normal' : 'GroupManager' });
    message.success('操作成功');
    actionRef.current?.reload();
  };
  const columns: ProColumns<API.UserManage.User>[] = useMemo(
    () => [
      {
        key: 'index',
        dataIndex: 'index',
        valueType: 'indexBorder',
        align: 'center',
        width: 50,
      },
      {
        title: '奖品图片',
        dataIndex: 'img',
        key: 'img',
        hideInSearch: true,
        align: 'center',
        width: 200,
        render: (img: string) => (
          <Image src={getResourceUrl(img)} width={160} height={90} style={{ objectFit: 'contain' }} />
        ),
      },
      {
        title: '奖品名称',
        key: 'name',
        dataIndex: 'name',
        align: 'center',
      },
      // {
      //   title: '奖品类型',
      //   key: 'account',
      //   dataIndex: 'account',
      //   hideInSearch: true,
      //   align: 'center',
      // },
      {
        title: '奖品描述',
        key: 'remark',
        dataIndex: 'remark',
        hideInSearch: true,
        align: 'center',
      },
      {
        title: '',
        key: 'action',
        hideInSearch: true,
        align: 'center',
        render: (_: any, record: any) => (
          <Space size="middle">
            {ModifyModel(record)}
            <Popconfirm
              title="确定要删除此奖品吗?"
              onConfirm={async () => {
                await deleteReward({ id: record.ID });
                message.success('删除成功');
                actionRef.current?.reload();
              }}
              okText="确定"
              cancelText="取消"
            >
              <Button danger type="link">
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [fileList],
  );

  const customUpload = async (data: UploadRequestOption) => {
    try {
      const { url: iconUrl } = await splitUpload(data.file as File);
      if (iconUrl) {
        // setUploadState({ url: iconUrl, loading: false });
        // 更新文件列表显示
        setFileList([
          {
            uid: '-1',
            name: (data.file as File).name,
            status: 'done',
            url: iconUrl,
          },
        ]);
      }
    } catch (error) {
      // setUploadState((state) => ({ ...state, loading: false }));
      message.error('上传失败');
      console.log(error);
    }
  };

  const handleIconChange = ({ fileList }: { fileList: any[] }) => {
    console.log('fileList ', fileList);

    setFileList(fileList);
  };

  const ModifyModel = (initData?: any) => {
    // const { initData } = modalProps;
    return (
      <ModalForm
        title={initData ? '编辑奖品' : '新增奖品'}
        trigger={
          <Button
            type={initData ? 'link' : 'primary'}
            onClick={() => {
              if (initData) {
                form.setFieldsValue(initData);
                if (initData.img) {
                  form.setFieldValue('fileList', [
                    {
                      uid: '-1123',
                      name: initData.img,
                      status: 'done',
                      url: getResourceUrl(initData.img),
                    },
                  ]);
                  setFileList([
                    {
                      uid: '-1123',
                      name: initData.img,
                      status: 'done',
                      url: getResourceUrl(initData.img),
                    },
                  ]);
                }
              }
            }}
          >
            {initData ? '编辑' : '新增奖品'}
          </Button>
        }
        form={form}
        autoFocusFirstInput
        clearOnDestroy
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            form.resetFields();
            setFileList([]);
          },
        }}
        submitTimeout={2000}
        onFinish={async (values) => {
          // await waitTime(2000);
          console.log('values: ', values);
          if (fileList.length) {
            values.img = fileList[0].url;
          }
          values.name = values.name.trim();
          if (initData) {
            values.id = initData.ID;
            await updateReward(values);
          } else {
            await insertReward(values);
          }
          actionRef.current?.reload();
          // await updateRolePermissions(params);
          message.success('提交成功');
          form.resetFields();
          setFileList([]);
          return true;
        }}
      >
        <ProFormText name="name" label="奖品名称" rules={[{ required: true }]} />
        {/* <ProFormText name="desc" label="奖品类型"/> */}
        <ProFormUploadButton
          label="奖品图片"
          name="fileList"
          max={1}
          fieldProps={{
            name: 'file',
            listType: 'picture-card',
            customRequest: customUpload,
            onChange: handleIconChange,
            fileList: fileList,
          }}
        />
        {/* <ProFormItem name="upload" label="奖品图片">

        </ProFormItem> */}
        {/* <Upload
            listType="picture-card"
            fileList={fileList}
            maxCount={1}
            onChange={handleIconChange}
            customRequest={customUpload}
            showUploadList={true}
            accept='image/*'
          >
            {fileList.length === 0 && (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传头像</div>
              </div>
            )}
          </Upload> */}
        <ProFormTextArea name="remark" label="奖品描述" />
      </ModalForm>
    );
  };

  return (
    <PageContainer>
      <ProTable<API.UserManage.User>
        columns={columns}
        actionRef={actionRef}
        request={async (params = {}) => {
          console.log(params, 'params');

          const { data } = await selectRewardList({
            page: params.current,
            pageSize: params.pageSize,
            name: params.name,
          });

          const tmpData = data.data ?? [];

          return {
            data: tmpData,
            success: true,
            total: data.total,
          };
        }}
        toolBarRender={() => ModifyModel()}
        pagination={{
          defaultPageSize: 10,
          showQuickJumper: true,
        }}
      />
    </PageContainer>
  );
};

export default UserList;
