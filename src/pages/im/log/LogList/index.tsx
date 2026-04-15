import { deleteLog, getLogs } from '@/services/logs';
import { formatUTCTimeToBeijing } from '@/utils/common';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { message, Space, Tag, Typography } from 'antd';
import Popconfirm from 'antd/es/popconfirm';
import moment from 'moment';
import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

const operation_type_map = {
  "CreateGroup": '创建群组',
  "AddBlockUser": '添加黑名单',
  "UnBlockUser": '移除黑名单',
  "UpdateOrgInfo": '修改组织信息',

  "CreateOrganizationCurrency": '创建组织货币',
  "UpdateOrgCurrency": '修改组织货币',
  "CreateBackendAdmin": '创建组织管理员',

  "UpdateUserRole": '修改用户角色',
  "UpdateUserCanSendMsg": '修改用户是否可以发送消息',

  "CreateUserTag": '创建用户标签',
  "UpdateUserTag": '修改用户标签',
  "UpdateUserTagAssign": '给用户打标签',

  "UpdateUserRolePermission": '修改用户角色权限',

  "UpdateWalletPassword": '修改组织钱包密码',

  "CreateCheckinRewardCfg": '创建签到奖励配置',
  "DeleteCheckinRewardCfg": '删除签到奖励配置',
  "ApproveUserCheckinReward": '审批用户签到奖励',
  "SupplementCheckin": '补签操作记录',
  "WithdrawalAudit": '提现审核',
  "WithdrawalApproved": '提现通过',

  "CreateLottery": '创建抽奖活动',
  "UpdateLottery": '修改抽奖活动',
  "AuditLotteryRecord": '审批抽奖记录',
  "CreateDefaultFriend": '创建默认好友',
  "DeleteDefaultFriend": '删除默认好友',

}
const LogList = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();


  const columns: ProColumns<API.LogManage.LogItem>[] = [
    {
      key: 'index',
      dataIndex: 'index',
      valueType: 'indexBorder',
      align: 'center',
    },
    {
      title: intl.formatMessage({ id: 'user.keyword' }),
      key: 'keyword',
      dataIndex: 'keyword',
      editable: false,
      hideInTable: true,
      align: 'center',
    },
    {
      title: intl.formatMessage({ id: 'user.userID' }),
      key: 'im_server_user_id',
      dataIndex: 'im_server_user_id',
      align: 'center',
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({ id: 'user.nickname' }),
      key: 'nickname',
      dataIndex: 'nickname',
      hideInSearch: true,
      align: 'center',
    },
    {
      title: intl.formatMessage({ id: 'pages.login.account' }),
      key: 'account',
      dataIndex: 'account',
      hideInSearch: true,
      align: 'center',
    },
    {
      title: '操作类型',
      key: 'operation_log_type',
      dataIndex: 'operation_log_type',
      valueType: 'select',
      valueEnum: operation_type_map,
      align: 'center',
      render: (_, record) => <Tag color='blue'>{operation_type_map[record.operation_type]}</Tag>,
    },
    {
      title: '操作时间',
      dataIndex: 'operation_time',
      align: 'center',
      hideInSearch: true,
      render: (operation_time) => formatUTCTimeToBeijing(operation_time),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.LogManage.LogItem>
        columns={columns}
        actionRef={actionRef}
        request={async (params = {}) => {
          const { data } = await getLogs({
            page: params.current as number,
            page_size: params.pageSize as number,
            operation_log_type: params.operation_log_type,
            keyword: params.keyword,
          });
          let tmpData = data.data ?? [];
          tmpData = tmpData.map((item) => {
            return {
              ...item,
              nickname: item.user.nickname,
              account: item.attribute.account,
            };
          });
          return {
            data: tmpData,
            success: true,
            total: data.total,
          };
        }}
        rowKey={() => uuidv4()}
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          defaultPageSize: 10,
        }}
      />
    </PageContainer>
  );
};

export default LogList;
