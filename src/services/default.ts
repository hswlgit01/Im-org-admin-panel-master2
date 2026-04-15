import { ACCOUNT_URL, CHAT_URL } from '@/config';
import { request } from '@umijs/max';

export enum InvitationCodeStatus {
  All = 1,
  UnUsed = 2,
  Used = 3,
}

export async function getDefaultGroup(params: API.DefaultManage.GetDefaultGroupParams) {
  return request<{ data: API.DefaultManage.GetDefaultGroupResult }>('/third_admin/default_group/list', {
    params,
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function addDefaultGroup(groupIDs: string[]) {
  return request('/third_admin/default_group/create', {
    method: 'POST',
    data: {
      group_ids: groupIDs,
    },
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function removeDefaultGroup(groupIDs: string[]) {
  return request('/third_admin/default_group/delete', {
    method: 'POST',
    data: {
      group_ids: groupIDs,
    },
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function selectDefaultGroupList() {
  return request('/third_admin/default_group/search', {
    method: 'GET',
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function generateInvitationCode(num = 1, len = 8) {
  return request('/invitation_code/gen', {
    method: 'POST',
    data: {
      num,
      len,
      chars: 'ABCDEFGHIJKLM0123456789',
    },
    headers: {
      isAccount: true,
    },
    baseURL: ACCOUNT_URL,
  });
}

export async function getDefaultFriends(params: API.DefaultManage.GetDefaultFriendsParams) {
  return request<{ data: API.DefaultManage.GetDefaultFriendsResult }>('/third_admin/default_friend/list', {
    params,  
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function addDefaultFriends(userIDs: string[]) {
  return request('/third_admin/default_friend/create', {
    method: 'POST',
    data: {
      im_user_ids: userIDs,
    },
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function removeDefaultFriends(userIDs: string[]) {
  return request('/third_admin/default_friend/delete', {
    method: 'POST',
    data: {
      im_user_ids: userIDs,
    },
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function selectDefaultUserList() {
  return request('/third_admin/default_friend/search', {
    method: 'GET',
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
