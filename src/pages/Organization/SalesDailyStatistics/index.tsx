import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { message } from 'antd';
import { useMemo, useRef } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { selectSalesDailyStatisticsList } from '@/services/checkin';

type SalesDailyStatItem = {
  user_name?: string;
  user_id?: string;
  date: string;
  new_register_count: number;
  verified_count: number;
  unverified_count: number;
  checkin_count: number;
  all_checkin_count: number;
};

const SalesDailyStatistics = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();

  const formatDateString = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 8 || !/^\d+$/.test(dateStr)) {
      return dateStr;
    }

    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);

    return `${year}-${month}-${day}`;
  };

  const columns: ProColumns<SalesDailyStatItem>[] = useMemo(
    () => [
      {
        key: 'index',
        dataIndex: 'index',
        valueType: 'indexBorder',
      },
      {
        title: '昵称/用户ID',
        key: 'user_name',
        dataIndex: 'user_name',
        align: 'center',
        valueType: 'text',
      },
      {
        title: '用户ID',
        key: 'user_id',
        dataIndex: 'user_id',
        align: 'center',
        valueType: 'text',
        hideInSearch: true,
      },
      {
        title: intl.formatMessage({ id: 'date' }),
        key: 'date',
        dataIndex: 'date',
        valueType: 'dateRange',
        align: 'center',
        sorter: true,
        defaultSortOrder: 'descend',
        render: (_, record) => formatDateString(record.date),
        fieldProps: {
          allowEmpty: [true, true],
          disabledDate: (current: Dayjs, info: { from?: Dayjs; type?: string }) => {
            if (!current) return false;
            if (current.isAfter(dayjs(), 'day')) return true;
            const from = info?.from;
            if (from) {
              const a = from.startOf('day');
              const b = current.startOf('day');
              const diff = Math.abs(b.diff(a, 'day'));
              if (diff > 6) return true;
            }
            return false;
          },
        },
      },
      {
        title: '新增人数',
        key: 'new_register_count',
        dataIndex: 'new_register_count',
        align: 'center',
        hideInSearch: true,
      },
      {
        title: '实名人数',
        key: 'verified_count',
        dataIndex: 'verified_count',
        align: 'center',
        hideInSearch: true,
      },
      {
        title: '未实名人数',
        key: 'unverified_count',
        dataIndex: 'unverified_count',
        align: 'center',
        hideInSearch: true,
      },
      {
        title: '签到人数',
        key: 'checkin_count',
        dataIndex: 'checkin_count',
        align: 'center',
        hideInSearch: true,
      },
      {
        title: '下级所有签到人数',
        key: 'all_checkin_count',
        dataIndex: 'all_checkin_count',
        align: 'center',
        hideInSearch: true,
      },
    ],
    [intl],
  );

  return (
    <PageContainer>
      <ProTable<SalesDailyStatItem>
        columns={columns}
        actionRef={actionRef}
        form={{
          initialValues: {
            date: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')],
          },
        }}
        request={async (params = {}, sort) => {
          const searchParams: Record<string, any> = {};

          if (params.date) {
            const [start, end] = params.date as [string, string];
            if (start && end) {
              const d0 = dayjs(start).startOf('day');
              const d1 = dayjs(end).startOf('day');
              if (d1.diff(d0, 'day') > 6) {
                message.warning('查询日期区间最多 7 天（含起止当天）');
                return { data: [], success: false, total: 0 };
              }
            }
            if (start) {
              searchParams.start_time = String(Math.floor(new Date(start).getTime() / 1000));
            }
            if (end) {
              const endDate = new Date(end);
              endDate.setHours(23, 59, 59, 999);
              searchParams.end_time = String(Math.floor(endDate.getTime() / 1000));
            }
          }

          if (params.user_name) {
            const keyword = String(params.user_name).trim();
            if (keyword) {
              searchParams.user_name = keyword;
            }
          }

          // 排序：默认按日期降序
          if (sort && Object.keys(sort).length > 0) {
            const [field, order] = Object.entries(sort)[0] as [string, any];
            searchParams.sort_field = field;
            searchParams.sort_order = order === 'ascend' ? 'asc' : 'desc';
          } else {
            searchParams.sort_field = 'date';
            searchParams.sort_order = 'desc';
          }

          // 分页
          if (params.current) {
            searchParams.page = params.current;
          }
          if (params.pageSize) {
            searchParams.page_size = params.pageSize;
          }

          const { data } = await selectSalesDailyStatisticsList(searchParams);

          const list: SalesDailyStatItem[] = Array.isArray(data)
            ? (data as SalesDailyStatItem[])
            : (data?.list ?? []);

          const total =
            Array.isArray(data) && typeof data.length === 'number'
              ? data.length
              : data?.total ?? list.length;

          return {
            data: list,
            success: true,
            total,
          };
        }}
        pagination={{
          defaultPageSize: 10,
          showQuickJumper: true,
        }}
      />
    </PageContainer>
  );
};

export default SalesDailyStatistics;

