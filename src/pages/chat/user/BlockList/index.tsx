import OIMAvatar from '@/components/OIMAvatar';
import { deleteBlock, getBlockList } from '@/services/user';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { message, Popconfirm } from 'antd';
import { useMemo, useRef } from 'react';

const BlockList = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();

  const deleteBlockHandler = async (userID: string) => {
    try {
      await deleteBlock({
        userIDs: [userID],
      });
      actionRef.current?.reload();
      message.success(intl.formatMessage({ id: 'api.success' }));
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
        title: '',
        valueType: 'option',
        key: 'option',
        align: 'center',
        render: (_, user) => (
          <Popconfirm
            title={intl.formatMessage({ id: 'user.confirmDeblock' })}
            onConfirm={() => deleteBlockHandler(user.userID)}
          >
            <a>{intl.formatMessage({ id: 'user.deblock' })}</a>
          </Popconfirm>
        ),
      },
    ],
    [],
  );

  return (
    <PageContainer>
      <ProTable<API.UserManage.User>
        columns={columns}
        actionRef={actionRef}
        rowKey="userID"
        request={async (params = {}) => {
          const { data } = await getBlockList({
            ...params,
            keyword: params.keyword,
            pagination: {
              pageNumber: params.current as number,
              showNumber: params.pageSize as number,
            },
          });
          return {
            data: data.users ?? [],
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
      />
    </PageContainer>
  );
};

export default BlockList;
