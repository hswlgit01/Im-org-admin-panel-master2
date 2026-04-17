import { resetUserPassword } from '@/services/user';
import { history, useIntl } from '@umijs/max';
import { Input, InputRef, Modal, message } from 'antd';
import md5 from 'md5';
import { FC, useRef, useState } from 'react';

type ResetModalProps = {
  userID: string | null;
  setUserID: (userID: string | null) => void;
};

const ResetModal: FC<ResetModalProps> = ({ userID, setUserID }) => {
  const intl = useIntl();
  const passwordRef = useRef<InputRef>(null);
  const [loading, setLoading] = useState(false);

  const open = userID !== null;

  const handleConfirm = async () => {
    if (!userID) return;
    if (!passwordRef.current?.input?.value) return;

    setLoading(true);
    try {
      await resetUserPassword({
        userID,
        newPassword: md5(passwordRef.current?.input?.value),
      });
      message.success(intl.formatMessage({ id: 'api.success' }));
      setUserID(null);
      if (userID === localStorage.getItem('IMAdminUserID')) {
        localStorage.removeItem('IMAccountToken');
        localStorage.removeItem('IMAdminToken');
        history.push('/login');
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setUserID(null);
  };

  return (
    <Modal
      title={intl.formatMessage({ id: 'user.newPassword' })}
      open={open}
      confirmLoading={loading}
      onOk={handleConfirm}
      onCancel={handleCancel}
    >
      <div className="w-full flex justify-center">
        <Input.Password
          ref={passwordRef}
          placeholder={intl.formatMessage({ id: 'user.password.tips' })}
        />
      </div>
    </Modal>
  );
};

export default ResetModal;
