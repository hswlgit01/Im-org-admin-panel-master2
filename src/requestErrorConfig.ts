import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { message } from 'antd';
import { v4 } from 'uuid';
import { getErrCodeMessage } from '@/constants/errcode';

interface ResponseStructure {
  data: any;
  errDlt?: string;
  errCode?: number;
}

/**
 * @name 错误处理
 * pro 自带的错误处理， 可以在这里做自己的改动
 * @doc https://umijs.org/docs/max/request#配置
 */
export const errorConfig: RequestConfig = {
  errorConfig: {
    // 错误抛出
    errorThrower: (res) => {
      const { data, errCode, errDlt } = res as unknown as ResponseStructure;
      if (data?.errCode !== 0) {
        const error: any = new Error(errDlt);
        error.info = { errCode, errDlt, data };
        throw error;
      }
    },
    // 错误接收及处理
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;
      return console.log(error);
    },
  },

  // 请求拦截器
  requestInterceptors: [
    (config: RequestOptions) => {
      const authHeader = {
        ...config.headers,
        orgId: localStorage.getItem('OrganizationID'),
        token:
          localStorage.getItem(config.headers?.isAccount ? 'IMAccountToken' : 'IMAdminToken') ?? '',
        operationID: v4(),
      };
      config.headers = authHeader;
      return { ...config };
    },
  ],

  // 响应拦截器
  responseInterceptors: [
    (response) => {
      const { data, headers, config } = response as unknown as ResponseStructure & { config: any };

      // 添加详细日志

      if (headers['content-type'] === "application/octet-stream") {
        return response;
      }

      const tokenErrCode = [1501, 1502, 1503, 1504, 1505, 1506, 1507, 20101];


      if (data?.errCode === 20101) {
        message.error('您的账户已在其他设备登录，请重新登录');
      }

      // 检查是否存在token相关错误
      if (data?.errDlt && (data.errDlt.includes('token') || data.errDlt.includes('Token'))) {
        localStorage.removeItem('IMAccountToken');
        localStorage.removeItem('IMAdminToken');
        history.push('/login');
        return Promise.reject(data.errDlt || data.errMsg || '未知Token错误');
      }

      if (tokenErrCode.includes(data?.errCode)) {
        localStorage.removeItem('IMAccountToken');
        localStorage.removeItem('IMAdminToken');
        history.push('/login');
        return Promise.reject(data.errDlt || data.errMsg || '登录已过期');
      }

      if (data?.errCode === 12002) {
        message.error('抽奖活动名称已存在');
        return Promise.reject(data.errDlt || data.errMsg || '抽奖活动名称已存在');
      }

      if (data?.errCode === 10301) {
        message.error('批量导入用户数量超过了限制，最多1000个用户');
        return Promise.reject(data.errDlt || data.errMsg || '批量导入用户数量超过了限制');
      }

      // 处理错误码不为0的情况
      if (data?.errCode !== 0 && data?.errCode !== undefined) {
        const errMsg = getErrCodeMessage(data.errCode);
        if (errMsg) {
          message.error(errMsg);
        } else if (data.errDlt) {
          message.error(data.errDlt);
        } else if (data.errMsg) {
          message.error(data.errMsg);
        } else {
          message.error('操作失败，请稍后重试');
        }
        return Promise.reject(data.errDlt || data.errMsg || '操作失败');
      }

      // 处理使用旧格式响应的情况 (code/msg)
      if (data?.code !== undefined && data?.code !== 0) {
        message.error(data.msg || '操作失败，请稍后重试');
        return Promise.reject(data.msg || '操作失败');
      }

      return response;
    },
  ],
};
