import { ACCOUNT_URL, CHAT_URL } from '@/config';
import { request } from '@umijs/max';
import { v4 as uuidv4 } from 'uuid';

export async function adminLogin(params: API.AccountManage.AdminLoginParams) {
  return request<{ data: API.AccountManage.Account }>('/third_admin/login', {
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

export async function insertMember(params: API.UserManage.Member) {
  return request('/third_admin/organization_user/add_backend_admin', {
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

export async function updateUserRole(params: { user_id: string; role: string }) {
  return request('/third_admin/organization_user/update_web_user_role', {
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
export async function updateUserAuth(params: { user_id: string; can_send_free_msg: number }) {
  return request('/third_admin/organization_user/update_can_send_free_msg', {
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

export async function updateUserStatus(params: { user_id: number; status: string }) {
  return request('/third_admin/organization_user/update_user_status', {
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

export async function selectMemberList(data: any) {
  return request<any>('/third_admin/organization_user/post_org_user', {
    method: 'post',
    data: {
      ...data,
      page_size: data.pageSize,
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

// dawn 2026-07-04 最近操作时间：批量查询用户最近操作时间(user_id→毫秒)。
export async function getOrgUserOperationTimes(data: { user_ids: string[] }) {
  return request<any>('/third_admin/organization_user/operation_times', {
    method: 'post',
    data,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

/** 列表 omit_wallet 后，按页合并钱包/补偿金（仅本组织 user_id） */
export async function postOrgUserWalletSnapshot(body: { user_ids: string[] }) {
  return request<{ list: API.UserManage.WalletSnapshotItem[] }>(
    '/third_admin/organization_user/wallet_snapshot',
    {
      method: 'POST',
      data: body,
      headers: {
        operationID: uuidv4(),
        isAccount: true,
      },
      baseURL: CHAT_URL,
    },
  );
}

export async function adminInfo() {
  return request<{ data: API.AccountManage.AccountInfo }>('account/info', {
    method: 'POST',
    data: {},
    headers: {
      isAccount: true,
    },
    baseURL: ACCOUNT_URL,
  });
}
export async function organizationInfo() {
  return request<any>('/third_admin/organization/info', {
    method: 'get',
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function downloadTemplate() {
  return request<any>('/third_admin/user/import_user_template_excel', {
    method: 'get',
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    responseType: 'blob',
    baseURL: CHAT_URL,
  });
}
export async function uploadTemplate(formData) {
  return request<any>('/third_admin/user/import_user_via_excel', {
    method: 'POST',
    formData: true,
    data: formData,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function userInfo(data: {userIDs: string []}) {
  return request<any>('/third/user/find/full', {
    method: 'post',
    data,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function updateAdminInfo(params: API.AccountManage.UpdateAdminInfoParams) {
  return request("/third/user/update_info",{
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

export async function changeAdminPassword(params: API.AccountManage.ChangeAdminPwdParams) {
  return request('/account/change_org_user_password', {
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

export async function changeOrganizationInfo(params: any) {
  return request('/third_admin/organization/update', {
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
