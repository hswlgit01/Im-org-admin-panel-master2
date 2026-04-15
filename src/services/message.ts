import { API_URL } from '@/config';
import { request } from '@umijs/max';

export async function getMessageList(params: API.ChatLog.GetChatLogParams) {
  return request<{ data: API.ChatLog.GetChatLogResult }>('/msg/search_msg', {
    method: 'POST',
    data: {
      ...params,
    },
    baseURL: API_URL,
  });
}

export function revokeMessage(params: API.ChatLog.RevokeMessageParams) {
  return request('/msg/revoke_msg', {
    method: 'POST',
    data: {
      ...params,
    },
    baseURL: API_URL,
  });
}
