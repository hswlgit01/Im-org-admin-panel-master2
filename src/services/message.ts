import { CHAT_URL } from '@/config';
import { request } from '@umijs/max';
import { v4 as uuidv4 } from 'uuid';

// dawn 2026-05-05 修复后台聊天记录管理：统一走 Chat 服务代理接口以写入操作审计。
export async function getMessageList(params: API.ChatLog.GetChatLogParams) {
  return request<{ data: API.ChatLog.GetChatLogResult }>('/third_admin/message/search', {
    method: 'POST',
    data: {
      ...params,
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export function revokeMessage(params: API.ChatLog.RevokeMessageParams) {
  return request('/third_admin/message/revoke', {
    method: 'POST',
    data: {
      ...params,
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export function deleteMessage(params: API.ChatLog.DeleteMessageParams) {
  return request('/third_admin/message/delete', {
    method: 'POST',
    data: {
      ...params,
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
