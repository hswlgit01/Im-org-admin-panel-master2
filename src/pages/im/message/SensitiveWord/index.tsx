import type { SensitiveWordItem } from '@/services/sensitiveWord';
import {
  createSensitiveWord,
  deleteSensitiveWords,
  getSensitiveWordList,
  updateSensitiveWord,
} from '@/services/sensitiveWord';
import {
  ActionType,
  ModalForm,
  PageContainer,
  ProColumns,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Modal, Tag, message } from 'antd';
import { useMemo, useRef, useState } from 'react';

const SENSITIVE_WORD_STATUS_OPTIONS = [
  { label: '启用', value: 1 },
  { label: '停用', value: 2 },
];

const getStatusTag = (status: number) => {
  if (status === 2) {
    return <Tag color="default">停用</Tag>;
  }
  return <Tag color="green">启用</Tag>;
};

// dawn 2026-05-14 新增敏感词维护：提供词表增删改查页面，供消息服务实时读取并脱敏。
const SensitiveWord = () => {
  const actionRef = useRef<ActionType>();
  const [editingRecord, setEditingRecord] = useState<SensitiveWordItem>();

  const columns: ProColumns<SensitiveWordItem>[] = useMemo(
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
          placeholder: '输入敏感词搜索',
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        valueType: 'select',
        valueEnum: {
          1: { text: '启用' },
          2: { text: '停用' },
        },
        render: (_, record) => getStatusTag(record.status),
      },
      {
        title: '敏感词',
        dataIndex: 'word',
        key: 'word',
        copyable: true,
        hideInSearch: true,
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        ellipsis: true,
        hideInSearch: true,
      },
      {
        title: '更新时间',
        dataIndex: 'update_time',
        key: 'update_time',
        valueType: 'dateTime',
        hideInSearch: true,
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
        width: 130,
        render: (_, record) => [
          <a key="edit" onClick={() => setEditingRecord(record)}>
            编辑
          </a>,
          <a
            key="delete"
            onClick={() => {
              Modal.confirm({
                title: '确定删除该敏感词吗？',
                content: record.word,
                onOk: async () => {
                  await deleteSensitiveWords([record.id]);
                  message.success('删除成功');
                  actionRef.current?.reload();
                },
              });
            }}
          >
            删除
          </a>,
        ],
      },
    ],
    [],
  );

  const renderFormItems = () => (
    <>
      <ProFormText
        name="word"
        label="敏感词"
        rules={[
          { required: true, message: '请输入敏感词' },
          { max: 100, message: '敏感词长度不能超过100个字符' },
        ]}
        fieldProps={{ placeholder: '请输入需要替换的词' }}
      />
      <ProFormSelect
        name="status"
        label="状态"
        options={SENSITIVE_WORD_STATUS_OPTIONS}
        rules={[{ required: true, message: '请选择状态' }]}
      />
      <ProFormTextArea
        name="remark"
        label="备注"
        fieldProps={{ rows: 3, maxLength: 200, showCount: true }}
      />
    </>
  );

  return (
    <PageContainer>
      <ProTable<SensitiveWordItem>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params = {}) => {
          const response = await getSensitiveWordList({
            keyword: typeof params.keyword === 'string' ? params.keyword.trim() : '',
            status:
              params.status === undefined || params.status === ''
                ? undefined
                : Number(params.status),
            page: params.current || 1,
            page_size: params.pageSize || 10,
          });
          const payload =
            response?.data?.data || response?.data?.total !== undefined
              ? response.data
              : response?.data || response;
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
            <ModalForm
              key="add"
              title="新增敏感词"
              trigger={<Button type="primary">新增敏感词</Button>}
              modalProps={{ destroyOnClose: true }}
              initialValues={{ status: 1 }}
              onFinish={async (values) => {
                await createSensitiveWord({
                  word: String(values.word || '').trim(),
                  status: Number(values.status || 1),
                  remark: String(values.remark || '').trim(),
                });
                message.success('保存成功');
                actionRef.current?.reload();
                return true;
              }}
            >
              {renderFormItems()}
            </ModalForm>,
          ],
          settings: [],
        }}
      />
      <ModalForm
        title="编辑敏感词"
        visible={!!editingRecord}
        onVisibleChange={(visible) => {
          if (!visible) setEditingRecord(undefined);
        }}
        modalProps={{
          destroyOnClose: true,
        }}
        initialValues={editingRecord}
        onFinish={async (values) => {
          if (!editingRecord) return false;
          await updateSensitiveWord({
            id: editingRecord.id,
            word: String(values.word || '').trim(),
            status: Number(values.status || 1),
            remark: String(values.remark || '').trim(),
          });
          message.success('保存成功');
          setEditingRecord(undefined);
          actionRef.current?.reload();
          return true;
        }}
      >
        {renderFormItems()}
      </ModalForm>
    </PageContainer>
  );
};

export default SensitiveWord;
