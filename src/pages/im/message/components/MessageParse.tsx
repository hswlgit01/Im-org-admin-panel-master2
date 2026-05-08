import { MessageType } from 'open-im-sdk';
import { useIntl, useModel } from '@umijs/max';
import { Typography, Image } from 'antd';
import { FC } from 'react';
import call_video from '@/assets/images/call_video.png';
import { getResourceUrl } from '@/utils/common';

type MessageParseProps = {
  record: API.ChatLog.ChatLog;
};

const textWidth = { width: '200px' };

const parseJson = (value?: string) => {
  if (!value) {
    return undefined;
  }
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

// dawn 2026-05-08 修复后台消息内容展示：自定义消息里嵌套 data JSON 时展示业务正文，避免直接显示转义 JSON。
const parseCustomMessageText = (content: string) => {
  const outer = parseJson(content);
  if (!outer) {
    return content;
  }

  if (typeof outer.content === 'string') {
    return outer.content;
  }

  const inner = typeof outer.data === 'string' ? parseJson(outer.data) : outer.data;
  if (inner && typeof inner.content === 'string') {
    return inner.content;
  }

  return content;
};

const renderEllipsisText = (content: string) => (
  <Typography.Text ellipsis={{ tooltip: content }} style={textWidth}>
    {content}
  </Typography.Text>
);

const MessageParse: FC<MessageParseProps> = ({ record }) => {
  const intl = useIntl();
  const { setInitialState } = useModel('@@initialState');

  const showVideo = (url: string) => {
    setInitialState((s) => ({
      ...s,
      videoUrl: url,
    }));
  };

  try {
    if (record.contentType === MessageType.TextMessage) {
      const content = JSON.parse(record.content).content;
      return renderEllipsisText(content);
    }

    if (record.contentType === MessageType.PictureMessage) {
      const content = JSON.parse(record.content);
      return (
        <Image
          className="max-w-[100px] max-h-[100px]"
          src={getResourceUrl(content.sourcePicture.url ?? content.snapshotPicture.url)}
        />
      );
    }

    if (record.contentType === MessageType.VoiceMessage) {
      return (
        <Typography.Link
          href={JSON.parse(record.content).sourceUrl}
          target="_blank"
          style={textWidth}
        >
          {intl.formatMessage({ id: 'message.VoiceMessage.parse' })}
        </Typography.Link>
      );
    }

    if (record.contentType === MessageType.VideoMessage) {
      return (
        <div
          className="video-img cursor-pointer max-w-[100px] max-h-[100px]"
          onClick={() => showVideo(JSON.parse(record.content).videoUrl)}
        >
          <img
            src={getResourceUrl(JSON.parse(record.content).snapshotUrl)}
            alt="video"
            className="max-w-[100px] max-h-[100px]"
          />
          <div className="video-image-mask">
            <img src={call_video} alt="" width={40} />
          </div>
        </div>
      );
    }

    if (record.contentType === MessageType.FileMessage) {
      return (
        <Typography.Link
          href={JSON.parse(record.content).sourceUrl}
          target="_blank"
          style={textWidth}
        >
          {intl.formatMessage({ id: 'message.FileMessage.parse' })}
        </Typography.Link>
      );
    }

    if (record.contentType === MessageType.AtTextMessage) {
      const text = JSON.parse(record.content).text;
      return renderEllipsisText(text);
    }

    if (record.contentType === MessageType.MergeMessage) {
      const title = JSON.parse(record.content).title;
      return renderEllipsisText(title);
    }

    if (record.contentType === MessageType.CardMessage) {
      const nickname = JSON.parse(record.content).nickname;
      return (
        <Typography.Text
          ellipsis={{
            tooltip: `${nickname}的名片`,
          }}
          style={{ width: '200px' }}
        >
          {nickname}的名片
        </Typography.Text>
      );
    }

    if (record.contentType === MessageType.LocationMessage) {
      const addr = JSON.parse(JSON.parse(record.content).description).addr;
      return renderEllipsisText(addr);
    }

    if (record.contentType === MessageType.CustomMessage) {
      return renderEllipsisText(parseCustomMessageText(record.content));
    }

    if (record.contentType === MessageType.QuoteMessage) {
      const text = JSON.parse(record.content).text;
      return renderEllipsisText(text);
    }

    if (record.contentType === MessageType.FaceMessage) {
      return <Image width={100} src={getResourceUrl(JSON.parse(JSON.parse(record.content).data).url)} />;
    }

    if (record.contentType === MessageType.FriendAdded) {
      return <span>-</span>;
    }

    if (record.contentType === MessageType.OANotification) {
      const text = JSON.parse(JSON.parse(record.content).detail).text;

      return (
        <Typography.Text ellipsis={{ tooltip: text }} style={{ width: '200px' }}>
          {text}
        </Typography.Text>
      );
    }

    if (record.contentType === MessageType.GroupCreated) {
      const user = JSON.parse(JSON.parse(record.content).detail).groupOwnerUser.nickname;
      const text = intl.formatMessage(
        {
          id: 'message.GroupCreated.parse',
        },
        {
          name: user,
        },
      );

      return (
        <Typography.Text ellipsis={{ tooltip: text }} style={{ width: '200px' }}>
          {text}
        </Typography.Text>
      );
    }

    if (record.contentType === MessageType.MemberQuit) {
      const nickname = JSON.parse(JSON.parse(record.content).detail).quitUser.nickname;
      const text = intl.formatMessage(
        {
          id: 'message.MemberQuit.parse',
        },
        {
          name: nickname,
        },
      );
      return (
        <Typography.Text ellipsis={{ tooltip: text }} style={{ width: '200px' }}>
          {text}
        </Typography.Text>
      );
    }

    if (record.contentType === MessageType.GroupOwnerTransferred) {
      const opUser = JSON.parse(JSON.parse(record.content).detail).opUser.nickname;
      const newOwner = JSON.parse(JSON.parse(record.content).detail).newGroupOwner.nickname;
      const text = intl.formatMessage(
        {
          id: 'message.GroupOwnerTransferred.parse',
        },
        {
          opUser,
          newOwner,
        },
      );
      return (
        <Typography.Text ellipsis={{ tooltip: text }} style={{ width: '200px' }}>
          {text}
        </Typography.Text>
      );
    }

    if (record.contentType === MessageType.MemberKicked) {
      const opUser = JSON.parse(JSON.parse(record.content).detail).opUser.nickname;
      const listStr = JSON.parse(JSON.parse(record.content).detail)
        .kickedUserList.map((e: any) => e.nickname)
        .join(',');
      const text = intl.formatMessage(
        {
          id: 'message.MemberKicked.parse',
        },
        {
          listStr,
          opUser,
        },
      );
      return (
        <Typography.Text ellipsis={{ tooltip: text }} style={{ width: '200px' }}>
          {text}
        </Typography.Text>
      );
    }

    if (record.contentType === MessageType.MemberInvited) {
      const opUser = JSON.parse(JSON.parse(record.content).detail).opUser.nickname;
      const listStr = JSON.parse(JSON.parse(record.content).detail)
        .invitedUserList.map((e: any) => e.nickname)
        .join(',');
      const text = intl.formatMessage(
        {
          id: 'message.MemberInvited.parse',
        },
        {
          opUser,
          listStr,
        },
      );
      return (
        <Typography.Text ellipsis={{ tooltip: text }} style={{ width: '200px' }}>
          {text}
        </Typography.Text>
      );
    }

    if (record.contentType === MessageType.MemberEnter) {
      const nickname = JSON.parse(JSON.parse(record.content).detail).entrantUser.nickname;
      const text = intl.formatMessage(
        {
          id: 'message.MemberEnter.parse',
        },
        {
          nickname,
        },
      );
      return (
        <Typography.Text ellipsis={{ tooltip: text }} style={{ width: '200px' }}>
          {text}
        </Typography.Text>
      );
    }

    if (record.contentType === MessageType.GroupDismissed) {
      const opUser = JSON.parse(JSON.parse(record.content).detail).opUser.nickname;
      const text = intl.formatMessage(
        {
          id: 'message.DismissGroup.parse',
        },
        {
          opUser,
        },
      );
      return (
        <Typography.Text ellipsis={{ tooltip: text }} style={{ width: '200px' }}>
          {text}
        </Typography.Text>
      );
    }

    if (record.contentType === MessageType.GroupMemberMuted) {
      const source = JSON.parse(JSON.parse(record.content).detail);
      const opUser = source.opUser.nickname;
      const mutedUser = source.mutedUser.nickname;
      const mutedSeconds = source.mutedSeconds;
      const text = intl.formatMessage(
        {
          id: 'message.MemberMutedNotification.parse',
        },
        {
          mutedUser,
          opUser,
          mutedSeconds,
        },
      );
      return (
        <Typography.Text ellipsis={{ tooltip: text }} style={{ width: '200px' }}>
          {text}
        </Typography.Text>
      );
    }

    if (record.contentType === MessageType.GroupMemberCancelMuted) {
      const source = JSON.parse(JSON.parse(record.content).detail);
      const opUser = source.opUser.nickname;
      const mutedUser = source.mutedUser.nickname;
      const text = intl.formatMessage(
        {
          id: 'message.MemberCancelMutedNotification.parse',
        },
        {
          opUser,
          mutedUser,
        },
      );
      return (
        <Typography.Text ellipsis={{ tooltip: text }} style={{ width: '200px' }}>
          {text}
        </Typography.Text>
      );
    }

    if (record.contentType === MessageType.GroupMuted) {
      const nickname = JSON.parse(JSON.parse(record.content).detail).opUser.nickname;
      const text = intl.formatMessage(
        {
          id: 'message.MutedNotification.parse',
        },
        {
          nickname,
        },
      );
      return (
        <Typography.Text ellipsis={{ tooltip: text }} style={{ width: '200px' }}>
          {text}
        </Typography.Text>
      );
    }

    if (record.contentType === MessageType.GroupCancelMuted) {
      const nickname = JSON.parse(JSON.parse(record.content).detail).opUser.nickname;
      const text = intl.formatMessage(
        {
          id: 'message.CancelMutedNotification.parse',
        },
        {
          nickname,
        },
      );
      return (
        <Typography.Text ellipsis={{ tooltip: text }} style={{ width: '200px' }}>
          {text}
        </Typography.Text>
      );
    }

    if (record.contentType === MessageType.GroupAnnouncementUpdated) {
      const nickname = JSON.parse(JSON.parse(record.content).detail).opUser.nickname;
      const text = intl.formatMessage(
        {
          id: 'message.GroupAnnouncementUpdated.parse',
        },
        {
          nickname,
        },
      );
      return (
        <Typography.Text ellipsis={{ tooltip: text }} style={{ width: '200px' }}>
          {text}
        </Typography.Text>
      );
    }

    if (record.contentType === MessageType.GroupNameUpdated) {
      const nickname = JSON.parse(JSON.parse(record.content).detail).opUser.nickname;
      const text = intl.formatMessage(
        {
          id: 'message.GroupNameUpdated.parse',
        },
        {
          nickname,
        },
      );
      return (
        <Typography.Text ellipsis={{ tooltip: text }} style={{ width: '200px' }}>
          {text}
        </Typography.Text>
      );
    }

    if (record.contentType === MessageType.BurnMessageChange) {
      const text = JSON.parse(JSON.parse(record.content).detail).isPrivate
        ? intl.formatMessage({ id: 'message.PrivateMessage.open' })
        : intl.formatMessage({ id: 'message.PrivateMessage.close' });
      return (
        <Typography.Text ellipsis={{ tooltip: text }} style={{ width: '200px' }}>
          {text}
        </Typography.Text>
      );
    }

    if (record.contentType === MessageType.RevokeMessage) {
      const revokerNickname = JSON.parse(JSON.parse(record.content).detail).revokerNickname;
      const text = intl.formatMessage(
        {
          id: 'message.MsgRevokeNotification.parse',
        },
        {
          revokerNickname,
        },
      );
      return (
        <Typography.Text ellipsis={{ tooltip: text }} style={{ width: '200px' }}>
          {text}
        </Typography.Text>
      );
    }
  } catch (e) {
    const tooltip = `parse json error:${e}`;
    return (
      <Typography.Text
        ellipsis={{
          tooltip,
        }}
        style={{ width: '200px' }}
      >
        {tooltip}
      </Typography.Text>
    );
  }

  return (
    <Typography.Text
      ellipsis={{
        tooltip: record.content,
      }}
      style={{ width: '200px' }}
    >
      {record.content}
    </Typography.Text>
  );
};

export default MessageParse;
