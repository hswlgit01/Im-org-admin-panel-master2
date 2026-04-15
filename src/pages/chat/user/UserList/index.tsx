import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, Modal, Popconfirm, Space, Tag, message } from 'antd';
import { useMemo, useRef, useState } from 'react';
import {
  getUserList,
  getUsersOnlineStatus,
  updateBlock,
  getIdentityVerificationDetail,
  cancelIdentityVerification,
} from '@/services/user';
import OIMAvatar from '@/components/OIMAvatar';
import ResetModal from './ResetModal';
import UserActionDrawer from './UserActionDrawer';
import { useIntl } from '@umijs/max';
import { switchOnline } from '@/utils/common';

const UserList = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const [resetUserID, setResetUserID] = useState<string | null>(null);

  const [openAction, setOpenAction] = useState(false);
  const [currentUser, setCurrentUser] = useState<API.UserManage.User | null>(null);

  const [identityDetailVisible, setIdentityDetailVisible] = useState(false);
  const [currentIdentityDetail, setCurrentIdentityDetail] =
    useState<API.UserManage.IdentityVerification | null>(null);

  const reloadTable = () => actionRef.current?.reload();

  const updateOpenAction = (record: API.UserManage.User | null) => {
    setCurrentUser(record);
    setOpenAction(true);
  };

  const closeModal = () => {
    setCurrentUser(null);
    setOpenAction(false);
  };

  const blockUser = async (userID: string) => {
    await updateBlock({ userID, reason: '' });
    reloadTable();
    message.success(intl.formatMessage({ id: 'api.success' }));
  };

  const viewIdentityDetail = async (userID: string) => {
    try {
      const { data } = await getIdentityVerificationDetail(userID);
      if (data && data.list && data.list.length > 0) {
        setCurrentIdentityDetail(data.list[0]);
        setIdentityDetailVisible(true);
      } else {
        message.warning('未找到该用户的实名认证信息');
      }
    } catch (error) {
      message.error('获取实名认证信息失败');
    }
  };

  const handleCancelVerification = async (userID: string) => {
    try {
      await cancelIdentityVerification({ userID });
      message.success('已取消实名认证');
      setIdentityDetailVisible(false);
      reloadTable();
    } catch (error) {
      message.error('取消实名认证失败');
    }
  };

  const attachInfo = async (userList: API.UserManage.User[]) => {
    try {
      const { data } = await getUsersOnlineStatus({
        userIDs: userList.map((user) => user.userID),
      });
      (data ?? []).forEach((status) => {
        userList.find((user) => {
          if (user.userID === status.userID) {
            user.onlineStr = switchOnline(status.singlePlatformToken);
          }
          return null;
        });
      });
    } catch (error) {
      console.log(error);
    }
  };

  const columns: ProColumns<API.UserManage.User>[] = useMemo(
    () => [
      {
        key: 'index',
        dataIndex: 'index',
        valueType: 'indexBorder',
      },
      {
        title: intl.formatMessage({ id: 'user.keyword' }),
        key: 'keyword',
        dataIndex: 'keyword',
        editable: false,
        hideInTable: true,
        align: 'center',
      },
      {
        title: intl.formatMessage({ id: 'user.faceURL' }),
        dataIndex: 'faceURL',
        valueType: 'avatar',
        key: 'faceURL',
        hideInSearch: true,
        editable: false,
        align: 'center',
        render: (_, record) => <OIMAvatar src={record.faceURL} text={record.nickname} />,
      },
      {
        title: intl.formatMessage({ id: 'user.nickname' }),
        key: 'nickname',
        dataIndex: 'nickname',
        hideInSearch: true,
        align: 'center',
      },
      {
        title: intl.formatMessage({ id: 'user.userID' }),
        key: 'userID',
        dataIndex: 'userID',
        hideInSearch: true,
        editable: false,
        align: 'center',
      },
      {
        title: intl.formatMessage({ id: 'user.gender' }),
        key: 'gender',
        dataIndex: 'gender',
        hideInSearch: true,
        valueType: 'select',
        align: 'center',
        request: async () => {
          return [
            {
              label: intl.formatMessage({ id: 'user.gender.secrecy' }),
              value: 0,
            },
            {
              label: intl.formatMessage({ id: 'user.gender.man' }),
              value: 1,
            },
            {
              label: intl.formatMessage({ id: 'user.gender.woman' }),
              value: 2,
            },
          ];
        },
      },
      {
        title: intl.formatMessage({ id: 'user.online' }),
        key: 'onlineStr',
        dataIndex: 'onlineStr',
        hideInSearch: true,
        editable: false,
        align: 'center',
      },
      {
        title: '实名认证',
        key: 'isRealNameVerified',
        dataIndex: 'isRealNameVerified',
        hideInSearch: true,
        align: 'center',
        render: (_, user) => (
          <Tag color={user.isRealNameVerified ? 'success' : 'default'}>
            {user.isRealNameVerified ? '已认证' : '未认证'}
          </Tag>
        ),
      },
      {
        title: '',
        valueType: 'option',
        key: 'option',
        align: 'center',
        render: (_, user) => {
          return (
            <Space>
              <a key="edit" onClick={() => updateOpenAction(user)}>
                {intl.formatMessage({ id: 'user.edit' })}
              </a>
              <a key="reset" onClick={() => setResetUserID(user.userID)}>
                {intl.formatMessage({ id: 'user.resetPassword' })}
              </a>
              {user.isRealNameVerified && (
                <a key="identity" onClick={() => viewIdentityDetail(user.userChatID)}>
                  实名详情
                </a>
              )}
              <Popconfirm
                key="block"
                title={intl.formatMessage({ id: 'user.confirmBlock' })}
                onConfirm={() => blockUser(user.userID)}
              >
                <a>{intl.formatMessage({ id: 'user.block' })}</a>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [],
  );

  return (
    <PageContainer>
      <ResetModal userID={resetUserID} setUserID={setResetUserID} />
      <UserActionDrawer
        openAction={openAction}
        closeModal={closeModal}
        currentUser={currentUser}
        reloadTable={reloadTable}
      />
      <Modal
        title="实名认证详情"
        open={identityDetailVisible}
        onCancel={() => setIdentityDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIdentityDetailVisible(false)}>
            关闭
          </Button>,
          currentIdentityDetail && currentIdentityDetail.status === 2 && (
            <Popconfirm
              key="cancel"
              title="确认取消该用户的实名认证？"
              onConfirm={() => handleCancelVerification(currentIdentityDetail.userID)}
            >
              <Button type="primary" danger>
                取消认证
              </Button>
            </Popconfirm>
          ),
        ]}
        width={600}
      >
        {currentIdentityDetail && (
          <div style={{ padding: '20px 0' }}>
            <p>
              <strong>用户昵称：</strong>
              {currentIdentityDetail.nickname || '-'}
            </p>
            <p>
              <strong>账号：</strong>
              {currentIdentityDetail.account || '-'}
            </p>
            <p>
              <strong>真实姓名：</strong>
              {currentIdentityDetail.realName}
            </p>
            <p>
              <strong>身份证号：</strong>
              {currentIdentityDetail.idCardNumber}
            </p>
            <p>
              <strong>认证状态：</strong>
              <Tag
                color={
                  currentIdentityDetail.status === 2
                    ? 'success'
                    : currentIdentityDetail.status === 1
                      ? 'processing'
                      : currentIdentityDetail.status === 3
                        ? 'error'
                        : 'default'
                }
              >
                {currentIdentityDetail.status === 2
                  ? '已认证'
                  : currentIdentityDetail.status === 1
                    ? '审核中'
                    : currentIdentityDetail.status === 3
                      ? '已拒绝'
                      : '待认证'}
              </Tag>
            </p>
            <div style={{ marginTop: 20 }}>
              <strong>身份证照片：</strong>
              <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
                <div>
                  <p>正面</p>
                  <img
                    src={currentIdentityDetail.idCardFront}
                    alt="身份证正面"
                    style={{ width: 200, border: '1px solid #d9d9d9', borderRadius: 4 }}
                  />
                </div>
                <div>
                  <p>反面</p>
                  <img
                    src={currentIdentityDetail.idCardBack}
                    alt="身份证反面"
                    style={{ width: 200, border: '1px solid #d9d9d9', borderRadius: 4 }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
      <ProTable<API.UserManage.User>
        columns={columns}
        actionRef={actionRef}
        rowKey="userID"
        request={async (params = {}) => {
          const { data } = await getUserList({
            keyword: params.keyword,
            pagination: {
              pageNumber: params.current as number,
              showNumber: params.pageSize as number,
            },
          });
          const tmpData = data.users ?? [];
          await attachInfo(tmpData);
          return {
            data: tmpData,
            success: true,
            total: data.total ?? 0,
          };
        }}
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          defaultPageSize: 10,
          showQuickJumper: true,
        }}
        toolbar={{
          actions: [
            <Button key="key" type="primary" onClick={() => updateOpenAction(null)}>
              {intl.formatMessage({ id: 'user.createUser' })}
            </Button>,
          ],
          settings: [],
        }}
      />
    </PageContainer>
  );
};

export default UserList;
