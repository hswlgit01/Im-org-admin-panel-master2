import { API_URL, CHAT_URL } from '@/config';
import { request } from '@umijs/max';
import { v4 as uuidv4 } from 'uuid';

export async function getLogs(params: API.LogManage.SearchLogs) {
  return request('/third_admin/operation_log/list', {
    method: 'GET',
    params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export function deleteLog(logIDs: string[]) {
  return request('/third/logs/delete', {
    method: 'POST',
    data: {
      logIDs,
    },
    baseURL: API_URL,
  });
}
