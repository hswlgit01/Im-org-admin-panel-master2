import { MessageType } from 'open-im-sdk';

export enum GroupStatus {
  Nomal = 0,
  Baned = 1,
  Dismissed = 2,
  Muted = 3,
}

export enum GroupVerificationType {
  ApplyNeedInviteNot,
  AllNeed,
  AllNot,
  DisallowAllJoins,
}

export enum AllowType {
  Allowed,
  NotAllowed,
  DisallowViewGroupInfo,
  DisallowAdminViewMembers,
}

export enum GroupRole {
  Nomal = 20,
  Owner = 100,
  Admin = 60,
}

export enum GroupJoinSource {
  Invitation = 2,
  Search = 3,
  QrCode = 4,
}

export enum SessionType {
  Single = 1,
  Group = 2,
  SuperGroup = 3,
  Notification = 4,
}

export const CustomMessageType = {
  Call: 100,
  MassMsg: 903,
  MeetingInvitation: 905,
};

export const canRevokeMessage = [
  MessageType.TextMessage,
  MessageType.PictureMessage,
  MessageType.VoiceMessage,
  MessageType.VideoMessage,
  MessageType.FileMessage,
  MessageType.AtTextMessage,
  MessageType.MergeMessage,
  MessageType.CardMessage,
  MessageType.LocationMessage,
  MessageType.CustomMessage,
  MessageType.QuoteMessage,
  MessageType.FaceMessage,
];

export const nomalMessageTypes = [...canRevokeMessage, MessageType.RevokeMessage];

export const tipMessageTypes = [
  MessageType.FriendAdded,
  MessageType.GroupCreated,
  MessageType.GroupOwnerTransferred,
  MessageType.MemberQuit,
  MessageType.MemberInvited,
  MessageType.MemberKicked,
  MessageType.MemberEnter,
  MessageType.GroupDismissed,
  MessageType.GroupMuted,
  MessageType.GroupCancelMuted,
  MessageType.GroupMemberMuted,
  MessageType.GroupMemberCancelMuted,
  MessageType.GroupNameUpdated,
  MessageType.BurnMessageChange,
  MessageType.OANotification,
];

export const canSearchMessageTypes = [...nomalMessageTypes, ...tipMessageTypes];

// 钱包交易类型
export enum TransactionType {
  TransferOut = 1, // 转账支出
  TransferRefund = 2, // 转账退款
  TransferIn = 3, // 转账领取
  RedPacketRefund = 11, // 红包退款
  RedPacketOut = 12, // 红包支出
  RedPacketIn = 13, // 红包领取
  Deposit = 21, // 充值
  Withdraw = 22, // 提现
  Consume = 23, // 消费
  IssueCurrency = 31, // 发行货币
}

export const TransactionTypeText: Record<number, string> = {
  [TransactionType.TransferOut]: '转账支出',
  [TransactionType.TransferRefund]: '转账退款',
  [TransactionType.TransferIn]: '转账领取',
  [TransactionType.RedPacketRefund]: '红包退款',
  [TransactionType.RedPacketOut]: '红包支出',
  [TransactionType.RedPacketIn]: '红包领取',
  [TransactionType.Deposit]: '充值',
  [TransactionType.Withdraw]: '提现',
  [TransactionType.Consume]: '消费',
  [TransactionType.IssueCurrency]: '发行货币',
};

export const TransactionTypeColor: Record<number, string> = {
  [TransactionType.TransferOut]: 'red',
  [TransactionType.TransferRefund]: 'blue',
  [TransactionType.TransferIn]: 'blue',
  [TransactionType.RedPacketRefund]: 'blue',
  [TransactionType.RedPacketOut]: 'red',
  [TransactionType.RedPacketIn]: 'blue',
  [TransactionType.Deposit]: 'blue',
  [TransactionType.Withdraw]: 'red',
  [TransactionType.Consume]: 'red',
  [TransactionType.IssueCurrency]: 'green',
};
