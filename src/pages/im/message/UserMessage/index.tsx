import { SessionType, canRevokeMessage } from '@/constants/enum';
import { deleteMessage, getMessageList, revokeMessage } from '@/services/message';
import { getConversationID } from '@/utils/common';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Modal, Space, message } from 'antd';
import moment from 'moment';
import { MessageType } from 'open-im-sdk';
import { useMemo, useRef } from 'react';
import MessageParse from '../components/MessageParse';

const UserMessage = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();

  // dawn 2026-05-06 修复消息操作无反馈：失败时展示错误，并用确认弹窗替代点击无感的 Popconfirm。
  const getErrorMessage = (error: unknown) =>
    (error as { data?: { errDlt?: string; errMsg?: string }; message?: string })?.data?.errDlt ||
    (error as { data?: { errDlt?: string; errMsg?: string }; message?: string })?.data?.errMsg ||
    (error as { message?: string })?.message ||
    intl.formatMessage({ id: 'api.failed' });

  // dawn 2026-05-05 修复用户聊天记录操作：复用会话 ID，避免撤回和删除请求不一致。
  const getRecordConversationID = (record: API.ChatLog.ChatLogs) =>
    getConversationID({
      sendID: record.chatLog.sendID,
      recvID: record.chatLog.recvID,
      isNotification: record.chatLog.sessionType === SessionType.Notification,
    });

  // dawn 2026-05-06 修复用户消息排序：当前页按发送者排序，同发送者按发送时间倒序展示。
  const getRecordSenderSortKey = (record: API.ChatLog.ChatLogs) =>
    (record.chatLog.senderNickname || record.chatLog.sendID || '').toLocaleLowerCase();

  const getRecordTime = (record: API.ChatLog.ChatLogs) =>
    record.chatLog.createTime || record.chatLog.sendTime || 0;

  const sortMessageLogs = (logs: API.ChatLog.ChatLogs[]) =>
    [...logs].sort((left, right) => {
      const senderCompare = getRecordSenderSortKey(left).localeCompare(
        getRecordSenderSortKey(right),
        'zh-CN',
      );
      if (senderCompare !== 0) {
        return senderCompare;
      }
      return getRecordTime(right) - getRecordTime(left);
    });

  const revokeMessageHandler = async (record: API.ChatLog.ChatLogs) => {
    const options = {
      userID: record.chatLog.sendID,
      conversationID: getRecordConversationID(record),
      seq: record.chatLog.seq,
      serverMsgID: record.chatLog.serverMsgID,
      clientMsgID: record.chatLog.clientMsgID,
    };
    try {
      await revokeMessage(options);
      message.success(intl.formatMessage({ id: 'api.success' }));
      actionRef.current?.reload();
    } catch (error) {
      console.error(error);
      message.error(getErrorMessage(error));
    }
  };

  const deleteMessageHandler = async (record: API.ChatLog.ChatLogs, userID: string) => {
    try {
      await deleteMessage({
        userID,
        conversationID: getRecordConversationID(record),
        seqs: [record.chatLog.seq],
        deleteSyncOpt: {
          IsSyncSelf: true,
          IsSyncOther: false,
        },
        serverMsgID: record.chatLog.serverMsgID,
        clientMsgID: record.chatLog.clientMsgID,
      });
      message.success(intl.formatMessage({ id: 'api.success' }));
      actionRef.current?.reload();
    } catch (error) {
      console.error(error);
      message.error(getErrorMessage(error));
    }
  };

  const confirmRevokeMessage = (record: API.ChatLog.ChatLogs, disabled: boolean) => {
    if (disabled) {
      return;
    }
    Modal.confirm({
      title: intl.formatMessage({ id: 'message.revokeMessage.tips' }),
      okText: intl.formatMessage({ id: 'confirm' }),
      cancelText: intl.formatMessage({ id: 'cancel', defaultMessage: '取消' }),
      onOk: () => revokeMessageHandler(record),
    });
  };

  const confirmDeleteMessage = (record: API.ChatLog.ChatLogs, userID: string) => {
    if (!userID) {
      message.error(intl.formatMessage({ id: 'api.failed' }));
      return;
    }
    Modal.confirm({
      title: intl.formatMessage({ id: 'message.deleteTargetMessage.tips' }, { userID }),
      okText: intl.formatMessage({ id: 'confirm' }),
      cancelText: intl.formatMessage({ id: 'cancel', defaultMessage: '取消' }),
      okButtonProps: { danger: true },
      onOk: () => deleteMessageHandler(record, userID),
    });
  };

  const SessionTypeOtions = [
    {
      label: intl.formatMessage({ id: 'single' }),
      value: SessionType.Single,
    },
    {
      label: intl.formatMessage({ id: 'notification' }),
      value: SessionType.Notification,
    },
  ];

  const MessageTypeOtions = [
    {
      label: intl.formatMessage({ id: 'message.TextMessage' }),
      value: MessageType.TextMessage,
    },
    {
      label: intl.formatMessage({ id: 'message.PicMessage' }),
      value: MessageType.PictureMessage,
    },
    {
      label: intl.formatMessage({ id: 'message.VoiceMessage' }),
      value: MessageType.VoiceMessage,
    },
    {
      label: intl.formatMessage({ id: 'message.VideoMessage' }),
      value: MessageType.VideoMessage,
    },
    {
      label: intl.formatMessage({ id: 'message.FileMessage' }),
      value: MessageType.FileMessage,
    },
    {
      label: intl.formatMessage({ id: 'message.TextAtMessage' }),
      value: MessageType.AtTextMessage,
    },
    {
      label: intl.formatMessage({ id: 'message.MergeMessage' }),
      value: MessageType.MergeMessage,
    },
    {
      label: intl.formatMessage({ id: 'message.CardMessage' }),
      value: MessageType.CardMessage,
    },
    {
      label: intl.formatMessage({ id: 'message.LocationMessage' }),
      value: MessageType.LocationMessage,
    },
    {
      label: intl.formatMessage({ id: 'message.CustomMessage' }),
      value: MessageType.CustomMessage,
    },
    {
      label: intl.formatMessage({ id: 'message.QuoteMessage' }),
      value: MessageType.QuoteMessage,
    },
    {
      label: intl.formatMessage({ id: 'message.FaceMessage' }),
      value: MessageType.FaceMessage,
    },
    {
      label: intl.formatMessage({ id: 'message.FriendAppApproved' }),
      value: MessageType.FriendAdded,
    },
    {
      label: intl.formatMessage({ id: 'message.PrivateMessage' }),
      value: MessageType.BurnMessageChange,
    },
    // The new version retraction message cannot be found
    // {
    //   label: intl.formatMessage({ id: 'message.MsgRevokeNotification' }),
    //   value: MessageType.RevokeMessage,
    // },
  ];

  const columns: ProColumns<API.ChatLog.ChatLogs>[] = useMemo(
    () => [
      {
        key: 'index',
        dataIndex: 'index',
        valueType: 'indexBorder',
        align: 'center',
      },
      {
        title: intl.formatMessage({ id: 'message.content' }),
        dataIndex: 'content',
        key: 'content',
        hideInSearch: true,
        align: 'center',
        render: (_, record) => <MessageParse record={record.chatLog} />,
      },
      {
        // dawn 2026-05-06 修复用户消息查询：开放发送者名称查询。
        title: intl.formatMessage({ id: 'message.senderNickname' }),
        key: 'senderNickname',
        dataIndex: 'senderNickname',
        align: 'center',
        render: (_, record) => <div>{record.chatLog.senderNickname}</div>,
      },
      {
        title: intl.formatMessage({ id: 'message.sendID' }),
        key: 'sendID',
        dataIndex: 'sendID',
        editable: false,
        align: 'center',
        render: (_, record) => <div>{record.chatLog.sendID}</div>,
      },
      {
        title: intl.formatMessage({ id: 'message.recvID' }),
        key: 'recvID',
        dataIndex: 'recvID',
        align: 'center',
        render: (_, record) => <div>{record.chatLog.recvID}</div>,
      },
      {
        // dawn 2026-05-06 修复用户消息查询：新增接收者名称查询和表格列。
        title: intl.formatMessage({ id: 'message.recvNickname' }),
        key: 'recvNickname',
        dataIndex: 'recvNickname',
        align: 'center',
        render: (_, record) => <div>{record.chatLog.recvNickname}</div>,
      },
      {
        title: intl.formatMessage({ id: 'message.sessionType' }),
        key: 'sessionType',
        dataIndex: ['chatLog', 'sessionType'],
        valueType: 'select',
        request: async () => SessionTypeOtions,
        align: 'center',
        initialValue: 1,
      },
      {
        title: intl.formatMessage({ id: 'message.contentType' }),
        key: 'contentType',
        dataIndex: ['chatLog', 'contentType'],
        editable: false,
        valueType: 'select',
        request: async () => MessageTypeOtions,
        align: 'center',
      },
      {
        title: intl.formatMessage({ id: 'message.sendTime' }),
        key: 'sendTime',
        dataIndex: 'sendTime',
        valueType: 'date',
        editable: false,
        align: 'center',
        initialValue: moment().format('YYYY-MM-DD'),
        render(_, record) {
          return moment(record.chatLog.createTime).format('YYYY-MM-DD HH:mm:ss');
        },
      },
      {
        title: '',
        valueType: 'option',
        key: 'option',
        align: 'center',
        render: (_, record) => {
          const isDisable =
            record.isRevoked || !canRevokeMessage.includes(record.chatLog.contentType);
          return (
            <Space>
              <a
                onClick={() => confirmRevokeMessage(record, isDisable)}
                style={isDisable ? { color: '#666' } : {}}
              >
                {intl.formatMessage({ id: 'message.revokeMessage' })}
              </a>
              <a
                onClick={() => confirmDeleteMessage(record, record.chatLog.sendID)}
                style={{ color: '#ff4d4f' }}
              >
                {intl.formatMessage({ id: 'message.deleteSenderMessage' })}
              </a>
              <a
                onClick={() => confirmDeleteMessage(record, record.chatLog.recvID)}
                style={!record.chatLog.recvID ? { color: '#666' } : { color: '#ff4d4f' }}
              >
                {intl.formatMessage({ id: 'message.deleteReceiverMessage' })}
              </a>
            </Space>
          );
        },
      },
    ],
    [],
  );

  return (
    <PageContainer>
      <ProTable<API.ChatLog.ChatLogs>
        columns={columns}
        actionRef={actionRef}
        request={async (params = {}) => {
          const { data } = await getMessageList({
            sessionType: params.sessionType as number,
            contentType: params.contentType ?? 0,
            recvID: params.recvID ?? '',
            sendID: params.sendID ?? '',
            senderNickname: params.senderNickname as string,
            recvNickname: params.recvNickname as string,
            sendTime: params.sendTime as string,
            pagination: {
              pageNumber: params.current as number,
              showNumber: params.pageSize as number,
            },
          });
          const sortedLogs = sortMessageLogs(data.chatLogs ?? []);
          return {
            data: sortedLogs,
            success: true,
            total: data.chatLogsNum,
          };
        }}
        rowKey={(record) => record.chatLog.serverMsgID}
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          defaultPageSize: 10,
        }}
        scroll={{ x: 'max-content' }}
      />
    </PageContainer>
  );
};

export default UserMessage;
