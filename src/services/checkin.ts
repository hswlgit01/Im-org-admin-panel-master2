import { ACCOUNT_URL, CHAT_URL } from '@/config';
import { request } from '@umijs/max';
import { v4 as uuidv4 } from 'uuid';


export async function selectRewardList(params: API.UserManage.Member) {
  return request('/third_admin/lottery_reward/query', {
    method: 'GET',
    params: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function selectLotteryList(params: API.UserManage.Member) {
  return request('/third_admin/lottery/list', {
    method: 'GET',
    params: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function selectRewardConfigList(params: API.UserManage.Member) {
  return request('/third_admin/checkin_reward_config/list', {
    method: 'GET',
    params: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function selectUserTagsList(params: API.UserManage.Member) {
  return request('/third_admin/user_tags/list', {
    method: 'GET',
    params: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function selectUserPointsList(params: API.UserManage.Member) {
  return request('/third_admin/points/records', {
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
export async function selectCheckInStandarList(params: API.UserManage.Member) {
  return request('/third_admin/checkin_reward/list', {
    method: 'GET',
    params: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

// 修复当前组织下「阶段性奖励」去重（删除重复的 15 元等阶段奖励）
export async function fixContinuousCheckinRewards() {
  return request<{ deleted_continuous_rewards: number }>('/third_admin/checkin_reward/fix_continuous_rewards', {
    method: 'POST',
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function selectCheckInList(params: {
  startTime?: string;        // 添加开始时间参数
  endTime?: string;          // 添加结束时间参数
  order?: string;            // 添加排序字段参数
  imServerUserId?: string;   // 精确指定某个IM用户ID，用于单用户签到记录查询
} & Partial<API.UserManage.Member>) {
  return request('/third_admin/checkin/list', {
    method: 'GET',
    params: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function insertLottery(params: API.UserManage.Member) {
  return request('/third_admin/lottery/create', {
    method: 'POST',
    data: {
        ...params
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function selectRecordAuditList(params: API.UserManage.Member) {
  return request('/third_admin/lottery_user_record/list', {
    method: 'POST',
    data: {
        ...params
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function updateLottery(params: API.UserManage.Member) {
  return request('/third_admin/lottery/update', {
    method: 'POST',
    data: {
        ...params
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function insertReward(params: API.UserManage.Member) {
  return request('/third_admin/lottery_reward/create', {
    method: 'POST',
    data: {
        ...params
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function selectRegisterStatisticsList(params: API.UserManage.Member) {
  return request('/third_admin/statistics/system', {
    method: 'GET',
    params: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function selectSalesDailyStatisticsList(params: API.UserManage.Member) {
  return request('/third_admin/statistics/sales_daily', {
    method: 'GET',
    params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function selectTransactionRecordList(params: API.UserManage.Member) {
  return request('/third_admin/transaction/record', {
    method: 'POST',
    data: {
        ...params
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function selectReceiveList(params: API.UserManage.Member) {
  return request('/third_admin/transaction/receive_record', {
    method: 'POST',
    data: {
        ...params
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function updateReward(params: API.UserManage.Member) {
  return request('/third_admin/lottery_reward/modify', {
    method: 'POST',
    data: {
        ...params
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function deleteReward(params: { id: string}) {
  return request(`/third_admin/lottery_reward/rm/${params.id}`, {
    method: 'POST',
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function insertRewardConfig(params: API.UserManage.Member) {
  return request('/third_admin/checkin_reward_config/create', {
    method: 'POST',
    data: {
        ...params
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function insertUserTag(params: API.UserManage.Member) {
  return request('/third_admin/user_tags/create', {
    method: 'POST',
    data: {
        ...params
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function updateUserTag(params: API.UserManage.Member) {
  return request('/third_admin/user_tags/update', {
    method: 'POST',
    data: {
        ...params
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function deleteUserTag(params: API.UserManage.Member) {
  return request('/third_admin/user_tags/remove', {
    method: 'POST',
    data: {
        ...params
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function assignUserTag(params: API.UserManage.Member) {
  return request('/third_admin/user_tags/assign', {
    method: 'POST',
    data: {
        ...params
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function auditCheckIn(params: { id: string }) {
  return request('/third_admin/checkin_reward/update_status_apply', {
    method: 'POST',
    data: {
        ...params
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function auditReward(params: { id: string, status: number }) {
  return request('/third_admin/lottery_user_record/audit', {
    method: 'POST',
    data: {
        ...params
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
export async function deleteRewardConfig(params: API.UserManage.Member) {
  return request('/third_admin/checkin_reward_config/delete', {
    method: 'POST',
    data: {
        ...params
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

// 日常签到奖励配置相关接口
export async function getDailyRewardConfig(params?: API.UserManage.Member) {
  return request('/third_admin/daily_checkin_reward_config/detail', {
    method: 'GET',
    params: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function createOrUpdateDailyRewardConfig(params: API.UserManage.Member) {
  return request('/third_admin/daily_checkin_reward_config/create_or_update', {
    method: 'POST',
    data: {
        ...params
    },
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

export async function deleteDailyRewardConfig() {
  return request('/third_admin/daily_checkin_reward_config/delete', {
    method: 'POST',
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

// 获取签到规则说明（通过组织信息API获取）
export async function getCheckinRuleDescription(cacheBreaker = '') {
  return request<any>('/third_admin/organization/info', {
    method: 'get',
    params: cacheBreaker ? { _t: cacheBreaker } : {},  // 添加缓存破坏参数
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

// 绕过缓存获取签到规则说明（直接查询用户所属组织信息）
export async function getCheckinRuleDescriptionNoCache() {
  return request<any>('/third_admin/user/organization/info', {
    method: 'get',
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

// 更新签到规则说明
export async function updateCheckinRuleDescription(params: { checkin_rule_description: string }) {
  return request('/third_admin/organization/update_checkin_rule', {
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

// 管理员补签API (旧接口 - 按时间段补签)
export async function supplementCheckin(params: {
  im_server_user_id: string;
  start_date: string;
  end_date: string;
}) {
  return request('/third_admin/checkin/supplement', {
    method: 'POST',
    data: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

// 管理员多日期补签API (新接口 - 按多个日期补签)
export async function supplementMultipleDates(params: {
  im_server_user_id: string;
  dates: string[]; // 格式: ["2026-01-01T00:00:00+08:00", ...]
}) {
  return request('/third_admin/checkin/supplement_multiple', {
    method: 'POST',
    data: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

// 获取用户最近连续签到记录，用于修复
export async function getCheckinRecordsForFix(params: {
  im_server_user_id: string;
}) {
  return request('/third_admin/checkin/records-for-fix', {
    method: 'GET',
    params: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}

// 修复用户签到记录
export async function fixCheckinRecords(params: {
  im_server_user_id: string;
}) {
  return request('/third_admin/checkin/fix', {
    method: 'POST',
    data: params,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
    baseURL: CHAT_URL,
  });
}
