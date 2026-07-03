import { ACCOUNT_URL, API_URL, CHAT_URL } from '@/config';
import { request } from '@umijs/max';
export async function getUserList(params: API.UserManage.GetUserParams) {
  return request<{ data: API.UserManage.GetUserResult }>('/third/user/search/full', {
    method: 'POST',
    data: {
      ...params,
      normal: 1,
    },
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function getUserListForIM(params: API.UserManage.GetUserParams) {
  return request<{ data: API.UserManage.GetUserResult }>('/user/get_users', {
    method: 'POST',
    data: {
      ...params,
    },
    baseURL: API_URL,
  });
}

export async function getBlockList(params: API.UserManage.GetUserParams) {
  return request<{ data: API.UserManage.GetUserResult }>('/third_admin/block/search', {
    method: 'POST',
    data: {
      ...params,
    },
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function getFriendList(params: API.UserManage.GetFriendsParams) {
  return request<{ data: API.UserManage.GetFriendsResult }>('/friend/get_friend_list', {
    method: 'POST',
    data: {
      ...params,
    },
    baseURL: API_URL,
  });
}

export async function getUsersOnlineStatus(params: API.UserManage.GetUsersOnlineStatusParams) {
  return request<{ data: API.UserManage.GetUsersOnlineStatusResult[] }>(
    '/user/get_users_online_token_detail',
    {
      method: 'POST',
      data: {
        ...params,
      },
      baseURL: API_URL,
    },
  );
}

export async function updateRolePermissions(params: { role: string, permissions_code: string []}) {
  return request('/third_admin/organization_role_permission/update_org_role_permission', {
    method: 'POST',
    data: {
      ...params,
    },
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function selectRolePermissions(params: { role: string }) {
  return request('/third_admin/organization_role_permission/get_org_role_permission', {
    method: 'GET',
    params,
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function updateUserInfo(params: API.UserManage.UpdateUserInfoParams) {
  return request('user/update', {
    method: 'POST',
    data: {
      ...params,
    },
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function updateOrgUserNickname(params: { userID: string; nickname: string }) {
  return request('/third_admin/organization_user/update_nickname', {
    method: 'POST',
    data: {
      ...params,
      nickname: params.nickname.trim(),
    },
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function registerUser(params: API.UserManage.RegisterUserParams) {
  return request('/user/import/json', {
    method: 'POST',
    data: {
      users: [
        {
          ...params.user,
          registerType: 0,
        },
      ],
    },
    headers: {
      isAccount: true,
    },
    baseURL: ACCOUNT_URL,
  });
}

export async function resetUserPassword(params: API.UserManage.ResetUserPasswordParams) {
  // dawn 2026-07-03 修复重置密码报"无效的参数"：兼容后端不同字段命名(userID / user_id)，两个都带上，
  // 避免因字段名不匹配导致 bind 失败。后端 NormalizedUserID 会择一取用。
  const uid = (params as any).userID ?? (params as any).user_id;
  return request('/third_admin/organization_user/reset_password', {
    method: 'POST',
    data: {
      ...params,
      userID: uid,
      user_id: uid,
    },
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function updateBlock(params: API.UserManage.UpdateBlockParams) {
  return request('/third_admin/block/add', {
    method: 'POST',
    data: {
      ...params,
    },
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function deleteBlock(params: API.UserManage.DeleteBlockParams) {
  return request('/third_admin/block/del', {
    method: 'POST',
    data: {
      ...params,
    },
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function deleteFriend(params: API.UserManage.DeleteFriendParams) {
  return request('/friend/delete_friend', {
    method: 'POST',
    data: {
      ...params,
    },
    baseURL: API_URL,
  });
}

export async function forceLogout(params: API.UserManage.KickUserParams) {
  return request('/auth/force_logout', {
    method: 'POST',
    data: {
      ...params,
    },
    baseURL: API_URL,
  });
}

export async function getUserToken(userID: string) {
  return request('/auth/get_user_token', {
    method: 'POST',
    data: {
      userID,
      platformID: 10,
    },
    baseURL: API_URL,
  });
}

// Identity Verification APIs
export async function getIdentityVerificationList(params: API.UserManage.GetIdentityListParams) {
  return request<{ data: API.UserManage.GetIdentityListResult }>('/third_admin/identity/list', {
    method: 'GET',
    params: {
      status: params.status,
      keyword: params.keyword,
      pageNumber: params.pagination.pageNumber,
      showNumber: params.pagination.showNumber,
      // 新增排序参数
      orderKey: params.orderKey,
      orderDirection: params.orderDirection,
      // 新增时间范围参数
      start_time: params.applyStartTime,  // 使用与后端一致的参数名
      end_time: params.applyEndTime,      // 使用与后端一致的参数名
      verify_start_time: params.verifyStartTime,  // 使用与后端一致的参数名
      verify_end_time: params.verifyEndTime,      // 使用与后端一致的参数名
    },
    headers: {
      isAccount: true,
      operationID: new Date().getTime().toString(),  // 添加操作ID，确保请求唯一性
    },
    baseURL: CHAT_URL,
  });
}

/** 实名详情（单条），与 list 返回 data 结构相同：{ total, list } */
export async function getIdentityVerificationDetail(keyword: string) {
  return request<{ data: API.UserManage.GetIdentityListResult }>('/third_admin/identity/detail', {
    method: 'GET',
    params: { keyword },
    headers: {
      isAccount: true,
      operationID: new Date().getTime().toString(),
    },
    baseURL: CHAT_URL,
  });
}

export async function approveIdentityVerification(params: { userID: string }) {
  return request('/third_admin/identity/approve', {
    method: 'POST',
    data: {
      ...params,
    },
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

/** 批量审核通过，单次最多 200 条（与后端一致）；多于 200 请在上层分批调用 */
export async function approveIdentityVerificationBatch(params: { userIDs: string[] }) {
  return request<{ data?: API.UserManage.IdentityApproveBatchResult } & API.UserManage.IdentityApproveBatchResult>(
    '/third_admin/identity/approve_batch',
    {
      method: 'POST',
      data: { userIDs: params.userIDs },
      headers: {
        isAccount: true,
        operationID: new Date().getTime().toString(),
      },
      baseURL: CHAT_URL,
    },
  );
}

export async function rejectIdentityVerification(params: { userID: string; rejectReason?: string }) {
  return request('/third_admin/identity/reject', {
    method: 'POST',
    data: {
      ...params,
    },
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function cancelIdentityVerification(params: { userID: string }) {
  return request('/third_admin/identity/cancel', {
    method: 'POST',
    data: {
      ...params,
    },
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
