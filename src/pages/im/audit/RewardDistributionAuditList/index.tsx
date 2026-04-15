import { auditReward, selectRecordAuditList } from '@/services/checkin';
import { formatUTCTimeToBeijing, getResourceUrl } from '@/utils/common';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Popconfirm, message, Tag, Image } from 'antd';
import { useMemo, useRef } from 'react';


const status_map = {
  1: '已发放',
  0: '未发放',
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
        title: '奖品名称',
        key: 'reward_name',
        dataIndex: 'reward_name',
        align: 'center',
        hideInSearch: true,
      },
       {
        title: '奖品图片',
        dataIndex: 'reward_img',
        key: 'reward_img',
        hideInSearch: true,
        align: 'center',
        width: 100,
        render: (reward_img: string) => (
          <Image src={getResourceUrl(reward_img)} width={80} height={45} style={{ objectFit: 'contain' }} />
        ),
      },
      {
        title: '中奖日期',
        key: 'win_time',
        dataIndex: 'win_time',
        valueType: 'dateRange',
        align: 'center',
        render: (_, record) => formatUTCTimeToBeijing(record.win_time),
        fieldProps: {
          allowEmpty: [true, true],
        },
      },
      {
        title: '发放状态',
        key: 'status',
        dataIndex: 'status',
        align: 'center',
        valueType: 'select',
        valueEnum: status_map,
        render: (_, record) => <Tag color={ record.status === 1 ? 'green' : 'orange'}>{status_map[record.status]}</Tag>,
      },
      {
        title: '发放日期',
        key: 'distribute_time',
        dataIndex: 'distribute_time',
        valueType: 'dateRange',
        align: 'center',
        render: (_, record) => {
          if (record.status === 1) {
            return formatUTCTimeToBeijing(record.distribute_time);
          }
          return '-';
        },
        fieldProps: {
          allowEmpty: [true, true],
        },
      },
      {
        title: '操作',
        key: 'action',
        align: 'center',
        hideInSearch: true,
        render: (_: any, record: any) => (
         record.status === 0 &&  <Popconfirm
            title="确定要发放此奖励吗?"
            onConfirm={async () => {
              await auditReward({ id: record.id, status: 1 });
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
          // }); win_start_time win_end_time

          const searchParams = {
            keyword: params.keyword,
            is_win: true,
            pagination: {
              page: params.current,
              page_size: params.pageSize,
            },
          }
          if (params.win_time) {
            if (params.win_time[0]) {
              searchParams.win_start_time = new Date(params.win_time[0]).getTime() / 1000;
            }
            if (params.win_time[1]) {
              searchParams.win_end_time = new Date(params.win_time[1]).getTime() / 1000;
            }
          }
          if (params.distribute_time) {
            if (params.distribute_time[0]) {
              searchParams.distribute_start_time = new Date(params.distribute_time[0]).getTime() / 1000;
            }
            if (params.distribute_time[1]) {
              searchParams.distribute_end_time = new Date(params.distribute_time[1]).getTime() / 1000;
            }
          }
          if (params.status !== undefined) {
            searchParams.status = Number(params.status);
          }
          const { data } = await selectRecordAuditList(searchParams);

          const tmpData = data.data ?? [];
          const res = tmpData.map(v=>({
            ...v,
            nickname: v.user_info.nickname,
            account: v.user_attribute.account,
            user_id: v.user_attribute.user_id,
            reward_name: v.reward_info.name,
            reward_img: v.reward_info.img,
          }))
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
