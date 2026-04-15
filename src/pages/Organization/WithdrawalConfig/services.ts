import { CHAT_URL } from '@/config';
import { request } from '@umijs/max';
import { v4 as uuidv4 } from 'uuid';

// 获取提现规则配置
export async function getWithdrawalRule() {
  return request('/third_admin/withdrawal/rule', {
    method: 'GET',
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

// 保存提现规则配置
export async function saveWithdrawalRule(data: {
  isEnabled: boolean;
  minAmount: number;
  maxAmount: number;
  feeFixed: number;
  feeRate: number;
  needRealName: boolean;
  needBindAccount: boolean;
}) {
  return request('/third_admin/withdrawal/rule', {
    method: 'POST',
    data,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
