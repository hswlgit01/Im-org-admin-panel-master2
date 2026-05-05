import { CHAT_URL } from '@/config';
import { request } from '@umijs/max';
import { v4 as uuidv4 } from 'uuid';

export type AppLogItem = {
  id: string;
  org_id: string;
  user_id: string;
  im_server_user_id: string;
  batch_id: string;
  session_id: string;
  device_id: string;
  platform: number;
  system_type: string;
  app_version: string;
  level: string;
  tag: string;
  message: string;
  stack?: string;
  extra?: Record<string, unknown>;
  reason: string;
  source_ip: string;
  client_time: string;
  server_time: string;
  user?: {
    nickname?: string;
    face_url?: string;
    user_id?: string;
  };
  attribute?: {
    account?: string;
    nickname?: string;
    face_url?: string;
  };
  // dawn 2026-05-05 修复 App 日志类型：补齐后端返回的 org_user 字段。
  org_user?: {
    account?: string;
    nickname?: string;
    face_url?: string;
    user_id?: string;
    im_server_user_id?: string;
  };
};

export type AppLogSearchParams = {
  page?: number;
  page_size?: number;
  keyword?: string;
  user_id?: string;
  im_server_user_id?: string;
  level?: string;
  platform?: number;
  device_id?: string;
  session_id?: string;
  app_version?: string;
  reason?: string;
  start_time?: number;
  end_time?: number;
};

export async function getAppLogs(params: AppLogSearchParams) {
  return request('/third_admin/app_log/list', {
    method: 'GET',
    params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
