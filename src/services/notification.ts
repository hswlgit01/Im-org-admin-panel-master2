import { API_URL, CHAT_URL } from '@/config';
import { request } from '@umijs/max';
import { v4 as uuidv4 } from 'uuid';

export async function getNotificationAccounts(
  params: API.NotificationManage.QueryNotificationAccountParams,
) {
  return request<{ data: API.NotificationManage.QueryNotificationAccountResult }>(
    '/user/search_notification_account',
    {
      method: 'POST',
      data: {
        ...params,
      },
      baseURL: API_URL,
    },
  );
}
export async function selectNotificationAccountsList(params: any) {
  return request<{ data: API.NotificationManage.QueryNotificationAccountResult }>(
    '/third_admin/notification_account/search',
    {
      method: 'POST',
      data: {
        ...params,
      },
      headers: {
        operationID: uuidv4(),
        isAccount: true,
      },
      baseURL: CHAT_URL,
    },
  );
}
export async function insertNotificationAccount(params: any) {
  return request<{ data: API.NotificationManage.QueryNotificationAccountResult }>(
    '/third_admin/notification_account/create',
    {
      method: 'POST',
      data: {
        ...params,
      },
      headers: {
        operationID: uuidv4(),
        isAccount: true,
      },
      baseURL: CHAT_URL,
    },
  );
}
export async function updateNotificationAccount(params: any) {
  return request<{ data: API.NotificationManage.QueryNotificationAccountResult }>(
    '/third_admin/notification_account/update',
    {
      method: 'POST',
      data: {
        ...params,
      },
      headers: {
        operationID: uuidv4(),
        isAccount: true,
      },
      baseURL: CHAT_URL,
    },
  );
}

export async function addNotificationAccount(
  userID: string,
  nickName: string,
  faceURL: string,
  appMangerLevel: number,
) {
  return request('/user/add_notification_account', {
    method: 'POST',
    data: {
      userID,
      nickName,
      faceURL,
      appMangerLevel,
    },
    baseURL: API_URL,
  });
}


export async function batchSendNotification(params: API.ChatLog.BatchSendParams) {
  return request('/third_admin/notification_account/batch_send', {
    method: 'POST',
    data: {
     ...params
    },
    baseURL: CHAT_URL,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
  });
}

export async function selectArticleList(
  params: API.NotificationManage.UpdateNotificationAccountParams,
) {
  return request('/third_admin/article/list', {
    method: 'POST',
    data: {
      ...params,
    },
    baseURL: CHAT_URL,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
  });
}

export async function insertArticle(
  params: API.NotificationManage.UpdateNotificationAccountParams,
) {
  return request('/third_admin/article/create', {
    method: 'POST',
    data: {
      ...params,
    },
    baseURL: CHAT_URL,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
  });
}

export async function updateArticle(
  params: API.NotificationManage.UpdateNotificationAccountParams,
) {
  return request('/third_admin/article/update', {
    method: 'POST',
    data: {
      ...params,
    },
    baseURL: CHAT_URL,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
  });
}

export async function selectArticleDetail(id: string ) {
  return request(`/third_admin/article/detail/${id}`, {
    method: 'GET',
    baseURL: CHAT_URL,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
  });
}

export async function selectPublicArticleDetail(id: string ) {
  return request(`/third/article/detail/${id}`, {
    method: 'GET',
    baseURL: CHAT_URL,
    headers: {
      operationID: uuidv4(),
      isAccount: true,
    },
  });
}


