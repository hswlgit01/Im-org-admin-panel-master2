import { CHAT_URL } from '@/config';
import { request } from '@umijs/max';
import { v4 as uuidv4 } from 'uuid';

export async function getWebhookList(params: any) {
  return request<any>('/third_admin/webhook/list', {
    method: 'GET',
    params: {
      ...params,
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

// 添加webhook接口
export async function addWebhook(data: any) {
  return request<any>('/third_admin/webhook/create', {
    method: 'POST',
    data,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

// 更新webhook状态接口
export async function updateWebhookStatus(data: any) {
  return request<any>('/third_admin/webhook/update', {
    method: 'POST',
    data,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

// 删除webhook接口
export async function deleteWebhook(data: any) {
  return request<any>('/third_admin/webhook/delete', {
    method: 'POST',
    data,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function getWebhookTriggerList() {
  return request<any>('/third_admin/webhook/trigger/list', {
    method: 'GET',
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
