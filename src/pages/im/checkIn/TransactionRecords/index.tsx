import OIMAvatar from '@/components/OIMAvatar';
import { getOrganizationUsers } from '@/services/group-new';
import { getUsersOnlineStatus, selectRolePermissions, updateBlock } from '@/services/user';
import { updateUserRole } from '@/services/account';
import { switchOnline } from '@/utils/common';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useIntl } from '@umijs/max';
import { useMemo, useRef, useState } from 'react';
import { formatUTCTimeToBeijing } from '@/utils/common';
import { Button, Popconfirm, Space, message } from 'antd';
import { selectTransactionRecordList } from '@/services/checkin';

export type DrawerOptions = {
  visible: boolean;
  selectUser: API.UserManage.User | undefined;
};


const UserList = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const [drawerOptions, setDrawerOptions] = useState<DrawerOptions>({
    visible: false,
    selectUser: undefined,
  });

  const [selectedUserID, setSelectUserID] = useState('');
  const toRelationListHandler = (userId: string) => {
    history.push('/im/user/relation_list?userID=' + userId);
  };

  const modifyUserRole = async (user_id: string, role: string) => {
    await updateUserRole({ user_id, role: role === 'GroupManager' ? 'Normal' : 'GroupManager' })
    message.success('操作成功');
    actionRef.current?.reload();
  };
  const columns: ProColumns<API.UserManage.User>[] = useMemo(
    () => [
      {
        key: 'index',
        dataIndex: 'index',
        valueType: 'indexBorder',
      },
       {
        title: '领取人',
        key: 'receiver',
        dataIndex: 'receiver',
        align: 'center',
      },
       {
        title: '发送人',
        key: 'sender',
        dataIndex: 'sender',
        align: 'center',
      },

       {
        title: '领取时间',
        key: 'created_at',
        dataIndex: 'created_at',
        valueType: 'dateRange',
        align: 'center',
        render: (_, record) => formatUTCTimeToBeijing(record.created_at),
        fieldProps: {
          allowEmpty: [true, true]
        }
      },

      {
         title: '类型',
        key: 'nickname',
        dataIndex: 'nickname',
        align: 'center',
        hideInSearch: true,
      },
      {
        title: '数量',
        key: 'total_count',
        dataIndex: 'total_count',
        hideInSearch: true,
        align: 'center',
      },
      {
        title: '金额',
        key: 'total_amount',
        dataIndex: 'total_amount',
        hideInSearch: true,
        align: 'center',
      },
    ],
    [],
  );



  return (
    <PageContainer>

      <ProTable<API.UserManage.User>
        columns={columns}
        actionRef={actionRef}
        request={async (params = {}) => {
          console.log(params, 'params');
          // const { data } = await getOrganizationUsers({
          //   pageNumber: params.current as number,
          //   showNumber: params.pageSize as number,
          //   keyword: params.nickname,
          // });

          const { data } = await selectTransactionRecordList({
            page_num: params.current,
            page_size: params.pageSize,
          })
          const tmpData = data.data || [];

          return {
            data: tmpData,
            success: true,
            total: data.total,
          };
        }}
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          defaultPageSize: 10,
          showQuickJumper: true,
        }}
      />
    </PageContainer>
  );
};

export default UserList;
