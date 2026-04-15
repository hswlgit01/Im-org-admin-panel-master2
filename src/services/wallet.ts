import { CHAT_URL } from '@/config';
import { request } from '@umijs/max';
import { v4 as uuidv4 } from 'uuid';

export async function walletExist() {
  return request<any>('/third_admin/organization/wallet/exist', {
    method: 'POST',
    data: {},
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function checkPassword(password: string) {
  return request<any>('/third/account/compare', {
    method: 'POST',
    data: {
      pwd: password,
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function getAESkey(rsa_public_key: string) {
  return request<any>('/third/user_keys/setup', {
    method: 'POST',
    data: {
      rsa_public_key,
      user_req_type: 'organization',
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
      Authorization: `Bearer ${localStorage.getItem('IMAccountToken')}`,
      'Content-Type': 'application/json',
      source: 'web',
    },
    baseURL: CHAT_URL,
  });
}
export async function createWallet(params: any) {
  return request<any>('/third_admin/organization/wallet/create', {
    method: 'POST',
    data: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function getWalletBalance() {
  return request<any>('/third_admin/organization/wallet/balance', {
    method: 'GET',
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function createCurrency(params: any) {
  return request<any>('/third_admin/organization/wallet/currency/create', {
    method: 'POST',
    data: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function updatePayPwd(params: any) {
  return request<any>('/third_admin/organization/wallet/update', {
    method: 'POST',
    data: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function getExchangeRate() {
  return request<any>('/third/exchange_rate/latest', {
    method: 'GET',
    headers: {
      operationID: uuidv4(),
      isAccount: true,
      'Content-Type': 'application/json',
    },
    baseURL: CHAT_URL,
  });
}

export async function getWalletTsRecord(params?: {
  type?: number;
  page?: number;
  pageSize?: number;
  order?: string;
  startTime?: string;
  endTime?: string;
  currency_id?: string;
}) {
  return request<any>('/third_admin/organization/wallet_ts_record/ts', {
    method: 'GET',
    params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function updateCurrency(params: any) {
  return request<any>('/third_admin/organization/wallet/currency/update', {
    method: 'POST',
    data: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function createTransfer(params: any) {
  return request<any>('/third/transaction/create', {
    method: 'POST',
    data: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
      source: 'web',
    },
    baseURL: CHAT_URL,
  });
}
