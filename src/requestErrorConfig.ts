import { CHAT_URL } from '@/config';
import { getErrCodeMessage } from '@/constants/errcode';
import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { message } from 'antd';
import { v4 } from 'uuid';
import { getStoredOrganizationId } from '@/utils/organization';

interface ResponseStructure {
  data: any;
  errDlt?: string;
  errCode?: number;
}

const clearAuthStorage = () => {
  localStorage.removeItem('IMAccountToken');
  localStorage.removeItem('IMAdminToken');
  localStorage.removeItem('IMAdminUserID');
  localStorage.removeItem('IMUserID');
  localStorage.removeItem('OrganizationID');
  localStorage.removeItem('walletExist');
  localStorage.removeItem('rsaPrivateKey');
  localStorage.removeItem('AES_KEY');
};

export const errorConfig: RequestConfig = {
  errorConfig: {
    errorThrower: (res) => {
      const { data, errCode, errDlt } = res as unknown as ResponseStructure;
      if (data?.errCode !== 0) {
        const error: any = new Error(errDlt);
        error.info = { errCode, errDlt, data };
        throw error;
      }
    },
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;
      return console.log(error);
    },
  },

  requestInterceptors: [
    (url: string, config: RequestOptions) => {
      let requestUrl = url;
      const baseURL = config.baseURL;

      if (baseURL && requestUrl.startsWith('/')) {
        requestUrl = `${baseURL}${requestUrl}`;
      } else if (requestUrl.startsWith('/third_admin') || requestUrl.startsWith('/third')) {
        requestUrl = `${CHAT_URL}${requestUrl}`;
      }

      const organizationId = getStoredOrganizationId();
      const authHeader: any = {
        ...config.headers,
        token:
          localStorage.getItem(config.headers?.isAccount ? 'IMAccountToken' : 'IMAdminToken') ?? '',
        operationID: v4(),
      };
      delete authHeader.orgid;
      delete authHeader.orgId;
      delete authHeader.organizationId;
      delete authHeader.OrganizationID;

      if (organizationId) {
        // 确保使用正确的请求头名称（全小写）
        authHeader.orgid = organizationId;
        console.log('[Request Interceptor - Setting Headers]', {
          url: requestUrl,
          orgid: organizationId,
          allHeaders: authHeader,
        });
      } else {
        console.warn('[Request Interceptor - WARNING] Invalid or missing OrganizationID', {
          url: requestUrl,
          organizationId,
          isValid: false,
        });
      }

      config.headers = authHeader;
      return { url: requestUrl, options: { ...config } };
    },
  ],

  responseInterceptors: [
    (response) => {
      const { data, headers } = response as any;

      if (headers?.['content-type']?.startsWith('application/octet-stream')) {
        return response;
      }

      const tokenErrCode = [1501, 1502, 1503, 1504, 1505, 1506, 1507, 20101];

      if (data?.errCode === 20101) {
        message.error('Please log in again');
      }

      if (data?.errDlt && (data.errDlt.includes('token') || data.errDlt.includes('Token'))) {
        clearAuthStorage();
        history.push('/login');
        return Promise.reject(data.errDlt || data.errMsg || 'Token error');
      }

      if (tokenErrCode.includes(data?.errCode)) {
        clearAuthStorage();
        history.push('/login');
        return Promise.reject(data.errDlt || data.errMsg || 'Login expired');
      }

      if (data?.errCode === 12002) {
        message.error('Name already exists');
        return Promise.reject(data.errDlt || data.errMsg || 'Name already exists');
      }

      if (data?.errCode === 10301) {
        message.error('Import user count exceeds the limit');
        return Promise.reject(data.errDlt || data.errMsg || 'Import user count exceeds the limit');
      }

      if (data?.errCode !== 0 && data?.errCode !== undefined) {
        const errMsg = getErrCodeMessage(data.errCode);
        if (errMsg) {
          message.error(errMsg);
        } else if (data.errDlt) {
          message.error(data.errDlt);
        } else if (data.errMsg) {
          message.error(data.errMsg);
        } else {
          message.error('Operation failed');
        }
        return Promise.reject(data.errDlt || data.errMsg || 'Operation failed');
      }

      if (data?.code !== undefined && data?.code !== 0) {
        message.error(data.msg || 'Operation failed');
        return Promise.reject(data.msg || 'Operation failed');
      }

      return response;
    },
  ],
};
