import { deleteRewardConfig, selectRewardConfigList } from '@/services/checkin';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Popconfirm, Space, Tooltip, message } from 'antd';
import { useMemo, useRef, useState } from 'react';
import ModifyConfigModal from './components/ModifyConfigModal';

export type DrawerOptions = {
  visible: boolean;
  selectUser: API.UserManage.User | undefined;
};
const formatUTCTimeToLocal = (isoString: string) => {
  const date = new Date(isoString);
  const localTimeString = date
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(/\//g, '-')
    .replace(', ', ' ');

  return localTimeString;
};

const reward_type_map = {
  cash: '余额',
  lottery: '抽奖券',
  integral: '积分',
};

const RewardConfigList = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();

  const [currentConfig, setCurrentConfig] = useState(null);
  const [configModalVisible, setConfigModalVisible] = useState(false);

  const columns: ProColumns<API.UserManage.User>[] = useMemo(
    () => [
      {
        key: 'index',
        dataIndex: 'index',
        valueType: 'indexBorder',
      },

      {
        title: '连续天数',
        key: 'streak',
        dataIndex: 'streak',
        hideInSearch: true,
        align: 'center',
      },
      {
        title: '奖励类型',
        key: 'type',
        dataIndex: 'type',
        hideInSearch: true,
        align: 'center',
        render: (type) => <div>{reward_type_map[type]}</div>,
      },
      {
        title: '奖励数量',
        key: 'reward_count',
        dataIndex: 'reward_amount',
        hideInSearch: true,
        align: 'center',
        render: (reward_amount, record) => {
          if (record.type === 'cash') {
            return `${reward_amount} ${record.reward_currency_info?.name || ''}`;
          }
          return reward_amount;
        },
      },
      {
        title: '抽奖券',
        key: 'reward_lottery_info',
        dataIndex: 'reward_lottery_info',
        hideInSearch: true,
        align: 'center',
        render: (_, record) => {
          if (record.type === 'lottery') {
            return (
              <Tooltip title={record.reward_lottery_info.desc}>
                {record.reward_lottery_info.name}
              </Tooltip>
            );
          }
          return '-';
        },
      },
      {
        title: '操作',
        key: 'action',
        hideInSearch: true,
        render: (_: any, record: any) => (
          <Space size="middle">
            <Popconfirm
              title="确定要删除此规则吗?"
              onConfirm={async () => {
                await deleteRewardConfig({ id: record.id });
                message.success('删除成功');
                actionRef.current?.reload();
              }}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link">删除</Button>
            </Popconfirm>
            <Button
              danger
              type="link"
              onClick={() => {
                setConfigModalVisible(true);
                record.reward_type = record.type;
                setCurrentConfig(record);
              }}
            >
              编辑
            </Button>
          </Space>
        ),
      },
    ],
    [],
  );

  return (
    <PageContainer>
      <ModifyConfigModal
        visible={configModalVisible}
        onCancel={() => {
          setConfigModalVisible(false);
          setCurrentConfig(null);
        }}
        actionRef={actionRef}
        initData={currentConfig}
      />
      <ProTable<API.UserManage.User>
        headerTitle="连续签到奖励配置"
        columns={columns}
        search={false}
        actionRef={actionRef}
        request={async (params = {}) => {
          console.log(params, 'params');
          // const { data } = await getOrganizationUsers({
          //   pageNumber: params.current as number,
          //   showNumber: params.pageSize as number,
          //   keyword: params.nickname,
          // });
          const { data } = await selectRewardConfigList({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.nickname,
          });

          const tmpData = data.data ?? [];
          return {
            data: tmpData,
            success: true,
            total: data.total,
          };
        }}
        toolBarRender={() => (
          <Button type="primary" onClick={() => setConfigModalVisible(true)}>
            新增规则
          </Button>
        )}
        pagination={{
          defaultPageSize: 10,
          showQuickJumper: true,
        }}
      />
    </PageContainer>
  );
};

export default RewardConfigList;
