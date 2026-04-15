// import { createCurrency } from '@/services/wallet';
// import { aesEncrypt } from '@/utils/crypto';
import { Button, Form, Input, message, Modal, Space, Spin, Upload } from 'antd';
import React, { useState } from 'react';
// import { RoleOptions } from '@/constants/role';
import { UploadOutlined } from '@ant-design/icons';
import { UploadRequestOption } from 'rc-upload/lib/interface';
import { splitUpload } from '@/services/upload';
import { insertMember } from '@/services/account';
import md5 from 'md5';

interface IModalProps {
  isModalVisible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
  accountPrefix: string;
}

const InsertMemberModal: React.FC<IModalProps> = (props) => {
  const { isModalVisible, onCancel, onSuccess, accountPrefix } = props;
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploadState, setUploadState] = useState({
    url: undefined as string | undefined,
    loading: false,
  });
  const [fileList, setFileList] = useState<any[]>([]);



  const onFinish = async (values: any) => {


    setLoading(true);
    try {
      const params = {
        nickname: values.nickname,
        faceURL: uploadState?.url,
        account: values.account,
        password: md5(values.password),
        role: "BackendAdmin"
      };

      const { errCode } = await insertMember(params);

      if (errCode === 0) {
        message.success('新增成功');
        onCancel();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        message.error('新增失败，请重试');
      }
    } catch (error) {
      console.error('新增失败:', error);
      message.error('新增失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const beforeUpload = (file: any) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传JPG/PNG格式的图片！');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过2MB！');
    }
    return isJpgOrPng && isLt2M;
  };

  const customUpload = async (data: UploadRequestOption) => {
    setUploadState((state) => ({ ...state, loading: true }));
    try {
      const { url: iconUrl } = await splitUpload(data.file as File);
      if (iconUrl) {
        setUploadState({ url: iconUrl, loading: false });
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
      setUploadState((state) => ({ ...state, loading: false }));
      message.error('上传失败');
      console.log(error);
    }
  };
  const handleIconChange = ({ fileList }: { fileList: any[] }) => {
    setFileList(fileList);
  };

  return (
    <Modal
      title="新增后台管理员"
      open={isModalVisible}
      footer={null}
      onCancel={onCancel}
      centered
      afterClose={() => {
        form.resetFields();
        setFileList([]);
        setUploadState({
          url: undefined,
          loading: false,
        });
      }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
        <Form.Item label="成员头像" name="icon" rules={[{ required: false }]}>
          <Spin spinning={uploadState.loading}>
            <Upload
              listType="picture-card"
              fileList={fileList}
              maxCount={1}
              beforeUpload={beforeUpload}
              onChange={handleIconChange}
              customRequest={customUpload}
              showUploadList={true}
            >
              {fileList.length === 0 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传头像</div>
                </div>
              )}
            </Upload>
          </Spin>
        </Form.Item>
        <Form.Item
          label="成员名称"
          name="nickname"
          rules={[{ required: true, message: '请输入成员名称' }]}
        >
          <Input placeholder="请输入成员名称" />
        </Form.Item>
        {/* <Form.Item
          label="角色"
          name="role"
          rules={[{ required: true, message: '请选择角色' }]}
        >
          <Select options={RoleOptions} placeholder="请选择角色" />
        </Form.Item> */}
        {/* <Form.Item
          label="手机号"
          name="phone"
          rules={[{ required: true, message: '请输入手机号' }]}
        >
          <Input style={{ width: '100%' }} placeholder="请输入手机号" />
        </Form.Item> */}
        <Form.Item
          label="账号"
          name="account"
          rules={[{ required: true, message: '请输入账号' }]}
        >
          <Input addonBefore={accountPrefix} placeholder="请输入账号" />
        </Form.Item>
        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password placeholder="请输入密码" />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>取消</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              新增
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default InsertMemberModal;
