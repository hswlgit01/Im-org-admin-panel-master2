import { CHAT_URL } from '@/config';
import { request } from '@umijs/max';
import { v4 as uuidv4 } from 'uuid';

// dawn 2026-05-05 修复后台聊天记录管理：统一走 Chat 服务代理接口以写入操作审计。
export async function getMessageList(params: API.ChatLog.GetChatLogParams) {
  const response = await request<any>('/third_admin/message/search', {
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
  // dawn 2026-05-07 修复消息列表接口有数据但表格为空：兼容 request 层已解包和未解包两种响应结构。
  const payload =
    response?.chatLogs || response?.chatLogsNum !== undefined
      ? response
      : response?.data?.chatLogs || response?.data?.chatLogsNum !== undefined
      ? response.data
      : response?.data?.data?.chatLogs || response?.data?.data?.chatLogsNum !== undefined
      ? response.data.data
      : { chatLogs: [], chatLogsNum: 0 };
  return { data: payload as API.ChatLog.GetChatLogResult };
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
