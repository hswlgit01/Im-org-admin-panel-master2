import { checkPassword } from '@/services/wallet';
import { useIntl } from '@umijs/max';
import { Button, Form, Input, message, Modal } from 'antd';
import md5 from 'md5';
import { useState } from 'react';

const Verify = ({
  isModalVisible,
  onCancel,
  openCreateWallet,
}: {
  isModalVisible: boolean;
  onCancel: () => void;
  openCreateWallet: () => void;
}) => {
  const intl = useIntl();
      
  const [form] = Form.useForm();
  const [verifyLoading, setVerifyLoading] = useState(false);
  const onFinish = async (values: any) => {
    console.log(values);
    setVerifyLoading(true);
    values.password = md5(values.password);
    try {
      const { data } = await checkPassword(values.password);
      if (data) {
        openCreateWallet();
      }
    } catch (error) {
      message.error(intl.formatMessage({ id: 'passwordError' }));
    }
    setVerifyLoading(false);
  };

  return (
    <Modal
      title={intl.formatMessage({ id: 'identityVerification' })}
      footer={null}
      open={isModalVisible}
      onCancel={onCancel}
      centered
      styles={{
        mask: {
          opacity: 0,
          transition: 'none',
        },
      }}
      maskTransitionName=""
      afterClose={() => {
        form.resetFields();
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        labelCol={{ prefixCls: 'custom-form-item' }}
      >
        <Form.Item name="password" rules={[{ required: true, message: intl.formatMessage({ id: 'enterLoginPassword' }) }]}>
          <Input.Password allowClear placeholder={intl.formatMessage({ id: 'enterLoginPassword' })} />
        </Form.Item>

        <Form.Item className="mb-4">
          <Button type="primary" htmlType="submit" block loading={verifyLoading}>
            {intl.formatMessage({ id: 'verify' })}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default Verify;
