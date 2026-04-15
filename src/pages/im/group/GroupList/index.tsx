import OIMAvatar from '@/components/OIMAvatar';
import { GroupStatus } from '@/constants/enum';
import {
  cancelMuteGroup,
  dismissGroup,
  getGroupList as getGroupListNew,
  muteGroup,
} from '@/services/group-new';
import { formatUTCTimeToBeijing } from '@/utils/common';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useIntl } from '@umijs/max';
import { Button, message, Modal, Popconfirm, Space } from 'antd';
import { useCallback, useMemo, useRef, useState } from 'react';
import GroupActionDrawer, { DrawerOptions } from './GroupActionDrawer';

function isWholeGroupMutedRow(r: API.GroupManage.Groups) {
  return Number(r.status) === GroupStatus.Muted;
}

const GroupList = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();

  const [drawerOptions, setDrawerOptions] = useState<DrawerOptions>({
    open: false,
    opType: 'create',
  });

  /** 跨页勾选：用 groupID 记录完整行数据，便于判断禁言状态 */
  const [selectedMap, setSelectedMap] = useState<Record<string, API.GroupManage.Groups>>({});

  const reload = () => {
    actionRef.current?.reload();
  };

  const clearSelection = useCallback(() => {
    setSelectedMap({});
  }, []);

  const toGroupMember = (groupInfo: any) => {
    history.push('/im/group/group_member', {
      groupInfo,
    });
  };
  const toGroupLog = (groupInfo: any) => {
    history.push('/im/group/group_log', {
      groupInfo,
    });
  };

  const muteGroupHandler = async (isMuted: boolean, groupID: string) => {
    const func = isMuted ? cancelMuteGroup : muteGroup;
    try {
      await func(groupID);
      message.success(intl.formatMessage({ id: 'api.success' }));
      reload();
    } catch (error) {
      console.log(error);
    }
  };

  const dismissGroupHandler = async (groupID: string) => {
    try {
      await dismissGroup(groupID);
      message.success(intl.formatMessage({ id: 'api.success' }));
      reload();
    } catch (error) {
      console.log(error);
    }
  };

  const batchMuteSelectedHandler = () => {
    const rows = Object.values(selectedMap);
    if (rows.length === 0) {
      message.warning(intl.formatMessage({ id: 'group.batchMuteSelected.noSelection' }));
      return;
    }
    // 已全体禁言的群跳过，不调用接口
    const toMute = rows.filter((r) => !isWholeGroupMutedRow(r));
    const skip = rows.length - toMute.length;
    if (toMute.length === 0) {
      message.warning(intl.formatMessage({ id: 'group.batchMuteSelected.noneNeedMute' }));
      return;
    }

    Modal.confirm({
      title: intl.formatMessage({ id: 'group.batchMuteSelected.tips' }, { n: toMute.length }),
      onOk: async () => {
        let ok = 0;
        let fail = 0;
        for (const r of toMute) {
          try {
            await muteGroup(r.groupID);
            ok += 1;
          } catch {
            fail += 1;
          }
        }
        message.success(
          intl.formatMessage({ id: 'group.batchMuteSelected.result' }, { ok, skip, fail }),
        );
        clearSelection();
        reload();
      },
    });
  };

  const batchCancelMuteSelectedHandler = () => {
    const rows = Object.values(selectedMap);
    if (rows.length === 0) {
      message.warning(intl.formatMessage({ id: 'group.batchCancelMuteSelected.noSelection' }));
      return;
    }
    // 仅对当前为全体禁言的群取消禁言；未禁言的跳过
    const toUnmute = rows.filter((r) => isWholeGroupMutedRow(r));
    const skip = rows.length - toUnmute.length;
    if (toUnmute.length === 0) {
      message.warning(intl.formatMessage({ id: 'group.batchCancelMuteSelected.noneNeedUnmute' }));
      return;
    }

    Modal.confirm({
      title: intl.formatMessage(
        { id: 'group.batchCancelMuteSelected.tips' },
        { n: toUnmute.length },
      ),
      onOk: async () => {
        let ok = 0;
        let fail = 0;
        for (const r of toUnmute) {
          try {
            await cancelMuteGroup(r.groupID);
            ok += 1;
          } catch {
            fail += 1;
          }
        }
        message.success(
          intl.formatMessage({ id: 'group.batchCancelMuteSelected.result' }, { ok, skip, fail }),
        );
        clearSelection();
        reload();
      },
    });
  };

  const closeDrawer = () => {
    setDrawerOptions({
      open: false,
      opType: 'create',
      groupInfo: undefined,
    });
  };

  const openDrawer = (opType: 'create' | 'edit', groupInfo?: any) => {
    setDrawerOptions({
      open: true,
      opType,
      groupInfo,
    });
  };

  const rowSelection = {
    selectedRowKeys: Object.keys(selectedMap),
    onSelect: (record: API.GroupManage.Groups, selected: boolean) => {
      setSelectedMap((prev) => {
        const next = { ...prev };
        if (selected) {
          next[record.groupID] = record;
        } else {
          delete next[record.groupID];
        }
        return next;
      });
    },
    onSelectAll: (selected: boolean, _selectedRows: API.GroupManage.Groups[], changeRows: API.GroupManage.Groups[]) => {
      setSelectedMap((prev) => {
        const next = { ...prev };
        changeRows.forEach((r) => {
          if (selected) {
            next[r.groupID] = r;
          } else {
            delete next[r.groupID];
          }
        });
        return next;
      });
    },
  };

  const columns: ProColumns<API.GroupManage.Groups>[] = useMemo(
    () => [
      {
        key: 'index',
        dataIndex: 'index',
        valueType: 'indexBorder',
      },
      {
        title: intl.formatMessage({ id: 'group.faceURL' }),
        dataIndex: 'faceURL',
        key: 'faceURL',
        hideInSearch: true,
        align: 'center',
        render: (_, record) => {
          return <OIMAvatar src={record.faceURL} isgroup />;
        },
      },
      {
        title: intl.formatMessage({ id: 'group.groupName' }),
        key: 'groupName',
        dataIndex: 'groupName',
        align: 'center',
        render: (_, record) => <span>{record.groupName}</span>,
      },
      {
        title: intl.formatMessage({ id: 'group.groupID' }),
        key: 'groupID',
        dataIndex: 'groupID',
        hideInSearch: true,
        align: 'center',
        render: (_, record) => <span>{record.groupID}</span>,
      },
      {
        title: intl.formatMessage({ id: 'group.createTime' }),
        key: 'createTime',
        dataIndex: 'createTime',
        hideInSearch: true,
        align: 'center',
        render: (_, record) => <span>{formatUTCTimeToBeijing(record.createTime)}</span>,
      },
      {
        title: '',
        valueType: 'option',
        key: 'option',
        align: 'center',
        render: (_, record) => {
          const isMuted = isWholeGroupMutedRow(record);
          return (
            <Space>
              <a onClick={() => toGroupMember(record)}>{intl.formatMessage({ id: 'group.member' })}</a>
              <a onClick={() => toGroupLog(record)}>{intl.formatMessage({ id: 'group.log' })}</a>
              <a
                onClick={() => {
                  openDrawer('edit', record);
                }}
              >
                {intl.formatMessage({ id: 'group.setting' })}
              </a>

              <Popconfirm
                title={
                  isMuted
                    ? intl.formatMessage({ id: 'group.closeAllMute.tips' })
                    : intl.formatMessage({ id: 'group.allMute.tips' })
                }
                onConfirm={() => muteGroupHandler(isMuted, record.groupID)}
              >
                <a>
                  {isMuted
                    ? intl.formatMessage({ id: 'group.closeAllMute' })
                    : intl.formatMessage({ id: 'group.allMute' })}
                </a>
              </Popconfirm>
              <Popconfirm
                title={intl.formatMessage({ id: 'group.dismiss.tips' })}
                onConfirm={() => dismissGroupHandler(record.groupID)}
              >
                <a>{intl.formatMessage({ id: 'group.dismiss' })}</a>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [intl],
  );

  const selectedCount = Object.keys(selectedMap).length;

  return (
    <PageContainer>
      <GroupActionDrawer reload={reload} closeDrawer={closeDrawer} drawerOptions={drawerOptions} />
      <ProTable<API.GroupManage.Groups>
        columns={columns}
        actionRef={actionRef}
        rowSelection={rowSelection}
        tableAlertRender={false}
        request={async (params = {}) => {
          const { data } = await getGroupListNew({
            ...params,
            pagination: {
              pageNumber: params.current as number,
              showNumber: params.pageSize as number,
            },
          });
          return {
            data: data.data,
            success: true,
            total: data.total,
          };
        }}
        rowKey={(record) => record.groupID}
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          defaultPageSize: 10,
          showQuickJumper: true,
        }}
        toolbar={{
          actions: [
            <Button key="batchMute" disabled={selectedCount === 0} onClick={batchMuteSelectedHandler}>
              {intl.formatMessage({ id: 'group.batchMuteSelected' })}
            </Button>,
            <Button
              key="batchCancelMute"
              disabled={selectedCount === 0}
              onClick={batchCancelMuteSelectedHandler}
            >
              {intl.formatMessage({ id: 'group.batchCancelMuteSelected' })}
            </Button>,
            <Button key="add" type="primary" onClick={() => openDrawer('create')}>
              {intl.formatMessage({ id: 'group.create' })}
            </Button>,
          ],
          settings: [],
        }}
      />
    </PageContainer>
  );
};

export default GroupList;
