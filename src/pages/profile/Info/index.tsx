import { updateAdminInfo } from '@/services/account';
import { splitUpload } from '@/services/upload';
import { getResourceUrl } from '@/utils/common';
import { UploadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useModel } from '@umijs/max';
import { Avatar, Button, Card, Input, Space, Upload, message } from 'antd';
import { UploadRequestOption } from 'rc-upload/lib/interface';
import { useState } from 'react';

const Info = () => {
  const intl = useIntl();
  const { initialState, refresh } = useModel('@@initialState');
  const [userInfo, setUserInfo] = useState({
    nickname: initialState?.currentUser?.nickname,
    faceURL: initialState?.currentUser?.faceURL,
  });
  const [loading, setLoading] = useState(false);

  const updateUserField = async (key: 'nickname' | 'faceURL', value: string) => {
    try {
      await updateAdminInfo({
        userID: localStorage.getItem('IMAdminUserID')!,
        [key]: value,
      });
      await refresh();
      if (key === 'faceURL') {
        setUserInfo({
          nickname: initialState?.currentUser?.nickname,
          faceURL: value,
        });
      }
      message.success(intl.formatMessage({ id: 'api.success' }));
    } catch (error) {
      console.log(error);
    }
  };

  const customUpload = async (data: UploadRequestOption) => {
    try {
      const { url: avatarUrl } = await splitUpload(data.file as File);
      if (avatarUrl) {
        updateUserField('faceURL', avatarUrl);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateAdminInfoHandler = async () => {
    if (!userInfo.nickname) return;
    setLoading(true);
    try {
      await updateUserField('nickname', userInfo.nickname);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  return (
    <PageContainer>
      <Card>
        <div className="mb-4 font-medium text-base">
          {intl.formatMessage({ id: 'account.faceURL' })}
        </div>
        <Upload accept="image/*" customRequest={customUpload} showUploadList={false}>
          <Avatar shape="square" size={110} src={getResourceUrl(userInfo.faceURL)} />
          <div className="text-[#1890FFFF] mt-3">
            <Button icon={<UploadOutlined />}>{intl.formatMessage({ id: 'api.upload' })}</Button>
          </div>
        </Upload>

        <div className="my-4 font-medium text-base">
          {intl.formatMessage({ id: 'account.nickname' })}
        </div>
        <Space.Compact>
          <Input
            value={userInfo.nickname}
            onChange={(e) => {
              setUserInfo({
                ...userInfo,
                nickname: e.target.value,
              });
            }}
            style={{ width: '260px' }}
          />
          <Button loading={loading} onClick={updateAdminInfoHandler} type="primary">
            {intl.formatMessage({ id: 'save' })}
          </Button>
        </Space.Compact>
      </Card>
    </PageContainer>
  );
};

export default Info;
