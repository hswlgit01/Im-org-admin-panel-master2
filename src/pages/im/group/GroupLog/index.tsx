
import {
  selectGroupLog,
} from '@/services/group';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useIntl, useLocation } from '@umijs/max';
import { useEffect, useMemo, useRef } from 'react';

import { formatUTCTimeToBeijing } from '@/utils/common';
  // GroupOpTypeCreateGroup      = 1001 // 创建群组
  //   GroupOpTypeKickMember       = 1002 // 踢出群成员
  //   GroupOpTypeDismissGroup     = 1003 // 解散群组
  //   GroupOpTypeTransferOwner    = 1004 // 转移群主
  //   GroupOpTypeMuteMember       = 1005 // 禁言群成员
  //   GroupOpTypeCancelMuteMember = 1006 // 取消禁言群成员
  //   GroupOpTypeMuteGroup        = 1007 // 禁言整个群
  //   GroupOpTypeCancelMuteGroup  = 1008 // 取消群禁言
const operation_type_map ={
  1001 : '创建群组',
  1002 : '踢出群成员',
  1003 : '解散群组',
  1004 : '转移群主',
  1005 : '禁言群成员',
  1006 : '取消禁言群成员',
  1007 : '禁言整个群',
  1008 : '取消群禁言',

}

const GroupMember = () => {
  const intl = useIntl();
  const location = useLocation();
  const actionRef = useRef<ActionType>();
  const currentGroup = useRef({} as API.GroupManage.GroupInfo);


  useEffect(() => {
    console.log('location.state: ', location.state);
    currentGroup.current = (location.state as any)?.groupInfo;
    if (!(location.state as any)?.groupInfo) {
      history.push('/im/group/group_list');
    }
  }, []);

  const columns: ProColumns<API.GroupManage.GroupMember>[] = useMemo(
    () => [
      {
        key: 'index',
        dataIndex: 'index',
        valueType: 'indexBorder',
        width: 48,
      },
      {
        title: intl.formatMessage({ id: 'group.groupName' }),
        key: 'group_name',
        dataIndex: 'group_name',
        align: 'center',
      },
      {
        title: intl.formatMessage({ id: 'group.groupID' }),
        key: 'group_id',
        dataIndex: 'group_id',
        align: 'center',
      },
      {
        title: "操作人",
        key: 'operator_user_name',
        dataIndex: 'operator_user_name',
        align: 'center',
      },
        {
        title: "操作类型",
        key: 'operation_type',
        dataIndex: 'operation_type',
        align: 'center',
        render: (operation_type) => <span>{operation_type_map[operation_type]}</span>,
      },
      {
        title: "操作对象",
        key: 'target_user_name',
        dataIndex: 'target_user_name',
        align: 'center',
      },
      {
        title: "操作时间",
        key: 'operation_time',
        dataIndex: 'operation_time',
        hideInSearch: true,
        align: 'center',
        render: (operation_time) => <span>{formatUTCTimeToBeijing(operation_time)}</span>,
      },
    ],
    [],
  );

  return (
    <PageContainer>
      <ProTable<API.GroupManage.GroupMember>
        columns={columns}
        actionRef={actionRef}
        request={async (params = {}) => {
          const { data } = await selectGroupLog({
            // groupId: "3709052877",
            groupID: currentGroup.current.groupID,
            page: params.current as number,
            pageSize: params.pageSize as number,
          });
          const tableData = data.data.map(v => {
            return {
              ...v,
              ...v.details,
              operator_user_name: v.operator_user.nickname,
              target_user_name: v.target_user?.nickname
            }
          })

          return {
            data: tableData ?? [],
            success: true,
            total: data.total,
          };
        }}
        search={false}
        rowKey="userID"
        pagination={{
          defaultPageSize: 10,
        }}
        scroll={{ x: 'max-content' }}
      />
    </PageContainer>
  );
};

export default GroupMember;
