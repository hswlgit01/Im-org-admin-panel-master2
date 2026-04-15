import OIMAvatar from '@/components/OIMAvatar';
import { SessionType } from '@/constants/enum';
import { getMessageList, revokeMessage } from '@/services/message';
import { getConversationID } from '@/utils/common';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { message } from 'antd';
import moment from 'moment';
import { MessageType } from 'open-im-sdk';
import { useMemo, useRef } from 'react';
import MessageParse from '../components/MessageParse';

const GroupMessage = () => {
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
      label: intl.formatMessage({ id: 'message.GroupCreated' }),
      value: MessageType.GroupCreated,
    },
    {
      label: intl.formatMessage({ id: 'message.MemberQuit' }),
      value: MessageType.MemberQuit,
    },
    {
      label: intl.formatMessage({ id: 'message.GroupOwnerTransferred' }),
      value: MessageType.GroupOwnerTransferred,
    },
    {
      label: intl.formatMessage({ id: 'message.MemberKicked' }),
      value: MessageType.MemberKicked,
    },
    {
      label: intl.formatMessage({ id: 'message.MemberInvited' }),
      value: MessageType.MemberInvited,
    },
    {
      label: intl.formatMessage({ id: 'message.MemberEnter' }),
      value: MessageType.MemberEnter,
    },
    {
      label: intl.formatMessage({ id: 'message.DismissGroup' }),
      value: MessageType.GroupDismissed,
    },
    {
      label: intl.formatMessage({ id: 'message.MemberMutedNotification' }),
      value: MessageType.GroupMemberMuted,
    },
    {
      label: intl.formatMessage({ id: 'message.MemberCancelMutedNotification' }),
      value: MessageType.GroupMemberCancelMuted,
    },
    {
      label: intl.formatMessage({ id: 'message.MutedNotification' }),
      value: MessageType.GroupMuted,
    },
    {
      label: intl.formatMessage({ id: 'message.CancelMutedNotification' }),
      value: MessageType.GroupCancelMuted,
    },
    {
      label: intl.formatMessage({ id: 'message.GroupAnnouncementUpdated' }),
      value: MessageType.GroupAnnouncementUpdated,
    },
    {
      label: intl.formatMessage({ id: 'message.GroupNameUpdated' }),
      value: MessageType.GroupNameUpdated,
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
        title: intl.formatMessage({ id: 'group.faceURL' }),
        dataIndex: 'faceURL',
        key: 'faceURL',
        hideInSearch: true,
        align: 'center',
        render: (_, record) => <OIMAvatar src={record.chatLog.senderFaceURL} isgroup />,
      },
      {
        title: intl.formatMessage({ id: 'group.groupName' }),
        key: 'groupName',
        dataIndex: 'groupName',
        hideInSearch: true,
        align: 'center',
        render: (_, record) => <div>{record.chatLog.groupName}</div>,
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
        title: intl.formatMessage({ id: 'message.contentType' }),
        key: 'contentType',
        dataIndex: ['chatLog', 'contentType'],
        editable: false,
        valueType: 'select',
        request: async () => MessageTypeOtions,
        align: 'center',
      },
      {
        title: intl.formatMessage({ id: 'group.groupID' }),
        key: 'groupID',
        dataIndex: 'groupID',
        align: 'center',
        render: (_, record) => <div>{record.chatLog.groupID}</div>,
      },
      {
        title: intl.formatMessage({ id: 'group.memberCount' }),
        key: 'groupMemberCount',
        dataIndex: 'groupMemberCount',
        align: 'center',
        hideInSearch: true,
        render: (_, record) => <div>{record.chatLog.groupMemberCount}</div>,
      },
      // {
      //   title: intl.formatMessage({ id: 'group.GroupOwnerID' }),
      //   key: 'groupOwner',
      //   dataIndex: 'groupOwner',
      //   align: 'center',
      //   hideInSearch: true,
      //   render: (_, record) => <div>{record.chatLog.groupOwner}</div>,
      // },
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
      // {
      //   title: '',
      //   valueType: 'option',
      //   key: 'option',
      //   align: 'center',
      //   render: (_, record) => {
      //     const isDisable =
      //       record.isRevoked || !canRevokeMessage.includes(record.chatLog.contentType);
      //     return (
      //       <Popconfirm
      //         title={intl.formatMessage({ id: 'message.revokeMessage.tips' })}
      //         onConfirm={() => revokeMessageHandler(record)}
      //         disabled={isDisable}
      //       >
      //         <a style={isDisable ? { color: '#666' } : {}}>
      //           {intl.formatMessage({ id: 'message.revokeMessage' })}
      //         </a>
      //       </Popconfirm>
      //     );
      //   },
      // },
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
            sessionType: 3,
            contentType: params.contentType ?? 0,
            recvID: params.groupID ?? '',
            sendID: '',
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

export default GroupMessage;
