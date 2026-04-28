import { CHAT_URL } from '@/config';
import { request } from '@umijs/max';

export type IPBlockItem = {
  ip: string;
  limit_register: boolean;
  limit_login: boolean;
  create_time: string;
};

export async function getIPBlockList(params: {
  keyword?: string;
  state?: number;
  page?: number;
  page_size?: number;
}) {
  return request<{ data: { data: IPBlockItem[]; total: number } }>('/third_admin/ip_block/list', {
    method: 'GET',
    params,
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function createIPBlock(params: {
  ip: string;
  limit_register?: boolean;
  limit_login?: boolean;
}) {
  return request('/third_admin/ip_block/create', {
    method: 'POST',
    data: {
      ip: params.ip,
      limit_register: params.limit_register ?? true,
      limit_login: params.limit_login ?? false,
    },
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function deleteIPBlock(ips: string[]) {
  return request('/third_admin/ip_block/delete', {
    method: 'POST',
    data: {
      ips,
    },
    headers: {
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
