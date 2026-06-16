import { CHAT_URL } from '@/config';
import { request } from '@umijs/max';
import { v4 as uuidv4 } from 'uuid';

export type SlowQueryLogItem = {
  id: string;
  created_at: string;
  timestamp: string;
  collection: string;
  operation: string;
  complete_query: string;
  duration: string;
  duration_ms: number;
  error?: string;
};

export type SlowQueryLogSearchParams = {
  page?: number;
  page_size?: number;
  keyword?: string;
  collection?: string;
  operation?: string;
  min_duration_ms?: number;
  start_time?: number;
  end_time?: number;
};

// dawn 2026-06-16 新增慢查询日志后台：查询 slow_query_log，页面可筛选并导出。
export async function getSlowQueryLogs(params: SlowQueryLogSearchParams) {
  return request('/third_admin/slow_query_log/list', {
    method: 'GET',
    params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
