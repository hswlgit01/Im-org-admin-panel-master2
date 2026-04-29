import type { IPBlockItem } from '@/services/ipBlock';
import { createIPBlock, deleteIPBlock, getIPBlockList } from '@/services/ipBlock';
import {
  ActionType,
  ModalForm,
  PageContainer,
  ProColumns,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Popconfirm, Space, Tag, message } from 'antd';
import { useMemo, useRef } from 'react';

const IP_BLOCK_SCOPE_OPTIONS = [
  { label: '限制登录', value: 4 },
  { label: '限制注册', value: 5 },
  { label: '注册和登录', value: 6 },
];

const getScopeState = (record: Pick<IPBlockItem, 'limit_login' | 'limit_register'>) => {
  if (record.limit_login && record.limit_register) return 6;
  if (record.limit_login) return 4;
  if (record.limit_register) return 5;
  return 0;
};

const getScopeLabel = (state: number) => {
  const option = IP_BLOCK_SCOPE_OPTIONS.find((item) => item.value === state);
  return option?.label || '未设置';
};

const getScopeColor = (state: number) => {
  if (state === 6) return 'volcano';
  if (state === 4) return 'orange';
  if (state === 5) return 'red';
  return 'default';
};

const scopeToLimitFlags = (state: number) => ({
  limit_login: state === 4 || state === 6,
  limit_register: state === 5 || state === 6,
});

const IPBlock = () => {
  const actionRef = useRef<ActionType>();

  const columns: ProColumns<IPBlockItem>[] = useMemo(
    () => [
      {
        key: 'index',
        dataIndex: 'index',
        valueType: 'indexBorder',
        width: 48,
        hideInSearch: true,
      },
      {
        title: 'IP地址',
        dataIndex: 'keyword',
        key: 'keyword',
        hideInTable: true,
        fieldProps: {
          placeholder: '输入 IP 搜索',
        },
      },
      {
        title: '封锁类型',
        dataIndex: 'state',
        key: 'state',
        hideInTable: true,
        valueType: 'select',
        fieldProps: {
          allowClear: true,
          placeholder: '请选择封锁类型',
          options: IP_BLOCK_SCOPE_OPTIONS,
        },
      },
      {
        title: 'IP地址',
        dataIndex: 'ip',
        key: 'ip',
        copyable: true,
        hideInSearch: true,
      },
      {
        title: '限制范围',
        key: 'scope',
        hideInSearch: true,
        render: (_, record) => (
          <Space>
            <Tag color={getScopeColor(getScopeState(record))}>
              {getScopeLabel(getScopeState(record))}
            </Tag>
          </Space>
        ),
      },
      {
        title: '创建时间',
        dataIndex: 'create_time',
        key: 'create_time',
        valueType: 'dateTime',
        hideInSearch: true,
      },
      {
        title: '操作',
        valueType: 'option',
        key: 'option',
        width: 100,
        render: (_, record) => [
          <Popconfirm
            key="delete"
            title={`确定移除 ${record.ip} 的封锁吗？`}
            onConfirm={async () => {
              await deleteIPBlock([record.ip]);
              message.success('已移除');
              actionRef.current?.reload();
            }}
          >
            <a>移除</a>
          </Popconfirm>,
        ],
      },
    ],
    [],
  );

  return (
    <PageContainer>
      <ProTable<IPBlockItem>
        actionRef={actionRef}
        rowKey="ip"
        columns={columns}
        request={async (params = {}) => {
          const { data } = await getIPBlockList({
            keyword: typeof params.keyword === 'string' ? params.keyword.trim() : '',
            state: params.state === undefined || params.state === '' ? 0 : Number(params.state),
            page: params.current || 1,
            page_size: params.pageSize || 10,
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
        toolbar={{
          actions: [
            <ModalForm
              key="add"
              title="新增 IP 封锁"
              trigger={<Button type="primary">新增 IP 封锁</Button>}
              modalProps={{
                destroyOnClose: true,
              }}
              initialValues={{
                state: 5,
              }}
              onFinish={async (values) => {
                const state = Number(values.state || 5);
                const flags = scopeToLimitFlags(state);
                await createIPBlock({
                  ip: String(values.ip || '').trim(),
                  ...flags,
                });
                message.success('保存成功');
                actionRef.current?.reload();
                return true;
              }}
            >
              <ProFormText
                name="ip"
                label="IP地址"
                rules={[{ required: true, message: '请输入 IP 地址' }]}
                fieldProps={{ placeholder: '例如 192.168.1.10' }}
              />
              <ProFormSelect
                name="state"
                label="封锁类型"
                options={IP_BLOCK_SCOPE_OPTIONS}
                rules={[{ required: true, message: '请选择封锁类型' }]}
              />
            </ModalForm>,
          ],
          settings: [],
        }}
      />
    </PageContainer>
  );
};

export default IPBlock;
