import login_bg from '@/assets/images/login_bg.png';
import { adminLogin, userInfo } from '@/services/account';
import { getAESkey, walletExist } from '@/services/wallet';
import { decryptAESKey, generateRSAKeyPair } from '@/utils/crypto';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { history, useIntl, useModel } from '@umijs/max';
import { Button, Checkbox, Form, Input, message } from 'antd';
import md5 from 'md5';
import { useState } from 'react';
import { normalizeOrganizationId } from '@/utils/organization';

type FormField = {
  account: string;
  password: string;
};

const Login = () => {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const { setInitialState } = useModel('@@initialState');

  const onFinish = async (value: FormField) => {
    setLoading(true);
    try {
      const { data } = await adminLogin({
        account: value.account.trim(),
        password: md5(value.password.trim()),
        platform: 5,
      });

      console.log('data', data);

      if (data.organization === null) {
        message.error('No access permission');
        setLoading(false);
        return;
      }

      const organizationId = normalizeOrganizationId(data.organization);
      if (!organizationId) {
        message.error('Login succeeded, but organization id is invalid');
        setLoading(false);
        return;
      }

      localStorage.setItem('IMAccountToken', data.admin_token);
      localStorage.setItem('IMAdminToken', data.im_token);
      localStorage.setItem('IMAdminUserID', data.user_id);
      localStorage.setItem('IMUserID', data.im_user_id);
      localStorage.setItem('OrganizationID', organizationId);

      try {
        const res = await walletExist();
        localStorage.setItem('walletExist', res.data);
      } catch (error) {
        console.warn('walletExist failed after login', error);
      }

      try {
        const { privateKey, publicKey } = generateRSAKeyPair();
        localStorage.setItem('rsaPrivateKey', privateKey);
        const {
          data: { encrypted_aes_key },
        } = await getAESkey(publicKey);
        const aesKey = decryptAESKey(encrypted_aes_key, privateKey);
        localStorage.setItem('AES_KEY', aesKey);
      } catch (error) {
        console.warn('getAESkey failed after login', error);
      }

      try {
        const current = await userInfo({
          userIDs: [data.im_user_id],
        });
        if (current.data.users && current.data.users.length) {
          await setInitialState((s: any) => ({
            ...s,
            currentUser: current.data.users[0],
          }));
        }
      } catch (error) {
        console.warn('userInfo failed after login', error);
      }

      setTimeout(() => {
        history.push('/organization/info');
      }, 200);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <div className="flex">
        <img src={login_bg} alt="" />
        <div className="flex flex-col ml-24">
          <div className="text-2xl font-medium mb-16">
            {intl.formatMessage({ id: 'pages.login.welcome' })}
          </div>
          <Form
            name="basic"
            className="w-[364px]"
            onFinish={onFinish}
            initialValues={{
              check: true,
            }}
            autoComplete="off"
            requiredMark={false}
            size="large"
          >
            <Form.Item
              name="account"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-[#4686fc]" />}
                placeholder={intl.formatMessage({ id: 'pages.login.account' })}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({ id: 'pages.login.password.required' }),
                },
              ]}
            >
              <Input.Password
                height={40}
                prefix={<LockOutlined className="text-[#4686fc]" />}
                placeholder={intl.formatMessage({ id: 'pages.login.password' })}
              />
            </Form.Item>

            <Form.Item wrapperCol={{ span: 24 }}>
              <Button className="w-full" type="primary" htmlType="submit" loading={loading}>
                {intl.formatMessage({ id: 'pages.login' })}
              </Button>
            </Form.Item>

            <Form.Item name="check" valuePropName="checked">
              <Checkbox>
                {intl.formatMessage({ id: 'pages.login.agreement' })}
                <span className="text-[#4686fc] mx-1">
                  {intl.formatMessage({ id: 'pages.login.agreement.service' })}
                </span>
                {intl.formatMessage({ id: 'pages.login.and' })}
                <span className="text-[#4686fc] mx-1">
                  {intl.formatMessage({ id: 'pages.login.agreement.privacy' })}
                </span>
              </Checkbox>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login;
