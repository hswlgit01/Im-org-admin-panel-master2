import { CHAT_URL } from '@/config';
import { request } from '@umijs/max';
import { v4 as uuidv4 } from 'uuid';

// 获取提现列表
export async function getWithdrawalList(params: {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: number;
  /** 申请时间范围（Unix 毫秒） */
  createdAtStart?: number;
  createdAtEnd?: number;
}) {
  return request('/third_admin/withdrawal/list', {
    method: 'GET',
    params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

/** 导出提现 CSV（列与后台聚合脚本一致：业务员/用户姓名/会员账号/下级人数/申请时间/提现金额/状态） */
export async function exportWithdrawalCsv(params: {
  keyword?: string;
  status?: number;
  createdAtStart?: number;
  createdAtEnd?: number;
}) {
  return request(`/third_admin/withdrawal/export`, {
    method: 'GET',
    params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    responseType: 'blob',
    baseURL: CHAT_URL,
    getResponse: true,
  });
}

// 审核通过
export async function approveWithdrawal(data: { id: string }) {
  return request('/third_admin/withdrawal/approve', {
    method: 'POST',
    data,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

// 审核拒绝
export async function rejectWithdrawal(data: { id: string; reason: string }) {
  return request('/third_admin/withdrawal/reject', {
    method: 'POST',
    data,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

// 确认打款
export async function transferWithdrawal(data: { id: string }) {
  return request('/third_admin/withdrawal/transfer', {
    method: 'POST',
    data,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

// 确认完成
export async function completeWithdrawal(data: { id: string }) {
  return request('/third_admin/withdrawal/complete', {
    method: 'POST',
    data,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

// 批量审核通过
export async function batchApproveWithdrawal(data: { ids: string[] }) {
  return request('/third_admin/withdrawal/batch-approve', {
    method: 'POST',
    data,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
