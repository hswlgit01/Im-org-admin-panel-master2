import { updateUserRole } from '@/services/account';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useIntl } from '@umijs/max';
import { useMemo, useRef, useState } from 'react';

import { auditCheckIn, selectCheckInStandarList } from '@/services/checkin';
import { formatUTCTimeToBeijing } from '@/utils/common';
import { Button, Popconfirm, Tag, message } from 'antd';

export type DrawerOptions = {
  visible: boolean;
  selectUser: API.UserManage.User | undefined;
};

const reward_type_map = {
  cash: '现金',
  lottery: '抽奖券',
  integral: '积分',
};

const status_map = {
  apply: '已发放',
  pending: '未发放',
};

const UserList = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();

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
        title: intl.formatMessage({ id: 'user.nickname' }),
        key: 'nickname',
        dataIndex: 'nickname',
        align: 'center',
        hideInSearch: true,
      },
      {
        title: intl.formatMessage({ id: 'pages.login.account' }),
        key: 'account',
        dataIndex: 'account',
        hideInSearch: true,
        align: 'center',
      },
      {
        title: intl.formatMessage({ id: 'user.userID' }),
        key: 'user_id',
        dataIndex: 'user_id',
        align: 'center',
        hideInSearch: true,
      },
      {
        title: '签到日期',
        key: 'created_at',
        dataIndex: 'created_at',
        // valueType: 'dateRange',
        align: 'center',
        hideInSearch: true,
        render: (_, record) => formatUTCTimeToBeijing(record.created_at),
        // fieldProps: {
        //   allowEmpty: [true, true]
        // }
      },
      {
        title: '连续签到天数',
        key: 'streak',
        dataIndex: 'streak',
        align: 'center',
        hideInSearch: true,
      },
      {
        title: '发放状态',
        key: 'status',
        dataIndex: 'status',
        align: 'center',
        valueType: 'select',
        valueEnum: status_map,
        render: (_, record) => <Tag color={ record.status === 'apply' ? 'green' : 'orange'}>{status_map[record.status]}</Tag>,
      },
      {
        title: '奖励类型',
        key: 'type',
        dataIndex: 'type',
        align: 'center',
        hideInSearch: true,
        render: (type) => <div>{reward_type_map[type]}</div>,
      },

      // {
      //   title: '金额',
      //   key: 'amount',
      //   dataIndex: 'amount',
      //   align: 'center',
      //   hideInSearch: true,
      //   render: (_, record) =>
      //     record.type === 'cash' ? `${record.amount} ${record.reward_currency_info.name}` : '-',
      // },
      {
        title: '奖券名称',
        key: 'lottery_name',
        dataIndex: ['reward_lottery_info', 'name'],
        align: 'center',
        hideInSearch: true,
        render: (_, record) => {
          if (record.type === 'cash') return record.reward_currency_info?.name ?? '-';
          if (record.type === 'lottery') return record.reward_lottery_info?.name ?? '-';
          if (record.type === 'integral') return '-';
          return '-';
        },
      },
      {
        title: '数量',
        key: 'lottery_amount',
        dataIndex: 'amount',
        align: 'center',
        hideInSearch: true,
        render: (_, record) => record.amount ?? '-',
      },
      {
        title: '操作',
        key: 'action',
        align: 'center',
        hideInSearch: true,
        render: (_: any, record: any) => (
          record.status === 'pending' && <Popconfirm
            title="确定要发放此奖励吗?"
            onConfirm={async () => {
              await auditCheckIn({ id: record.id });
              message.success('操作成功');
              actionRef.current?.reload();
            }}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link">发放</Button>
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
        request={async (params = {}) => {
          console.log(params, 'params');
          // const { data } = await getOrganizationUsers({
          //   pageNumber: params.current as number,
          //   showNumber: params.pageSize as number,
          //   keyword: params.nickname,
          // });
          const { data } = await selectCheckInStandarList({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword,
            status: params.status
          });

          const tmpData = data.data ?? [];
          const res = tmpData.map((v) => ({
            ...v,
            nickname: v.user?.nickname ?? v.attribute?.nickname ?? '-',
            account: v.attribute.account,
            user_id: v.attribute.user_id,
            streak: v.checkin?.streak,
            created_at: v.created_at ?? v.checkin_date ?? v.checkin?.date,
          }));

          return {
            data: res,
            success: true,
            total: data.total,
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

export default UserList;
