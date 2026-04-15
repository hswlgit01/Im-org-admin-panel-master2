import { CHAT_URL } from '@/config';
import { request } from '@umijs/max';
import { v4 as uuidv4 } from 'uuid';

export async function getGroupList(params: any) {
  return request<any>('/third_admin/group/list', {
    method: 'POST',
    data: {
      ...params,
    },
    headers: {
      isAccount: true,
      operationID: uuidv4(),
    },
    baseURL: CHAT_URL,
  });
}

export async function createGroup(params: any) {
  return request<any>('/third_admin/group/create', {
    method: 'POST',
    data: {
      ...params,
    },
    headers: {
      isAccount: true,
      operationID: uuidv4(),
    },
    baseURL: CHAT_URL,
  });
}

export async function muteGroup(groupID: string) {
  return request('/third_admin/group/mute', {
    method: 'POST',
    data: {
      group_id: groupID,
    },
    headers: {
      isAccount: true,
      operationID: uuidv4(),
    },
    baseURL: CHAT_URL,
  });
}

export async function cancelMuteGroup(groupID: string) {
  return request('/third_admin/group/cancel_mute', {
    method: 'POST',
    data: {
      group_id: groupID,
    },
    headers: {
      isAccount: true,
      operationID: uuidv4(),
    },
    baseURL: CHAT_URL,
  });
}

export async function dismissGroup(groupID: string) {
  return request('/third_admin/group/dismiss', {
    method: 'POST',
    data: {
      group_id: groupID,
    },
    headers: {
      isAccount: true,
      operationID: uuidv4(),
    },
    baseURL: CHAT_URL,
  });
}

export async function getOrganizationUsers(params: any) {
  return request('/third_admin/organization/users', {
    method: 'GET',
    params: {
      ...params,
    },
    headers: {
      isAccount: true,
      operationID: uuidv4(),
    },
    baseURL: CHAT_URL,
  });
}
