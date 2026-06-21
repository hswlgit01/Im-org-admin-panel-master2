import SelectGroupModal from '@/components/SelectGroupModal';
import { addDefaultGroup, getDefaultGroup, removeDefaultGroup } from '@/services/default';
import { searchLevel2Salespeople } from '@/services/hierarchy';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Modal, Popconfirm, Select, Space, Tag, message } from 'antd';
import { useMemo, useRef, useState } from 'react';

interface DefaultGroupItem {
  id?: string;
  group_id: string;
  group_name?: string;
  org_id: string;
  salesperson_user_id?: string;
  salesperson_nickname?: string;
  salesperson_account?: string;
  salesperson_im_server_user_id?: string;
  created_at: number;
}

type SalespersonOption = {
  value: string;
  label: string;
};

const DefaultGroup = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<API.GroupManage.GroupInfo[]>([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>();
  const [salespersonOptions, setSalespersonOptions] = useState<SalespersonOption[]>([]);
  const [salespersonLoading, setSalespersonLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const removeDefaultGroupHandler = async (record: DefaultGroupItem) => {
    try {
      await removeDefaultGroup([record.group_id], record.id ? [record.id] : []);
      message.success(intl.formatMessage({ id: 'api.success' }));
      actionRef.current?.reload();
    } catch (error) {
      console.error('Remove default group error:', error);
      message.error(intl.formatMessage({ id: 'api.failed' }));
    }
  };

  const showModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCancel = () => {
    setIsAddModalOpen(false);
    setIsGroupModalOpen(false);
    setSelectedGroups([]);
    setSelectedSalesperson(undefined);
    setSalespersonOptions([]);
  };

  const handleGroupSelectOk = (groups: API.GroupManage.GroupInfo[]) => {
    setSelectedGroups(groups || []);
    setIsGroupModalOpen(false);
  };

  const searchSalespeople = async (keyword: string) => {
    const kw = keyword.trim();
    if (!kw) {
      setSalespersonOptions([]);
      return;
    }
    setSalespersonLoading(true);
    try {
      const resp = await searchLevel2Salespeople(kw);
      const users = resp?.data?.users || [];
      setSalespersonOptions(
        users.map((user: any) => ({
          value: user.user_id,
          label: `${user.nickname || user.account || user.user_id}${
            user.account ? `（${user.account}）` : ''
          }`,
        })),
      );
    } catch (error) {
      console.error('Search salesperson error:', error);
      setSalespersonOptions([]);
    } finally {
      setSalespersonLoading(false);
    }
  };

  const handleOk = async () => {
    if (!selectedGroups || selectedGroups.length === 0) {
      message.warning(intl.formatMessage({ id: 'group.groupID.tips' }) || '请选择群组');
      return;
    }
    setSubmitting(true);
    try {
      const groupIDs = selectedGroups.map((group) => group.groupID);
      await addDefaultGroup(groupIDs, selectedSalesperson);
      message.success(intl.formatMessage({ id: 'api.success' }));
      handleCancel();
      actionRef.current?.reload();
    } catch (error) {
      console.error('Add default group error:', error);
      message.error(intl.formatMessage({ id: 'api.failed' }));
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ProColumns<DefaultGroupItem>[] = useMemo(
    () => [
      {
        key: 'index',
        dataIndex: 'index',
        valueType: 'indexBorder',
        width: 48,
      },
      {
        title: intl.formatMessage({ id: 'user.keyword' }),
        key: 'keyword',
        dataIndex: 'keyword',
        hideInTable: true,
        align: 'center',
      },
      {
        title: intl.formatMessage({ id: 'group.groupName' }),
        dataIndex: 'group_name',
        key: 'group_name',
        align: 'center',
        hideInSearch: true,
        render: (_, record) => record.group_name || '-',
      },
      {
        title: intl.formatMessage({ id: 'group.groupID' }),
        dataIndex: 'group_id',
        key: 'group_id',
        align: 'center',
        hideInSearch: true,
        copyable: true,
      },
      {
        // dawn 2026-06-14 默认群列表增加所属业务员列，空值表示全体新会员。
        title: '所属业务员',
        dataIndex: 'salesperson_user_id',
        key: 'salesperson_user_id',
        align: 'center',
        hideInSearch: true,
        render: (_, record) => {
          if (!record.salesperson_user_id) {
            return <Tag color="blue">全部会员</Tag>;
          }
          const name =
            record.salesperson_nickname || record.salesperson_account || record.salesperson_user_id;
          const account =
            record.salesperson_account && record.salesperson_account !== name
              ? `（${record.salesperson_account}）`
              : '';
          return (
            <Space direction="vertical" size={0}>
              <span>{name}</span>
              <span className="text-xs text-gray-400">{account || record.salesperson_user_id}</span>
            </Space>
          );
        },
      },
      {
        // dawn 2026-06-21 修复默认群操作列文案：避免国际化未加载时展示原始 key。
        title: '操作',
        valueType: 'option',
        key: 'option',
        align: 'center',
        width: 100,
        render: (_, record) => [
          <Popconfirm
            key="remove"
            title={intl.formatMessage({ id: 'group.removeDefaultGroup.tips' })}
            onConfirm={() => removeDefaultGroupHandler(record)}
            okText={intl.formatMessage({ id: 'confirm' })}
            cancelText={intl.formatMessage({ id: 'cancel' })}
          >
            <a>{intl.formatMessage({ id: 'remove' })}</a>
          </Popconfirm>,
        ],
      },
    ],
    [intl],
  );

  return (
    <PageContainer>
      <SelectGroupModal
        isModalOpen={isGroupModalOpen}
        selectType="checkbox"
        onCancel={() => setIsGroupModalOpen(false)}
        onOk={handleGroupSelectOk}
      />
      <Modal
        title="新增默认群"
        open={isAddModalOpen}
        onCancel={handleCancel}
        onOk={handleOk}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <div className="mb-2">默认群组</div>
            <Button onClick={() => setIsGroupModalOpen(true)}>选择群组</Button>
            <Space wrap style={{ marginTop: 8 }}>
              {selectedGroups.map((group) => (
                <Tag key={group.groupID}>{group.groupName || group.groupID}</Tag>
              ))}
            </Space>
          </div>
          <div>
            <div className="mb-2">所属业务员</div>
            <Select
              allowClear
              showSearch
              filterOption={false}
              loading={salespersonLoading}
              value={selectedSalesperson}
              options={salespersonOptions}
              placeholder="输入2级业务员账号或昵称搜索"
              style={{ width: '100%' }}
              onSearch={searchSalespeople}
              onChange={(value) => setSelectedSalesperson(value)}
              onClear={() => setSelectedSalesperson(undefined)}
            />
          </div>
        </Space>
      </Modal>
      <ProTable<DefaultGroupItem>
        columns={columns}
        actionRef={actionRef}
        request={async (params = {}) => {
          try {
            const { data } = await getDefaultGroup({
              keyword: params.keyword || '',
              page: params.current || 1,
              page_size: params.pageSize || 10,
            });
            return {
              data: data?.data || [],
              success: true,
              total: data?.total || 0,
            };
          } catch (error) {
            console.error('Get default group error:', error);
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        rowKey={(record) =>
          record.id || `${record.group_id}_${record.salesperson_user_id || 'all'}`
        }
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
        search={{
          labelWidth: 'auto',
        }}
        toolbar={{
          actions: [
            <Button key="add" type="primary" onClick={showModal}>
              {intl.formatMessage({ id: 'add' })}
            </Button>,
          ],
          settings: [],
        }}
        options={{
          reload: true,
          density: true,
          setting: true,
        }}
      />
    </PageContainer>
  );
};

export default DefaultGroup;
