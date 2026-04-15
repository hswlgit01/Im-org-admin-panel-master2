import { checkPassword, updatePayPwd } from '@/services/wallet';
import { aesEncrypt } from '@/utils/crypto';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Card, Form, Input, message } from 'antd';
import md5 from 'md5';

type FormFields = {
  password: string;
  newPassword: string;
};

const PayPwd = () => {
  const intl = useIntl();
  const [form] = Form.useForm<FormFields>();

  const onFinish = async (values: any) => {
    console.log(values, 'values');
    const { password, payPwd } = values;
    const baseParams = {
      login_pwd: md5(password.trim()),
      new_pay_pwd: payPwd.trim(),
    };
    const encryptParams = await aesEncrypt(JSON.stringify(baseParams));
    const finalParams = {
      need_rsa_verify: false,
      encrypted_data: encryptParams,
      user_req_type: 'organization',
    };

    try {
      const { data } = await checkPassword(md5(password.trim()));
      if (data) {
        const { data: result } = await updatePayPwd(finalParams);
        if (result) {
          message.success('修改成功');
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <PageContainer>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          className="mt-4"
          style={{ width: '300px' }}
        >
          <Form.Item
            label={intl.formatMessage({ id: 'account.payPwd.vefiryPwd' })}
            name="password"
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'account.currentPassword.tips' }),
              },
            ]}
          >
            <Input.Password
              allowClear
              placeholder={intl.formatMessage({ id: 'account.currentPassword.tips' })}
            />
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({ id: 'account.newPayPwd' })}
            name="payPwd"
            className="mb-8"
            rules={[
              {
                required: true,
                pattern: /^\d{6}$/,
                message: intl.formatMessage({ id: 'account.payPwd.length.tips' }),
              },
            ]}
          >
            <Input.Password
              allowClear
              placeholder={intl.formatMessage({ id: 'account.payPwd.newPayPwd.tips' })}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {intl.formatMessage({ id: 'save' })}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default PayPwd;
