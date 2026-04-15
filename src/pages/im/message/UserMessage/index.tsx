import { MessageType } from 'open-im-sdk';
import { SessionType, canRevokeMessage } from '@/constants/enum';
import { getMessageList, revokeMessage } from '@/services/message';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { Popconfirm, message } from 'antd';
import moment from 'moment';
import React, { useMemo, useRef } from 'react';
import MessageParse from '../components/MessageParse';
import { useIntl } from '@umijs/max';
import { getConversationID } from '@/utils/common';

const UserMessage = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();

  const revokeMessageHandler = async (record: API.ChatLog.ChatLogs) => {
    const options = {
      userID: record.chatLog.sendID,
      conversationID: getConversationID({
        sendID: record.chatLog.sendID,
        recvID: record.chatLog.recvID,
        isNotification: record.chatLog.sessionType === SessionType.Notification,
      }),
      seq: record.chatLog.seq,
    };
    try {
      await revokeMessage(options);
      message.success(intl.formatMessage({ id: 'api.success' }));
      actionRef.current?.reload();
    } catch (error) {
      console.log(error);
    }
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
        title: intl.formatMessage({ id: 'message.senderNickname' }),
        key: 'senderNickname',
        dataIndex: 'senderNickname',
        hideInSearch: true,
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
            <Popconfirm
              title={intl.formatMessage({ id: 'message.revokeMessage.tips' })}
              onConfirm={() => revokeMessageHandler(record)}
              disabled={isDisable}
            >
              <a style={isDisable ? { color: '#666' } : {}}>
                {intl.formatMessage({ id: 'message.revokeMessage' })}
              </a>
            </Popconfirm>
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
            sendTime: params.sendTime as string,
            pagination: {
              pageNumber: params.current as number,
              showNumber: params.pageSize as number,
            },
          });
          return {
            data: data.chatLogs ?? [],
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
