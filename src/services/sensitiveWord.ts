import { CHAT_URL } from '@/config';
import { request } from '@umijs/max';
import { v4 as uuidv4 } from 'uuid';

// dawn 2026-05-14 新增敏感词维护：管理后台调用 Chat 服务维护消息脱敏词表。
export type SensitiveWordItem = {
  id: string;
  org_id: string;
  org_id_hex: string;
  word: string;
  status: number;
  remark?: string;
  create_time: string;
  update_time: string;
};

export type SensitiveWordSearchParams = {
  page?: number;
  page_size?: number;
  keyword?: string;
  status?: number;
};

export async function getSensitiveWordList(params: SensitiveWordSearchParams) {
  return request('/third_admin/sensitive_word/list', {
    method: 'GET',
    params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function createSensitiveWord(params: {
  word: string;
  status: number;
  remark?: string;
}) {
  return request('/third_admin/sensitive_word/create', {
    method: 'POST',
    data: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function updateSensitiveWord(params: {
  id: string;
  word: string;
  status: number;
  remark?: string;
}) {
  return request('/third_admin/sensitive_word/update', {
    method: 'POST',
    data: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function deleteSensitiveWords(ids: string[]) {
  return request('/third_admin/sensitive_word/delete', {
    method: 'POST',
    data: { ids },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
