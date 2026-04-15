import { addDefaultGroup, getDefaultGroup, removeDefaultGroup } from '@/services/default';
import SelectGroupModal from '@/components/SelectGroupModal';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Popconfirm, message } from 'antd';
import { useMemo, useRef, useState } from 'react';

interface DefaultGroupItem {
  group_id: string;
  group_name?: string;
  org_id: string;
  created_at: number;
}

const DefaultGroup = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const removeDefaultGroupHandler = async (groupID: string) => {
    try {
      await removeDefaultGroup([groupID]);
      message.success(intl.formatMessage({ id: 'api.success' }));
      actionRef.current?.reload();
    } catch (error) {
      console.error('Remove default group error:', error);
      message.error(intl.formatMessage({ id: 'api.failed' }));
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleOk = async (groups: API.GroupManage.GroupInfo[]) => {
    if (!groups || groups.length === 0) {
      message.warning(intl.formatMessage({ id: 'group.groupID.tips' }) || '请选择群组');
      return;
    }
    try {
      const groupIDs = groups.map((group) => group.groupID);
      await addDefaultGroup(groupIDs);
      message.success(intl.formatMessage({ id: 'api.success' }));
      setIsModalOpen(false);
      actionRef.current?.reload();
    } catch (error) {
      console.error('Add default group error:', error);
      message.error(intl.formatMessage({ id: 'api.failed' }));
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
        title: intl.formatMessage({ id: 'pages.searchTable.titleOption' }),
        valueType: 'option',
        key: 'option',
        align: 'center',
        width: 100,
        render: (_, record) => [
          <Popconfirm
            key="remove"
            title={intl.formatMessage({ id: 'group.removeDefaultGroup.tips' })}
            onConfirm={() => removeDefaultGroupHandler(record.group_id)}
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
        isModalOpen={isModalOpen}
        selectType="checkbox"
        onCancel={handleCancel}
        onOk={handleOk}
      />
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
            console.log('Default group API response:', data);
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
        rowKey="group_id"
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
