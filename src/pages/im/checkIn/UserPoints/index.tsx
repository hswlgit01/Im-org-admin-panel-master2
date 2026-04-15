import { selectCheckInStandarList } from '@/services/checkin';
import { formatUTCDateOnlyToBeijing } from '@/utils/common';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import dayjs from 'dayjs';
import { useMemo, useRef } from 'react';



const UserList = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();


  const columns: ProColumns<any>[] = useMemo(
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
        title: intl.formatMessage({ id: 'user.userID' }),
        key: 'user_id',
        dataIndex: 'user_id',
        align: 'center',
        hideInSearch: true,
      },
      {
        title: '奖励类型',
        key: 'type',
        dataIndex: 'type',
        align: 'center',
        hideInSearch: true,
        render: (type: any) => {
          const typeMap: Record<string, string> = {
            cash: '余额',
            lottery: '抽奖券',
            integral: '积分',
          };
          return typeMap[String(type)] || '-';
        },
      },
      {
        title: '奖励数量',
        key: 'amount',
        dataIndex: 'amount',
        align: 'center',
        hideInSearch: true,
        render: (amount: any, record: any) => {
          if (amount == null || amount === '') return '-';
          if (record.type === 'cash') {
            const name = record.reward_currency_info?.name || 'CNY';
            return `${amount} ${name}`.trim();
          }
          return amount;
        },
      },
      {
        title: '签到连续天数',
        key: 'streak',
        dataIndex: 'description',
        align: 'center',
        hideInSearch: true,
        render: (_: any, record: any) => {
          // 优先使用 join 出来的签到记录上的 streak，保证同一天的日常/阶段奖励展示一致
          const fromCheckin =
            record?.checkin != null && typeof record.checkin.streak !== 'undefined'
              ? record.checkin.streak
              : null;
          const fromDesc = record?.description ? String(record.description).trim() : '';

          if (fromCheckin != null) {
            return fromCheckin;
          }

          // 没有关联签到记录时，continuous/daily 都退回到 description
          if (fromDesc !== '') {
            return fromDesc;
          }

          // 连续奖励兜底文案
          if (record?.source === 'continuous') {
            return '阶段奖励';
          }

          return '-';
        },
      },
      {
        title: '发放状态',
        key: 'status',
        dataIndex: 'status',
        align: 'center',
        hideInSearch: true,
        render: (status: any) => {
          const statusMap: Record<string, string> = {
            pending: '待发放',
            apply: '已发放',
          };
          return statusMap[String(status)] || '-';
        },
      },
      {
        title: '签到日期',
        key: 'checkin_date',
        dataIndex: 'checkin_date',
        valueType: 'dateRange',
        align: 'center',
        render: (_: any, record: any) => {
          const date = record.checkin_date ?? record.checkin?.date;
          return formatUTCDateOnlyToBeijing(date);
        },
        fieldProps: {
          allowEmpty: [true, true],
        },
      },
    ],
    [],
  );

  return (
    <PageContainer>
      <ProTable<API.UserManage.User>
        columns={columns}
        actionRef={actionRef}
        onSubmit={() => {
          // 查询时总是回到第一页，避免尾页出现“空数据”但后端仍有数据的错觉
          actionRef.current?.reloadAndRest?.();
        }}
        request={async (params: any = {}) => {
          const rawKeyword = params.keyword;
          const trimmedKeyword =
            typeof rawKeyword === 'string' ? rawKeyword.trim() : undefined;
          const finalKeyword =
            trimmedKeyword && trimmedKeyword.length > 0 ? trimmedKeyword : undefined;

          const searchParams: any = {
            page: params.current,
            page_size: params.pageSize,
            keyword: finalKeyword,
          };
          // 与列表展示的「签到日期」一致：按奖励的 checkin_date 筛选，起止日对齐当天 0 点与 23:59:59，避免时区导致少查/多查
          if (params.checkin_date && Array.isArray(params.checkin_date) && params.checkin_date.length === 2) {
            const [start, end] = params.checkin_date;
            const startDay = start ? dayjs(start).startOf('day') : null;
            const endDay = end ? dayjs(end).endOf('day') : null;
            if (startDay?.isValid()) {
              searchParams.checkin_start_time = String(startDay.unix());
            }
            if (endDay?.isValid()) {
              searchParams.checkin_end_time = String(endDay.unix());
            }
          }
          const { data } = await selectCheckInStandarList(searchParams);

          const tmpData = data.data || [];
          const res = tmpData.map((v: any) => ({
            ...v,
            nickname: v.user?.nickname || v.attribute?.nickname || '-',
            user_id: v.user?.user_id || v.im_server_user_id || '-',
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
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          showQuickJumper: true,
        }}
      />
    </PageContainer>
  );
};

export default UserList;
