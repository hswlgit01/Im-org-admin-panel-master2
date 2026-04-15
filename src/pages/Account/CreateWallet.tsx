import { createWallet } from '@/services/wallet';
import { aesEncrypt } from '@/utils/crypto';
import { Button, Form, Input, message, Modal } from 'antd';
import { useIntl } from '@umijs/max';

export const CreateWalletForm = ({
  isModalVisible,
  onCancel,
}: {
  isModalVisible: boolean;
  onCancel: () => void;
}) => {
  const [form] = Form.useForm();
  const intl = useIntl();
  const onFinish = async (values: any) => {
    console.log('Received values of form: ', values);

    const params = {
      pay_pwd: values.paymentPassword,
    };
    const encryptParams = await aesEncrypt(JSON.stringify(params));
    const finalParams = {
      need_rsa_verify: false,
      encrypted_data: encryptParams,
      user_req_type: 'organization',
    };
    try {
      const { errCode, data } = await createWallet(finalParams);
      if (errCode === 0) {
        message.success('success');
        localStorage.setItem('walletExist', 'true');
        onCancel();
      }
    } catch (error) {
      console.log(error);
      onCancel();
    }
  };

  return (
    <>
      <Modal
        title={intl.formatMessage({ id: 'createWallet' })}
        open={isModalVisible}
        footer={null}
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
          <>
            {/* 支付密码字段 */}
            <Form.Item
              label={intl.formatMessage({ id: 'paymentPassword' })}
              name="paymentPassword"
              rules={[
                {
                  required: true,
                  pattern: /^\d{6}$/,
                  message: intl.formatMessage({ id: 'enterSixDigitPassword' }),
                },
              ]}
            >
              <Input.Password allowClear placeholder={intl.formatMessage({ id: 'enterSixDigitPassword' })} />
            </Form.Item>

            {/* 确认支付密码字段 */}
            <Form.Item
              label={intl.formatMessage({ id: 'confirmPaymentPassword' })}
              name="confirmPaymentPassword"
              dependencies={['paymentPassword']}
              rules={[
                {
                  required: true,
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('paymentPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(intl.formatMessage({ id: 'passwordMismatch' })));
                  },
                }),
              ]}
            >
              <Input.Password allowClear/>
            </Form.Item>
          </>
          <Form.Item className="mb-4">
            <Button type="primary" htmlType="submit" block>
              {intl.formatMessage({ id: 'createWallet' })}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
