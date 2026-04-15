import { CHAT_URL } from '@/config';
import { v4 as uuidv4 } from 'uuid';
import { request } from '@umijs/max';

// 补偿金系统设置类型
export type CompensationSettings = {
  enabled: boolean;
  initial_amount: string;
  notice_text?: string; // 添加用户钱包开通时显示的说明文本
};

// 用户补偿金余额信息类型
export type UserCompensationBalance = {
  user_id: string;
  username: string;
  wallet_id: string;
  currency_id: string;
  currency_name: string;
  compensation_balance: string;
};

// 调整用户补偿金余额请求参数
export type AdjustUserCompensationBalanceParams = {
  user_id: string;
  currency_id: string;
  amount: string;
  reason: string;
};

// 获取补偿金系统设置
export async function getCompensationSettings() {
  return request<{ errCode: number; data: CompensationSettings; errDlt: string }>('/third_admin/organization/wallet/compensation/get_settings', {
    method: 'POST',
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

// 更新补偿金系统设置
export async function updateCompensationSettings(params: CompensationSettings) {
  return request<{ errCode: number; data: any; errDlt: string }>('/third_admin/organization/wallet/compensation/update_settings', {
    method: 'POST',
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    data: params,
    baseURL: CHAT_URL,
  });
}

// 获取用户补偿金余额
export async function getUserCompensationBalance(params: { user_id: string; currency_id: string }) {
  return request<{ errCode: number; data: UserCompensationBalance; errDlt: string }>('/third_admin/organization/wallet/compensation/get_user_balance', {
    method: 'POST',
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    data: params,
    baseURL: CHAT_URL,
  });
}

// 调整用户补偿金余额
export async function adjustUserCompensationBalance(params: AdjustUserCompensationBalanceParams) {
  return request<{ errCode: number; data: any; errDlt: string }>('/third_admin/organization/wallet/compensation/adjust_user_balance', {
    method: 'POST',
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    data: params,
    baseURL: CHAT_URL,
  });
}