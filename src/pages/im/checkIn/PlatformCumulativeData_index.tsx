
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import { selectRegisterStatisticsList } from '@/services/checkin';

export type DrawerOptions = {
  visible: boolean;
  selectUser: API.UserManage.User | undefined;
};

type PlatformStatItem = {
  date: string;
  register: number;
  login: number;
  sign: number;
  sign_by_created_at: number;
};

const PlatformCumulativeData = () => {
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

  const columns: ProColumns<PlatformStatItem>[] = useMemo(
    () => [
      {
        key: 'index',
        dataIndex: 'index',
        valueType: 'indexBorder',
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
          // 不允许选择未来日期
          disabledDate: (current: any) =>
            current ? dayjs(current).isAfter(dayjs(), 'day') : false,
        },
      },
      {
        title: intl.formatMessage({ id: 'loginCount' }),
        key: 'login',
        dataIndex: 'login',
        align: 'center',
        hideInSearch: true,
      },
      {
        title: intl.formatMessage({ id: 'registerCount' }),
        key: 'register',
        dataIndex: 'register',
        align: 'center',
        hideInSearch: true,
      },
      {
        title: intl.formatMessage({ id: 'checkInCount' }),
        key: 'sign',
        dataIndex: 'sign',
        align: 'center',
        hideInSearch: true,
      },
      {
        title: intl.formatMessage({ id: 'checkInCountByCreatedAt' }),
        key: 'sign_by_created_at',
        dataIndex: 'sign_by_created_at',
        align: 'center',
        hideInSearch: true,
      },
    ],
    [intl],
  );

  return (
    <PageContainer>
      <ProTable<PlatformStatItem>
        columns={columns}
        actionRef={actionRef}
        request={async (params = {}, sort) => {
          const searchParams: Record<string, any> = {};

          if (params.date) {
            const [start, end] = params.date as [string, string];
            if (start) {
              searchParams.start_time = String(Math.floor(new Date(start).getTime() / 1000));
            }
            if (end) {
              const endDate = new Date(end);
              endDate.setHours(23, 59, 59, 999);
              searchParams.end_time = String(Math.floor(endDate.getTime() / 1000));
            }
          }

          // 排序：仅按日期
          if (sort && Object.keys(sort).length > 0) {
            const [, order] = Object.entries(sort)[0] as [string, any];
            searchParams.sort_order = order === 'ascend' ? 'asc' : 'desc';
          } else {
            searchParams.sort_order = 'desc';
          }

          const { data } = await selectRegisterStatisticsList(searchParams);

          const list: PlatformStatItem[] = Array.isArray(data)
            ? (data as PlatformStatItem[])
            : (data?.list ?? []);

          return {
            data: list,
            success: true,
            total: list.length,
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

export default PlatformCumulativeData;

