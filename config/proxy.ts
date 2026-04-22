/**
 * @name 代理的配置
 * @see 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */
export default {
  // 本地开发环境代理配置
  dev: {
    // API 服务代理 (端口 10002)
    '/api/': {
      target: 'http://localhost:10002',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    },

    // Chat/管理后台服务代理 (端口 10009)
    '/third_admin/': {
      target: 'http://localhost:10009',
      changeOrigin: true,
    },

    // Account 服务代理 (端口 10009)
    '/complete_admin/': {
      target: 'http://localhost:10009',
      changeOrigin: true,
    },

    // Auth 服务代理 (端口 10002)
    '/auth/': {
      target: 'http://localhost:10002',
      changeOrigin: true,
    },

    // User 服务代理 (端口 10002)
    '/user/': {
      target: 'http://localhost:10002',
      changeOrigin: true,
    },

    // Organization 服务代理 (端口 10002)
    '/organization/': {
      target: 'http://localhost:10002',
      changeOrigin: true,
    },
  },

  /**
   * @name 详细的代理配置
   * @doc https://github.com/chimurai/http-proxy-middleware
   */
  test: {
    // localhost:8000/api/** -> https://preview.pro.ant.design/api/**
    '/api/': {
      target: 'https://proapi.azurewebsites.net',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
  pre: {
    '/api/': {
      target: 'your pre url',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
};
