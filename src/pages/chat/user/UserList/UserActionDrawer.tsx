import { FC, useEffect, useState } from 'react';
import { Avatar, Button, DatePicker, Drawer, Form, Input, Select, Upload, message } from 'antd';
import { areaCode } from '@/constants/areaCode';
import { splitUpload } from '@/services/upload';
import { UploadRequestOption } from 'rc-upload/lib/interface';
import avatar_upload from '@/assets/images/avatar_upload.png';
import { registerUser, updateUserInfo } from '@/services/user';
import md5 from 'md5';
import dayjs from 'dayjs';
import { useIntl } from '@umijs/max';
import { Space } from 'antd/lib';
import { getResourceUrl } from '@/utils/common';

type UserFormFields = {
  userID?: string;
  nickname: string;
  gender: number;
  birth: dayjs.Dayjs;
  phoneNumber: string;
  password: string;
  areaCode: string;
};

type UserActionDrawerProps = {
  openAction: boolean;
  currentUser: API.UserManage.User | null;
  closeModal: () => void;
  reloadTable: () => void;
};

const UserActionDrawer: FC<UserActionDrawerProps> = ({
  openAction,
  currentUser,
  closeModal,
  reloadTable,
}) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [faceURL, setFaceURL] = useState('');

  const isCreated = !currentUser?.userID;
  const title = isCreated
    ? intl.formatMessage({ id: 'user.createUser' })
    : intl.formatMessage({ id: 'user.editUser' });
  const submitText = isCreated
    ? intl.formatMessage({ id: 'user.create' })
    : intl.formatMessage({ id: 'user.save' });

  useEffect(() => {
    form.setFieldsValue({ ...currentUser, birth: dayjs(currentUser?.birth) });
    setFaceURL(currentUser?.faceURL ?? '');
  }, [currentUser]);

  const closeDrawer = () => {
    setFaceURL('');
    form.resetFields();
    closeModal();
  };

  const customUpload = async (data: UploadRequestOption) => {
    try {
      const { url: avatarUrl } = await splitUpload(data.file as File);
      if (avatarUrl) {
        setFaceURL(avatarUrl);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const createUser = async (values: UserFormFields) => {
    try {
      await registerUser({
        user: {
          nickname: values.nickname,
          faceURL,
          birth: values.birth?.unix() * 1000,
          gender: values.gender,
          areaCode: values.areaCode,
          phoneNumber: values.phoneNumber,
          password: md5(values.password),
        },
      });
      reloadTable();
      closeDrawer();
      message.success(intl.formatMessage({ id: 'api.success' }));
    } catch (error) {
      console.log(error);
    }
  };

  const editUser = async (values: UserFormFields) => {
    try {
      await updateUserInfo({
        userID: currentUser!.userID,
        nickname: values.nickname.trim(),
        faceURL,
        birth: values.birth?.unix() * 1000,
        gender: values.gender,
      });
      reloadTable();
      closeDrawer();
      message.success(intl.formatMessage({ id: 'api.success' }));
    } catch (error) {
      console.log(error);
    }
  };

  const onFinish = async (values: UserFormFields) => {
    if (isCreated) {
      await createUser(values);
    } else {
      await editUser(values);
    }
  };

  const UnchangeableFields = () => (
    <>
      <Form.Item
        label={
          <span>
            <span className="text-[#ff4d4f] text-sm" style={{ fontFamily: 'SimSun, sans-serif' }}>
              *{' '}
            </span>
            {intl.formatMessage({ id: 'user.phoneNumber' })}
          </span>
        }
      >
        <Space.Compact className="w-full">
          <Form.Item name="areaCode" noStyle>
            <Select options={areaCode} className="!w-28" />
          </Form.Item>
          <Form.Item
            name="phoneNumber"
            rules={[
              { required: true, message: intl.formatMessage({ id: 'user.phoneNumber.tips' }) },
            ]}
            noStyle
          >
            <Input allowClear placeholder={intl.formatMessage({ id: 'user.phoneNumber.tips' })} />
          </Form.Item>
        </Space.Compact>
      </Form.Item>

      <Form.Item
        label={intl.formatMessage({ id: 'user.password' })}
        name="password"
        rules={[{ required: true, message: intl.formatMessage({ id: 'user.password.tips' }) }]}
      >
        <Input.Password placeholder={intl.formatMessage({ id: 'user.password.tips' })} />
      </Form.Item>
    </>
  );

  return (
    <Drawer
      title={title}
      placement="right"
      closable={false}
      onClose={closeDrawer}
      open={openAction}
    >
      <div>
        <div className="w-full text-center mb-12">
          <div className="flex flex-col">
            <Upload accept="image/*" customRequest={customUpload} showUploadList={false}>
              <Avatar shape="square" size={55} src={getResourceUrl(faceURL || avatar_upload)} />
              <div className="text-[#1890FFFF] mt-3">
                {intl.formatMessage({ id: 'api.upload' })}
              </div>
            </Upload>
          </div>
        </div>
        <Form<UserFormFields>
          form={form}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{
            areaCode: '+86',
          }}
        >
          <Form.Item
            label={intl.formatMessage({ id: 'user.nickname' })}
            name="nickname"
            rules={[{ required: true, message: intl.formatMessage({ id: 'user.nickname.tips' }) }]}
          >
            <Input maxLength={15} placeholder={intl.formatMessage({ id: 'user.nickname.tips' })} />
          </Form.Item>

          <Form.Item label={intl.formatMessage({ id: 'user.gender' })} name="gender">
            <Select placeholder={intl.formatMessage({ id: 'user.gender.tips' })}>
              <Select.Option value={1}>
                {intl.formatMessage({ id: 'user.gender.man' })}
              </Select.Option>
              <Select.Option value={2}>
                {intl.formatMessage({ id: 'user.gender.woman' })}
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label={intl.formatMessage({ id: 'user.birth' })} name="birth">
            <DatePicker />
          </Form.Item>

          {isCreated && UnchangeableFields()}

          <div className="w-full text-right">
            <Button className="px-6" type="primary" htmlType="submit">
              {submitText}
            </Button>
          </div>
        </Form>
      </div>
    </Drawer>
  );
};

export default UserActionDrawer;
