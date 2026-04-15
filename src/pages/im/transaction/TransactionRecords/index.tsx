import { selectTransactionRecordList } from '@/services/checkin';
import { formatUTCTimeToBeijing } from '@/utils/common';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { useMemo, useRef } from 'react';
import { Tag } from 'antd';

const transaction_type_map = {
  0: '转账',
  1: '一对一红包',
  2: '普通红包',
  3: '拼手气红包',
  // 4: '组织账户转账',
  5: '群组专属红包',
  6: '群组口令红包',
  // 7: '组织签到奖励转账',
};

const status_map = {
  0: '进行中',
  1: '已完成',
  2: '已过期',
};
const status_color_map = {
  0: 'blue',
  1: 'green',
  2: 'red',
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
        title: '交易ID',
        key: 'transaction_id',
        dataIndex: 'transaction_id',
        align: 'center',
        hideInSearch: true,
      },
      {
        title: '发放人昵称',
        key: 'sender_nickname',
        dataIndex: ['sender', 'nickname'],
        align: 'center',
        hideInSearch: true,
        render: (_, record) => record.sender?.nickname || '-',
      },
      {
        title: '发放人账号',
        key: 'sender_account',
        dataIndex: ['sender', 'account'],
        align: 'center',
        hideInSearch: true,
        render: (_, record) => record.sender?.account || '-',
      },
      {
        title: '交易类型',
        key: 'transaction_type',
        dataIndex: 'transaction_type',
        align: 'center',
        valueType: 'select',
        valueEnum: transaction_type_map,
        render: (_, record) => transaction_type_map[record.transaction_type],
      },
      {
        title: '交易时间',
        key: 'created_at',
        dataIndex: 'created_at',
        valueType: 'dateRange',
        align: 'center',
        render: (_, record) => formatUTCTimeToBeijing(record.created_at),
        fieldProps: {
          allowEmpty: [true, true],
        },
      },
      {
        title: '交易状态',
        key: 'status',
        dataIndex: 'status',
        align: 'center',
        valueType: 'select',
        valueEnum: status_map,
        render: (_, record) => (
          <Tag color={status_color_map[record.status]}>{status_map[record.status]}</Tag>
        ),
      },

      {
        title: '总数量',
        key: 'total_count',
        dataIndex: 'total_count',
        hideInSearch: true,
        align: 'center',
      },
      {
        title: '总金额',
        key: 'total_amount',
        dataIndex: 'total_amount',
        hideInSearch: true,
        align: 'center',
        render: (total_amount, record)=>`${total_amount} ${record.currency}`
      },
      {
        title: '剩余数量',
        key: 'remaining_count',
        dataIndex: 'remaining_count',
        hideInSearch: true,
        align: 'center',
      },
      {
        title: '剩余金额',
        key: 'remaining_amount',
        dataIndex: 'remaining_amount',
        hideInSearch: true,
        align: 'center',
         render: (remaining_amount, record)=>`${remaining_amount} ${record.currency}`
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

          const searchParams = {
            page: params.current,
            page_size: params.pageSize,
            keyword: params.keyword,
            status: params.status !== undefined ? Number(params.status) : undefined,
            transaction_type: params.transaction_type !== undefined ? Number(params.transaction_type) : undefined,
          };
          if (params.created_at) {
            if (params.created_at[0]) {
              searchParams.start_time = String(new Date(params.created_at[0]).getTime() / 1000);
            }
            if (params.created_at[1]) {
              searchParams.end_time = String(new Date(params.created_at[1]).getTime() / 1000);
            }
          }

          const { data } = await selectTransactionRecordList(searchParams);
          const tmpData = data.list || [];

          return {
            data: tmpData,
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
