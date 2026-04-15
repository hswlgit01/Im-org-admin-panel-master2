// export const WS_URL = 'wss://web.rentsoft.cn/msg_gateway_enterprise';
// export const API_URL = 'https://web.rentsoft.cn/api_enterprise';
// export const CHAT_URL = 'https://web.rentsoft.cn/chat_enterprise';
// export const ACCOUNT_URL = 'https://web.rentsoft.cn/complete_admin_enterprise';

const isProd = process.env.NODE_ENV === 'production'||process.env.NODE_ENV === 'prod';
// const isProd = false;
const isIpAddress = (url: string) => /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url);

const  prodUrl  ='iuapjo.cn';
// const prodUrl = '137778.cn';
// const prodUrl = 'test1.com';

// 添加去除端口号的函数
const removePort = (url: string) => {
  const urlObj = new URL(url);
  return `${urlObj.protocol}//${urlObj.hostname}`;
};

console.log('Is Production:', isProd);
console.log('Window Location Origin:', window.location.origin);
console.log('Is IP Address:', isIpAddress(window.location.origin));

const getBaseUrl = () => {
  const originWithoutPort = removePort(window.location.origin);
  // if (!isProd) return 'http://127.0.0.1';
  if (!isProd) return 'https://admin.' + prodUrl; // prod
  return originWithoutPort;
};

const baseUrl = getBaseUrl();
console.log('Final Base URL:', baseUrl);

export const WS_URL = isProd
  ? (isIpAddress(removePort(window.location.origin))
    ? `ws://${window.location.hostname}:10001`
    : `wss://ws.${window.location.hostname}`)
  // : 'ws://127.0.0.1:10001';
  : 'wss://ws.'+ prodUrl; // prod

export const API_URL =
  isProd && isIpAddress(removePort(window.location.origin))
    ? `${baseUrl}:10002`
    // : `http://127.0.0.1:10002`;
    : `${baseUrl}/api`; // prod

export const CHAT_URL =
  isProd && isIpAddress(removePort(window.location.origin))
    ? `${baseUrl}:10008`
    // : `http://127.0.0.1:10008`;
    : `${baseUrl}`;

export const ACCOUNT_URL = isProd && isIpAddress(removePort(window.location.origin))
  ? `${baseUrl}:10009`
  // : `http://127.0.0.1:10009`;
  : `${baseUrl}/complete_admin`; // prod
