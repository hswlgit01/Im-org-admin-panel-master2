import type { IPBlockItem } from '@/services/ipBlock';
import { createIPBlock, deleteIPBlock, getIPBlockList } from '@/services/ipBlock';
import {
  ActionType,
  ModalForm,
  PageContainer,
  ProColumns,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Popconfirm, Space, Tag, message } from 'antd';
import { useMemo, useRef } from 'react';

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
        initialValue: 0,
        valueEnum: {
          0: { text: '全部' },
          5: { text: '限制注册' },
          4: { text: '限制登录' },
          6: { text: '注册和登录' },
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
            {record.limit_register ? <Tag color="red">注册</Tag> : null}
            {record.limit_login ? <Tag color="orange">登录</Tag> : null}
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
            state: Number(params.state ?? 0),
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
                limit_register: true,
                limit_login: false,
              }}
              onFinish={async (values) => {
                await createIPBlock({
                  ip: String(values.ip || '').trim(),
                  limit_register: Boolean(values.limit_register),
                  limit_login: Boolean(values.limit_login),
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
              <ProFormSwitch name="limit_register" label="限制注册" />
              <ProFormSwitch name="limit_login" label="限制登录" />
            </ModalForm>,
          ],
          settings: [],
        }}
      />
    </PageContainer>
  );
};

export default IPBlock;
