import { changeAdminPassword } from '@/services/account';
import { PageContainer } from '@ant-design/pro-components';
import { history, useIntl, useModel } from '@umijs/max';
import { Button, Card, Form, Input, message } from 'antd';
import md5 from 'md5';
import { flushSync } from 'react-dom';

type FormFields = {
  password: string;
  newPassword: string;
};

const Modify = () => {
  const intl = useIntl();
  const [form] = Form.useForm<FormFields>();
  const { setInitialState } = useModel('@@initialState');

  const onFinish = async ({ password, newPassword }: FormFields) => {
    try {
      await changeAdminPassword({
        userID: localStorage.getItem('IMAdminUserID')!,
        currentPassword: md5(password.trim()),
        newPassword: md5(newPassword.trim()),
      });
      message.success(intl.formatMessage({ id: 'account.reset.tips' }));
      flushSync(() => {
        setInitialState((s) => ({ ...s, currentUser: undefined }));
      });
      localStorage.removeItem('IMAdminToken');
      localStorage.removeItem('IMAccountToken');
      history.replace({
        pathname: '/login',
      });
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
            label={intl.formatMessage({ id: 'account.currentPassword' })}
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
            label={intl.formatMessage({ id: 'account.newPassword' })}
            name="newPassword"
            dependencies={["password"]}
            className="mb-8"
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'account.newPassword.tips' }),
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") !== value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(intl.formatMessage({ id: 'account.newPasswordDifferent' })));
                },
              }),
            ]}
          >
            <Input.Password
              allowClear
              placeholder={intl.formatMessage({ id: 'account.newPassword.tips' })}
            />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({ id: 'account.reconfirmPassword' })}
            name="password2"
            className="mb-8"
            dependencies={["newPassword"]}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'account.reconfirmPassword.tips' }),
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(intl.formatMessage({ id: 'account.reconfirmPasswordDifferent' })));
                },
              }),
            ]}
          >
            <Input.Password allowClear placeholder={intl.formatMessage({ id: 'account.reconfirmPassword.tips' })} />
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

export default Modify;
