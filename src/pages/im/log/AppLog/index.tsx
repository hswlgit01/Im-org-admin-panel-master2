import type { AppLogItem } from '@/services/appLog';
import { getAppLogs } from '@/services/appLog';
import { formatUTCTimeToBeijing } from '@/utils/common';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { Descriptions, Drawer, Space, Tag, Typography } from 'antd';
import { useMemo, useRef, useState } from 'react';

const LEVEL_OPTIONS = [
  { label: 'DEBUG', value: 'DEBUG' },
  { label: 'INFO', value: 'INFO' },
  { label: 'WARN', value: 'WARN' },
  { label: 'ERROR', value: 'ERROR' },
  { label: 'FATAL', value: 'FATAL' },
];

const PLATFORM_OPTIONS = [
  { label: 'iOS', value: 1 },
  { label: 'Android', value: 2 },
  { label: 'Windows', value: 3 },
  { label: 'MacOS', value: 4 },
  { label: 'Web', value: 5 },
  { label: 'Linux', value: 7 },
  { label: 'AndroidPad', value: 8 },
  { label: 'iPad', value: 9 },
];

const levelColor = (level?: string) => {
  if (level === 'ERROR' || level === 'FATAL') return 'red';
  if (level === 'WARN') return 'orange';
  if (level === 'INFO') return 'blue';
  return 'default';
};

const platformLabel = (platform?: number) => {
  return PLATFORM_OPTIONS.find((item) => item.value === platform)?.label || platform || '-';
};

const displayAccount = (record: AppLogItem) => {
  return (
    record.attribute?.account ||
    record.attribute?.nickname ||
    record.user?.nickname ||
    record.user_id ||
    '-'
  );
};

const formatJson = (value?: Record<string, unknown>) => {
  if (!value || Object.keys(value).length === 0) return '-';
  return JSON.stringify(value, null, 2);
};

const AppLog = () => {
  const actionRef = useRef<ActionType>();
  const [detail, setDetail] = useState<AppLogItem>();

  const columns: ProColumns<AppLogItem>[] = useMemo(
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
        key: 'keyword',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: {
          placeholder: '账号 / 昵称 / 用户ID / 内容',
        },
      },
      {
        title: '用户ID',
        dataIndex: 'im_server_user_id',
        key: 'im_server_user_id',
        hideInTable: true,
        fieldProps: {
          placeholder: 'IM 用户ID',
        },
      },
      {
        title: '日志级别',
        dataIndex: 'level',
        key: 'level',
        valueType: 'select',
        fieldProps: {
          allowClear: true,
          options: LEVEL_OPTIONS,
        },
        render: (_, record) => <Tag color={levelColor(record.level)}>{record.level || '-'}</Tag>,
      },
      {
        title: '平台',
        dataIndex: 'platform',
        key: 'platform',
        valueType: 'select',
        fieldProps: {
          allowClear: true,
          options: PLATFORM_OPTIONS,
        },
        render: (_, record) => <Tag>{platformLabel(record.platform)}</Tag>,
      },
      {
        title: '时间范围',
        dataIndex: 'server_time',
        key: 'server_time',
        valueType: 'dateTimeRange',
        hideInTable: true,
      },
      {
        title: '账号/昵称',
        key: 'account',
        hideInSearch: true,
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{displayAccount(record)}</Typography.Text>
            <Typography.Text type="secondary">{record.im_server_user_id || '-'}</Typography.Text>
          </Space>
        ),
      },
      {
        title: '标签',
        dataIndex: 'tag',
        key: 'tag',
        hideInSearch: true,
        width: 120,
      },
      {
        title: '日志内容',
        dataIndex: 'message',
        key: 'message',
        hideInSearch: true,
        ellipsis: true,
        render: (_, record) => (
          <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0, maxWidth: 520 }}>
            {record.message}
          </Typography.Paragraph>
        ),
      },
      {
        title: 'App版本',
        dataIndex: 'app_version',
        key: 'app_version',
        fieldProps: {
          placeholder: '版本号',
        },
      },
      {
        title: '设备ID',
        dataIndex: 'device_id',
        key: 'device_id',
        ellipsis: true,
        fieldProps: {
          placeholder: '设备ID',
        },
      },
      {
        title: '上传原因',
        dataIndex: 'reason',
        key: 'reason',
        fieldProps: {
          placeholder: 'startup / paused / logout',
        },
      },
      {
        title: '服务端时间',
        dataIndex: 'server_time',
        key: 'server_time_column',
        hideInSearch: true,
        render: (_, record) => formatUTCTimeToBeijing(record.server_time),
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

  return (
    <PageContainer>
      <ProTable<AppLogItem>
        actionRef={actionRef}
        rowKey={(record) => record.id || `${record.batch_id}-${record.client_time}`}
        columns={columns}
        request={async (params = {}) => {
          const query = params as Record<string, any>;
          const timeRange = Array.isArray(query.server_time) ? query.server_time : undefined;
          const { data } = await getAppLogs({
            page: query.current || 1,
            page_size: query.pageSize || 10,
            keyword: typeof query.keyword === 'string' ? query.keyword.trim() : undefined,
            im_server_user_id:
              typeof query.im_server_user_id === 'string'
                ? query.im_server_user_id.trim()
                : undefined,
            level: typeof query.level === 'string' ? query.level : undefined,
            platform: query.platform ? Number(query.platform) : undefined,
            device_id: typeof query.device_id === 'string' ? query.device_id.trim() : undefined,
            app_version:
              typeof query.app_version === 'string' ? query.app_version.trim() : undefined,
            reason: typeof query.reason === 'string' ? query.reason.trim() : undefined,
            start_time: timeRange?.[0]
              ? Math.floor(new Date(timeRange[0]).getTime() / 1000)
              : undefined,
            end_time: timeRange?.[1]
              ? Math.floor(new Date(timeRange[1]).getTime() / 1000)
              : undefined,
          });
          return {
            data: data?.data || [],
            success: true,
            total: data?.total || 0,
          };
        }}
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          defaultPageSize: 10,
        }}
      />
      <Drawer
        title="App日志详情"
        open={!!detail}
        width={760}
        destroyOnClose
        onClose={() => setDetail(undefined)}
      >
        {detail ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="账号/昵称">{displayAccount(detail)}</Descriptions.Item>
              <Descriptions.Item label="用户ID">
                {detail.im_server_user_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="级别">
                <Tag color={levelColor(detail.level)}>{detail.level || '-'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="平台">{platformLabel(detail.platform)}</Descriptions.Item>
              <Descriptions.Item label="App版本">{detail.app_version || '-'}</Descriptions.Item>
              <Descriptions.Item label="系统">{detail.system_type || '-'}</Descriptions.Item>
              <Descriptions.Item label="设备ID">{detail.device_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="来源IP">{detail.source_ip || '-'}</Descriptions.Item>
              <Descriptions.Item label="上传原因">{detail.reason || '-'}</Descriptions.Item>
              <Descriptions.Item label="标签">{detail.tag || '-'}</Descriptions.Item>
              <Descriptions.Item label="客户端时间">
                {formatUTCTimeToBeijing(detail.client_time)}
              </Descriptions.Item>
              <Descriptions.Item label="服务端时间">
                {formatUTCTimeToBeijing(detail.server_time)}
              </Descriptions.Item>
              <Descriptions.Item label="Session">{detail.session_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="Batch">{detail.batch_id || '-'}</Descriptions.Item>
            </Descriptions>
            <div>
              <Typography.Title level={5}>日志内容</Typography.Title>
              <Typography.Paragraph copyable style={{ whiteSpace: 'pre-wrap' }}>
                {detail.message || '-'}
              </Typography.Paragraph>
            </div>
            <div>
              <Typography.Title level={5}>Stack</Typography.Title>
              <Typography.Paragraph copyable style={{ whiteSpace: 'pre-wrap' }}>
                {detail.stack || '-'}
              </Typography.Paragraph>
            </div>
            <div>
              <Typography.Title level={5}>Extra</Typography.Title>
              <Typography.Paragraph copyable style={{ whiteSpace: 'pre-wrap' }}>
                {formatJson(detail.extra)}
              </Typography.Paragraph>
            </div>
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default AppLog;
