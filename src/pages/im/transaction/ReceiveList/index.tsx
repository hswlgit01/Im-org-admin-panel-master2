import { selectReceiveList } from '@/services/checkin';
import { formatUTCTimeToBeijing } from '@/utils/common';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { useMemo, useRef } from 'react';

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
        hideInTable: true,
        editable: false,
         fieldProps: {
          label: '领取人账号/昵称/用户ID'
        }
      },
      {
        title: '领取人',
        key: 'receiver_name',
        dataIndex: 'receiver_name',
        align: 'center',
         fieldProps: {
          label: '领取人账号/昵称/用户ID'
        }
      },
      {
        title: '领取帐号',
        key: 'receiver_account',
        dataIndex: 'receiver_account',
        hideInSearch: true,
        align: 'center',
      },
      {
        title: '发送人',
        key: 'sender_name',
        dataIndex: 'sender_name',
        align: 'center',
        valueType: 'text',
        fieldProps: {
          label: '领取人账号/昵称/用户ID'
        },
      },
      {
        title: '发送帐号',
        key: 'sender_account',
        dataIndex: 'sender_account',
        hideInSearch: true,
        align: 'center',
      },
      {
        title: '领取时间',
        key: 'received_at',
        dataIndex: 'received_at',
        valueType: 'dateRange',
        align: 'center',
        render: (_, record) => formatUTCTimeToBeijing(record.received_at),
        fieldProps: {
          allowEmpty: [true, true],
        },
      },

      {
        title: '金额',
        key: 'amount',
        dataIndex: 'amount',
        align: 'center',
        hideInSearch: true,
      },
      {
        title: '交易类型',
        key: 'transaction_type',
        dataIndex: 'transaction_type',
        hideInSearch: true,
        align: 'center',
        render: (transaction_type) => transaction_type_map[transaction_type],
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
          // }); received_at

          const searchParams = {
            page: params.current,
            page_size: params.pageSize,
            sender_keyword: params.sender_name,
            receiver_keyword: params.receiver_name,
            transaction_id: params.transaction_id,
          };
          if (params.received_at) {
            if (params.received_at[0]) {
              searchParams.start_time = String(new Date(params.received_at[0]).getTime() / 1000);
            }
            if (params.received_at[1]) {
              searchParams.end_time = String(new Date(params.received_at[1]).getTime() / 1000);
            }
          }

          const { data } = await selectReceiveList(searchParams);
          const tmpData = data.list || [];
          const res = tmpData.map((v) => ({
            ...v,
            receiver_name: v.receiver.nickname,
            receiver_account: v.receiver.account,
            sender_name: v.sender.nickname,
            sender_account: v.sender.account,
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
