import OIMAvatar from '@/components/OIMAvatar';
import { deleteBlock, getBlockList } from '@/services/user';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { message, Popconfirm } from 'antd';
import { useMemo, useRef } from 'react';
import { formatUTCTimeToBeijing } from '@/utils/common';

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
        dataIndex: 'faceUrl',
        valueType: 'avatar',
        key: 'faceUrl',
        hideInSearch: true,
        editable: false,
        align: 'center',
        render: (_, record) => <OIMAvatar src={record.faceUrl} text={record.nickname} />,
      },
      {
        title: intl.formatMessage({ id: 'user.nickname' }),
        key: 'nickname',
        dataIndex: 'nickname',
        hideInSearch: true,
        align: 'center',
      },
      {
        title: '封禁时间',
        dataIndex: 'createTime',
        key: 'createTime',
        hideInSearch: true,
        render: (text: string) => {
          return formatUTCTimeToBeijing(text);
        },
      },
      {
        title: intl.formatMessage({ id: 'pages.login.account' }),
        key: 'account',
        dataIndex: 'account',
        hideInSearch: true,
        align: 'center',
      },
      {
        title: intl.formatMessage({ id: 'pages.login.email' }),
        key: 'email',
        dataIndex: 'email',
        hideInSearch: true,
        align: 'center',
      },
      {
        title: intl.formatMessage({ id: 'user.userID' }),
        key: 'user_id',
        dataIndex: 'user_id',
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
        title: '操作',
        valueType: 'option',
        key: 'option',
        align: 'center',
        render: (_, user) => (
          <Popconfirm
            title={intl.formatMessage({ id: 'user.confirmDeblock' })}
            onConfirm={() => deleteBlockHandler(user.user_im_id)}
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
          const tableData = data.users?.map((item: any) => {
            return {
              ...item,
              ...item.user,
              ...item.userAttr,
              user_id: item.userID,
              user_im_id: item.user.userID,
              createTime: item.forbiddenAccount.createTime,
            };
          });
          return {
            data: tableData,
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
