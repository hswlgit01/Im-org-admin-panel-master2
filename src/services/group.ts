import { API_URL, CHAT_URL } from '@/config';
import { request } from '@umijs/max';
import { v4 as uuidv4 } from 'uuid';

// export async function getGroupList(params: API.GroupManage.GetGroupParams) {
//   return request<{ data: API.GroupManage.GetGroupResult }>('/group/get_groups', {
//     method: 'POST',
//     data: {
//       ...params,
//     },
//     baseURL: API_URL,
//   });
// }

export async function getGroupMemberList(params: API.GroupManage.GetGroupMembersParams) {
  return request<{ data: API.GroupManage.GetGroupMembersResult }>('/third_admin/group/members', {
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

export async function getSomeGroupMemberList(params: API.GroupManage.GetSomeGroupMembersParams) {
  return request('/group/get_group_members_info', {
    method: 'POST',
    data: {
      ...params,
    },
    baseURL: API_URL,
  });
}

export async function createGroup(params: API.GroupManage.CreateGroupParams) {
  return request('/third_admin/group/create', {
    method: 'POST',
    data: {
      ...params,
    },
    baseURL: CHAT_URL,
  });
}

export async function updateGroup(params: API.GroupManage.UpdateGroupParams) {
  return request('/third_admin/group/info/update', {
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

export async function muteGroup(groupID: string) {
  return request('/third_admin/group/mute', {
    method: 'POST',
    data: {
      groupID,
    },
    baseURL: CHAT_URL,
  });
}
export async function selectGroupLog(params) {
  return request('/third_admin/operation_log/group/list', {
    method: 'GET',
    params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function cancelMuteGroup(groupID: string) {
  return request('/third_admin/group/cancel_mute', {
    method: 'POST',
    data: {
      groupID,
    },
    baseURL: CHAT_URL,
  });
}

export async function dismissGroup(groupID: string) {
  return request('/third_admin/group/dismiss', {
    method: 'POST',
    data: {
      groupID,
    },
    baseURL: CHAT_URL,
  });
}

export async function kickGroupMemebr(params: API.GroupManage.KickGroupMemebrParams) {
  return request('/third_admin/group/members/kick', {
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

export async function invite2Group(params: API.GroupManage.InviteGroupMemebrParams) {
  return request('/third_admin/group/members/add', {
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

export async function muteGroupMember(params: API.GroupManage.MuteGroupMemebrParams) {
  return request('/third_admin/group/members/mute', {
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

export async function cancelMuteGroupMember(
  params: Omit<API.GroupManage.MuteGroupMemebrParams, 'mutedSeconds'>,
) {
  return request('/third_admin/group/members/cancel_mute', {
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

export async function updateGroupMemebr(params: API.GroupManage.UpdateGroupMemebrParams) {
  return request('/third_admin/group/members/info/update', {
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

export async function transferGroup(params: API.GroupManage.TransferGroupParams) {
  return request('/third_admin/group/members/info/transfer', {
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
