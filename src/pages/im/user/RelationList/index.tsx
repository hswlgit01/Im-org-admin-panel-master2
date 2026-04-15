import OIMAvatar from '@/components/OIMAvatar';
import { deleteFriend, getFriendList } from '@/services/user';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl, useSearchParams } from '@umijs/max';
import { message, Popconfirm } from 'antd';
import { useMemo, useRef } from 'react';

const RelationList = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const [searchParams] = useSearchParams();

  const deleteUserHandler = async (userID: string) => {
    try {
      await deleteFriend({
        ownerUserID: searchParams.get('userID') as string,
        friendUserID: userID,
      });
      message.success(intl.formatMessage({ id: 'api.success' }));
      actionRef.current?.reload();
    } catch (error) {
      console.log(error);
    }
  };

  const columns: ProColumns<API.UserManage.FriendsInfo>[] = useMemo(
    () => [
      {
        key: 'index',
        dataIndex: 'index',
        valueType: 'indexBorder',
      },
      {
        title: intl.formatMessage({ id: 'user.faceURL' }),
        dataIndex: 'avatar',
        key: 'avatar',
        align: 'center',
        render: (_, record) => (
          <OIMAvatar src={record.friendUser.faceURL} text={record.friendUser.nickname} />
        ),
      },
      {
        title: intl.formatMessage({ id: 'user.nickname' }),
        key: 'nickName',
        dataIndex: 'nickName',
        align: 'center',
        render: (_, record) => <span>{record.friendUser.nickname}</span>,
      },
      {
        title: intl.formatMessage({ id: 'user.userID' }),
        key: 'userID',
        dataIndex: 'userID',
        align: 'center',
        render: (_, record) => <span>{record.friendUser.userID}</span>,
      },
      {
        title: '',
        valueType: 'option',
        key: 'option',
        align: 'center',
        render: (_, record) => (
          <Popconfirm
            key={'delete'}
            title={intl.formatMessage({ id: 'user.deleteRelation.tips' })}
            onConfirm={() => deleteUserHandler(record.friendUser.userID)}
          >
            <a>{intl.formatMessage({ id: 'delete' })}</a>
          </Popconfirm>
        ),
      },
    ],
    [],
  );

  return (
    <PageContainer>
      <ProTable<API.UserManage.FriendsInfo>
        columns={columns}
        actionRef={actionRef}
        rowKey={(record) => record.friendUser.userID}
        search={false}
        request={async (params = {}) => {
          const { data } = await getFriendList({
            userID: searchParams.get('userID') as string,
            pagination: {
              pageNumber: params.current as number,
              showNumber: params.pageSize as number,
            },
          });
          return {
            data: data.friendsInfo ?? [],
            success: true,
            total: data.total,
          };
        }}
        pagination={{
          defaultPageSize: 10,
        }}
      />
    </PageContainer>
  );
};

export default RelationList;
