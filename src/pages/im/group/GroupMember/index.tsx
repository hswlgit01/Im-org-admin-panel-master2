import OIMAvatar from '@/components/OIMAvatar';
import { GroupJoinSource, GroupRole } from '@/constants/enum';
import {
  cancelMuteGroupMember,
  getGroupMemberList,
  invite2Group,
  kickGroupMemebr,
} from '@/services/group';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useIntl, useLocation } from '@umijs/max';
import { Button, message, Popconfirm, Space } from 'antd';
import moment from 'moment';
import { useEffect, useMemo, useRef, useState } from 'react';
import GroupMemberActionDrawer, { DrawerOptions } from './GroupMemberActionDrawer';
import SelectUserModal, {
  SelectModalOptions,
  SelectedListItem,
} from '@/components/SelectUserModal';

const GroupMember = () => {
  const intl = useIntl();
  const location = useLocation();
  const actionRef = useRef<ActionType>();
  const currentGroup = useRef({} as API.GroupManage.GroupInfo);

  const [drawerOptions, setDrawerOptions] = useState<DrawerOptions>({
    opType: 'mute',
    open: false,
  });
  const [selectModalOptions, setSelectModalOptions] = useState<SelectModalOptions>({
    open: false,
    selectType: 'member',
  });

  useEffect(() => {
    console.log('location.state: ', location.state);
    currentGroup.current = (location.state as any)?.groupInfo;
    if (!(location.state as any)?.groupInfo) {
      history.push('/im/group/group_list');
    }
  }, []);

  const reload = () => {
    actionRef.current?.reload();
  };

  const changeGroupOwnerCallBack = (newID: string) => {
    currentGroup.current.ownerUserID = newID;
  };

  const closeSelectModal = () => {
    setSelectModalOptions({
      open: false,
      selectType: 'member',
    });
  };

  const openSelectModal = () => {
    setSelectModalOptions({
      open: true,
      selectType: 'member',
    });
  };

  const selectedCallBack = async (data: SelectedListItem) => {
    const invitedUserIDs = data.data.map((user) => user.userImID);
    try {
      await invite2Group({
        groupID: currentGroup.current.groupID,
        invitedUserIDs,
        reason: '',
      });
      actionRef.current?.reload();
      message.success(intl.formatMessage({ id: 'api.success' }));
    } catch (error) {
      console.log(error);
    }
  };

  const kickGroupMemebrHandler = async (record: API.GroupManage.GroupMember) => {
    try {
      await kickGroupMemebr({
        groupID: record.groupID,
        kickedUserIDs: [record.userID],
        reason: '',
      });
      message.success(intl.formatMessage({ id: 'api.success' }));
      reload();
    } catch (error) {
      console.log(error);
    }
  };

  const cancelMuteHandler = async (record: API.GroupManage.GroupMember) => {
    try {
      await cancelMuteGroupMember({ userID: record.userID, groupID: record.groupID });
      message.success(intl.formatMessage({ id: 'api.success' }));
      reload();
    } catch (error) {
      console.log(error);
    }
  };

  const openDrawerHandler = (opType: 'role' | 'mute', opMember: API.GroupManage.GroupMember) => {
    console.log('opMember: ', opMember);
    console.log('currentGroup: ', currentGroup);
    setDrawerOptions({
      opType,
      open: true,
      opMember,
      opGroup: currentGroup.current,
    });
  };

  const closeDrawer = () => {
    setDrawerOptions({
      opType: 'mute',
      open: false,
    });
  };

  const columns: ProColumns<API.GroupManage.GroupMember>[] = useMemo(
    () => [
      {
        key: 'index',
        dataIndex: 'index',
        valueType: 'indexBorder',
        width: 48,
      },
      {
        title: intl.formatMessage({ id: 'user.faceURL' }),
        dataIndex: 'faceURL',
        key: 'faceURL',
        hideInSearch: true,
        align: 'center',
        render: (_, record) => <OIMAvatar src={record.faceURL} text={record.nickname} />,
      },
      {
        title: intl.formatMessage({ id: 'group.user.nickname' }),
        key: 'nickname',
        dataIndex: 'nickname',
        align: 'center',
      },

      {
        title: intl.formatMessage({ id: 'group.roleLevel' }),
        key: 'roleLevel',
        dataIndex: 'roleLevel',
        hideInSearch: true,
        editable: false,
        valueType: 'select',
        align: 'center',
        request: async () => {
          return [
            {
              label: intl.formatMessage({ id: 'group.roleLevel.nomal' }),
              value: GroupRole.Nomal,
            },
            {
              label: intl.formatMessage({ id: 'group.roleLevel.admin' }),
              value: GroupRole.Admin,
            },
            {
              label: intl.formatMessage({ id: 'group.roleLevel.owner' }),
              value: GroupRole.Owner,
            },
          ];
        },
      },

      {
        title: intl.formatMessage({ id: 'group.joinTime' }),
        key: 'joinTime',
        dataIndex: 'joinTime',
        hideInSearch: true,
        align: 'center',
        render: (_, record) => <span> {moment(record.joinTime).format('YYYY-MM-DD')}</span>,
      },
      {
        title: intl.formatMessage({ id: 'group.joinSource' }),
        key: 'joinSource',
        dataIndex: 'joinSource',
        hideInSearch: true,
        editable: false,
        valueType: 'select',
        align: 'center',
        request: async () => {
          return [
            {
              label: intl.formatMessage({ id: 'group.joinSource.Invitation' }),
              value: GroupJoinSource.Invitation,
            },
            {
              label: intl.formatMessage({ id: 'group.joinSource.QrCode' }),
              value: GroupJoinSource.QrCode,
            },
            {
              label: intl.formatMessage({ id: 'group.joinSource.Search' }),
              value: GroupJoinSource.Search,
            },
          ];
        },
      },
      {
        title: intl.formatMessage({ id: 'user.userID' }),
        key: 'userID',
        dataIndex: 'userID',
        align: 'center',
      },
      {
        title: '',
        valueType: 'option',
        key: 'option',
        align: 'center',
        render: (_, record) => {
          const isMuted = record.muteEndTime > moment().unix();
          const isOwner = record.roleLevel === GroupRole.Owner;
          return (
            <Space>
              <a
                className={isOwner ? ' text-[#bba8a883]' : ''}
                onClick={() => openDrawerHandler('role', record)}
              >
                {intl.formatMessage({ id: 'group.roleLevel.seeting' })}
              </a>
              <Popconfirm
                title={intl.formatMessage({ id: 'group.closeAllMute.tips' })}
                onConfirm={() => cancelMuteHandler(record)}
                disabled={!isMuted || isOwner}
              >
                <a
                  className={isOwner ? ' text-[#bba8a883]' : ''}
                  onClick={() => {
                    if (isMuted || isOwner) return;
                    openDrawerHandler('mute', record);
                  }}
                >
                  {isMuted
                    ? intl.formatMessage({ id: 'group.closeAllMute' })
                    : intl.formatMessage({ id: 'group.mute' })}
                </a>
              </Popconfirm>
              <Popconfirm
                title={intl.formatMessage({ id: 'group.remove.tips' })}
                onConfirm={() => kickGroupMemebrHandler(record)}
                disabled={isOwner}
              >
                <a className={isOwner ? ' text-[#bba8a883]' : ''}>
                  {intl.formatMessage({ id: 'group.remove' })}
                </a>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [],
  );

  return (
    <PageContainer>
      <GroupMemberActionDrawer
        drawerOptions={drawerOptions}
        closeDrawer={closeDrawer}
        reload={reload}
        changeGroupOwnerCallBack={changeGroupOwnerCallBack}
      />
      <SelectUserModal
        groupID={currentGroup.current.groupID}
        selectModalOptions={selectModalOptions}
        selectedCallBack={selectedCallBack}
        closeSelectModal={closeSelectModal}
      />
      <ProTable<API.GroupManage.GroupMember>
        columns={columns}
        actionRef={actionRef}
        request={async (params = {}) => {
          const { data } = await getGroupMemberList({
            groupID: currentGroup.current.groupID,
            keyword: params.userID ?? params.nickname,
            pagination: {
              pageNumber: params.current as number,
              showNumber: params.pageSize as number,
            },
          });
          return {
            data: data.members ?? [],
            success: true,
            total: data.total,
          };
        }}
        rowKey="userID"
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          defaultPageSize: 10,
        }}
        scroll={{ x: 'max-content' }}
        toolbar={{
          actions: [
            <Button key="key" type="primary" onClick={openSelectModal}>
              {intl.formatMessage({ id: 'group.member.add' })}
            </Button>,
          ],
          settings: [],
        }}
      />
    </PageContainer>
  );
};

export default GroupMember;
