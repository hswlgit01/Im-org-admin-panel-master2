import type { SlowQueryLogItem, SlowQueryLogSearchParams } from '@/services/slowQueryLog';
import { getSlowQueryLogs } from '@/services/slowQueryLog';
import { formatUTCTimeToBeijing } from '@/utils/common';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, Descriptions, Drawer, Space, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useRef, useState } from 'react';

const EXPORT_LIMIT = 5000;

const OPERATION_OPTIONS = [
  'FIND',
  'FIND_ONE',
  'FIND_PAGE',
  'FIND_PAGE_ONLY',
  'COUNT',
  'AGGREGATE',
  'UPDATE_ONE',
  'UPDATE_MANY',
  'DELETE_ONE',
  'DELETE_MANY',
  'INSERT_MANY',
  'FIND_ONE_AND_UPDATE',
].map((value) => ({ label: value, value }));

const operationValueEnum = OPERATION_OPTIONS.reduce<Record<string, { text: string }>>((acc, item) => {
  acc[item.value] = { text: item.label };
  return acc;
}, {});

const durationColor = (durationMS?: number) => {
  if (!durationMS) return 'default';
  if (durationMS >= 10000) return 'red';
  if (durationMS >= 5000) return 'orange';
  return 'blue';
};

const resolvePayload = (response: any) => {
  if (response?.data?.data || response?.data?.total !== undefined) return response.data;
  return response?.data || response;
};

const buildQueryParams = (params: Record<string, any>): SlowQueryLogSearchParams => {
  const timeRange = Array.isArray(params.time_range) ? params.time_range : undefined;
  return {
    page: params.current || params.page || 1,
    page_size: params.pageSize || params.page_size || 10,
    keyword: typeof params.keyword === 'string' ? params.keyword.trim() : undefined,
    collection: typeof params.collection === 'string' ? params.collection.trim() : undefined,
    operation: typeof params.operation === 'string' ? params.operation : undefined,
    min_duration_ms: params.min_duration_ms ? Number(params.min_duration_ms) : undefined,
    start_time: timeRange?.[0] ? Math.floor(new Date(timeRange[0]).getTime() / 1000) : undefined,
    end_time: timeRange?.[1] ? Math.floor(new Date(timeRange[1]).getTime() / 1000) : undefined,
  };
};

// dawn 2026-06-16 新增慢查询日志后台：提供慢查询筛选、详情查看和 Excel 导出。
const SlowQueryLog = () => {
  const actionRef = useRef<ActionType>();
  const [detail, setDetail] = useState<SlowQueryLogItem>();
  const [exporting, setExporting] = useState(false);
  const lastSearchRef = useRef<SlowQueryLogSearchParams>({ page: 1, page_size: 10 });

  const columns: ProColumns<SlowQueryLogItem>[] = useMemo(
    () => [
      {
        key: 'index',
        dataIndex: 'index',
        valueType: 'indexBorder',
        width: 48,
        hideInSearch: true,
      },
      {
        title: '关键词',
        dataIndex: 'keyword',
        key: 'keyword',
        hideInTable: true,
        fieldProps: {
          placeholder: '集合 / 操作 / 查询内容 / 错误',
        },
      },
      {
        title: '集合名',
        dataIndex: 'collection',
        key: 'collection',
        fieldProps: {
          placeholder: 'collection',
        },
      },
      {
        title: '操作类型',
        dataIndex: 'operation',
        key: 'operation',
        valueType: 'select',
        valueEnum: operationValueEnum,
        fieldProps: {
          allowClear: true,
          options: OPERATION_OPTIONS,
        },
        render: (_, record) => <Tag>{record.operation || '-'}</Tag>,
      },
      {
        title: '最小耗时(ms)',
        dataIndex: 'min_duration_ms',
        key: 'min_duration_ms',
        hideInTable: true,
        valueType: 'digit',
        initialValue: 3000,
        fieldProps: {
          min: 1,
          precision: 0,
        },
      },
      {
        title: '时间范围',
        dataIndex: 'time_range',
        key: 'time_range',
        valueType: 'dateTimeRange',
        hideInTable: true,
      },
      {
        title: '耗时',
        dataIndex: 'duration_ms',
        key: 'duration_ms',
        hideInSearch: true,
        sorter: true,
        render: (_, record) => (
          <Tag color={durationColor(record.duration_ms)}>{record.duration || `${record.duration_ms}ms`}</Tag>
        ),
      },
      {
        title: '查询内容',
        dataIndex: 'complete_query',
        key: 'complete_query',
        hideInSearch: true,
        ellipsis: true,
        render: (_, record) => (
          <Typography.Paragraph
            copyable
            ellipsis={{ rows: 2 }}
            style={{ marginBottom: 0, maxWidth: 620 }}
          >
            {record.complete_query || '-'}
          </Typography.Paragraph>
        ),
      },
      {
        title: '错误',
        dataIndex: 'error',
        key: 'error',
        hideInSearch: true,
        ellipsis: true,
        render: (_, record) => record.error || '-',
      },
      {
        title: '记录时间',
        dataIndex: 'created_at',
        key: 'created_at',
        hideInSearch: true,
        render: (_, record) => formatUTCTimeToBeijing(record.created_at),
      },
      {
        title: '操作',
        valueType: 'option',
        key: 'option',
        width: 80,
        render: (_, record) => [
          <a key="detail" onClick={() => setDetail(record)}>
            详情
          </a>,
        ],
      },
    ],
    [],
  );

  const handleExport = async () => {
    setExporting(true);
    message.loading({ content: '正在导出慢查询日志...', key: 'slow-query-export', duration: 0 });
    try {
      const response = await getSlowQueryLogs({
        ...lastSearchRef.current,
        page: 1,
        page_size: EXPORT_LIMIT,
      });
      const payload = resolvePayload(response);
      const rows: SlowQueryLogItem[] = payload?.data || [];
      if (!rows.length) {
        message.warning({ content: '没有可导出的慢查询记录', key: 'slow-query-export' });
        return;
      }
      const xlsxModule = await import('xlsx');
      const XLSX = (
        'default' in xlsxModule && xlsxModule.default !== null ? xlsxModule.default : xlsxModule
      ) as typeof import('xlsx');
      const sheetRows = rows.map((item) => ({
        记录时间: formatUTCTimeToBeijing(item.created_at),
        耗时: item.duration || `${item.duration_ms}ms`,
        耗时毫秒: item.duration_ms,
        集合名: item.collection,
        操作类型: item.operation,
        查询内容: item.complete_query,
        错误信息: item.error || '',
      }));
      const ws = XLSX.utils.json_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '慢查询日志');
      XLSX.writeFile(wb, `慢查询日志_${dayjs().format('YYYY-MM-DD_HHmmss')}.xlsx`);
      message.success({ content: `已导出 ${rows.length} 条`, key: 'slow-query-export' });
    } catch (error: any) {
      message.error({ content: error?.message || '导出失败', key: 'slow-query-export' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageContainer>
      <ProTable<SlowQueryLogItem>
        actionRef={actionRef}
        rowKey={(record) => record.id || `${record.collection}-${record.timestamp}-${record.duration_ms}`}
        columns={columns}
        request={async (params = {}) => {
          const queryParams = buildQueryParams(params as Record<string, any>);
          lastSearchRef.current = queryParams;
          const response = await getSlowQueryLogs(queryParams);
          const payload = resolvePayload(response);
          return {
            data: payload?.data || [],
            success: true,
            total: payload?.total || 0,
          };
        }}
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          defaultPageSize: 10,
        }}
        toolbar={{
          actions: [
            <Button key="export" loading={exporting} disabled={exporting} onClick={handleExport}>
              导出 Excel
            </Button>,
          ],
        }}
      />
      <Drawer
        title="慢查询详情"
        open={!!detail}
        width={860}
        destroyOnClose
        onClose={() => setDetail(undefined)}
      >
        {detail ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="记录时间">
                {formatUTCTimeToBeijing(detail.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="耗时">
                <Tag color={durationColor(detail.duration_ms)}>
                  {detail.duration || `${detail.duration_ms}ms`}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="集合">{detail.collection || '-'}</Descriptions.Item>
              <Descriptions.Item label="操作">{detail.operation || '-'}</Descriptions.Item>
              <Descriptions.Item label="错误" span={2}>
                {detail.error || '-'}
              </Descriptions.Item>
            </Descriptions>
            <div>
              <Typography.Title level={5}>查询内容</Typography.Title>
              <Typography.Paragraph copyable style={{ whiteSpace: 'pre-wrap' }}>
                {detail.complete_query || '-'}
              </Typography.Paragraph>
            </div>
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default SlowQueryLog;
