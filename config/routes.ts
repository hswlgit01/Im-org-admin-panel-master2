import ArticleDetail from '@/pages/im/notification/ArticleList/components/ArticleDetail';

/**
 * @name umi 的路由配置
 * @description 只支持 path,component,routes,redirect,wrappers,name,icon 的配置
 * @param path  path 只支持两种占位符配置，第一种是动态参数 :id 的形式，第二种是 * 通配符，通配符只能出现路由字符串的最后。
 * @param component 配置 location 和 path 匹配后用于渲染的 React 组件路径。可以是绝对路径，也可以是相对路径，如果是相对路径，会从 src/pages 开始找起。
 * @param routes 配置子路由，通常在需要为多个路径增加 layout 组件时使用。
 * @param redirect 配置路由跳转
 * @param wrappers 配置路由组件的包装组件，通过包装组件可以为当前的路由组件组合进更多的功能。 比如，可以用于路由级别的权限校验
 * @param name 配置路由的标题，默认读取国际化文件 menu.ts 中 menu.xxxx 的值，如配置 name 为 login，则读取 menu.ts 中 menu.login 的取值作为标题
 * @param icon 配置路由的图标，取值参考 https://ant.design/components/icon-cn， 注意去除风格后缀和大小写，如想要配置图标为 <StepBackwardOutlined /> 则取值应为 stepBackward 或 StepBackward，如想要配置图标为 <UserOutlined /> 则取值应为 user 或者 User
 * @doc https://umijs.org/docs/guides/routes
 */
export default [
  {
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/login',
        component: './Login',
      },
      {
        component: './404',
      },
    ],
  },
  // {
  //   path: '/dashboard',
  //   name: 'Dashboard',
  //   icon: 'LineChartOutlined',
  //   component: './Dashboard',
  // },
  {
    path: '/organization',
    name: 'organization',
    icon: 'team',
    routes: [
      {
        path: '/organization',
        redirect: '/organization/info',
      },
      {
        path: '/organization/info',
        name: 'org-info',
        component: './Organization',
      },
      {
        path: '/organization/statistics',
        name: 'org-statistics',
        component: './Organization/SalesDailyStatistics',
      },
      {
        path: '/organization/platform-statistics',
        name: 'org-platform-statistics',
        component: './im/checkIn/PlatformCumulativeData',
      },
      {
        path: '/organization/withdrawal-config',
        name: 'withdrawal-config',
        component: './Organization/WithdrawalConfig',
      },
    ],
  },
  {
    path: '/account',
    name: 'account',
    icon: 'Wallet',
    component: './Account',
  },
  // {
  //   path: '/webhook',
  //   name: 'webhook',
  //   icon: 'ConsoleSqlOutlined',
  //   component: './Webhook',
  // },
  {
    path: '/im',
    name: 'IM',
    icon: 'MessageOutlined',
    routes: [
      // 补偿金管理相关功能
      {
        path: '/im/wallet',
        name: 'Wallet',
        routes: [
          {
            path: '/im/wallet',
            redirect: '/im/wallet/compensation-settings',
          },
          {
            name: 'CompensationSettings',
            path: '/im/wallet/compensation-settings',
            component: './im/wallet/CompensationSettings',
          },
          // 用户补偿金余额管理功能已移除
          // {
          //   name: 'UserCompensation',
          //   path: '/im/wallet/user-compensation',
          //   component: './im/wallet/UserCompensation',
          // },
        ],
      },
      {
        path: '/im/user',
        name: 'User',
        routes: [
          {
            path: '/im/user',
            redirect: '/im/user/user_list',
          },
          {
            name: 'UserList',
            path: '/im/user/user_list',
            component: './im/user/UserList',
          },
          {
            name: 'RoleList',
            path: '/im/user/role_list',
            component: './im/user/RoleList',
          },
          {
            name: 'BlockList',
            path: '/im/user/block_list',
            component: './im/user/BlockList',
          },
          {
            name: 'RelationList',
            path: '/im/user/relation_list',
            component: './im/user/RelationList',
            hideInMenu: true,
          },
          {
            name: 'UserTags',
            path: '/im/user/userTags_list',
            component: './im/user/UserTags',
          },
          {
            name: 'Hierarchy',
            path: '/im/user/hierarchy',
            component: './im/user/Hierarchy',
          },
        ],
      },
      {
        path: '/im/register',
        name: 'Register',
        routes: [
          {
            path: '/im/register',
            redirect: '/im/register/default_friends',
          },
          {
            name: 'DefaultFriends',
            path: '/im/register/default_friends',
            component: './chat/register/DefaultFriends',
          },
          {
            name: 'DefaultGroup',
            path: '/im/register/default_group',
            component: './chat/register/DefaultGroup',
          },
          {
            name: 'IPBlock',
            path: '/im/register/ip_block',
            component: './chat/register/IPBlock',
          },
        ],
      },
      {
        path: '/im/transaction',
        name: 'Transaction',
        routes: [
          {
            path: '/im/transaction',
            redirect: '/im/transaction/transactionRecords_list',
          },
          {
            name: 'TransactionRecords',
            path: '/im/transaction/transactionRecords_list',
            component: './im/transaction/TransactionRecords',
          },
          {
            name: 'ReceiveList',
            path: '/im/transaction/receiveList_list',
            component: './im/transaction/ReceiveList',
          },
          {
            name: 'RedPacketConfig',
            path: '/im/transaction/redPacketConfig',
            component: './im/transaction/RedPacketConfig',
          },
        ],
      },

      {
        path: '/im/reward',
        name: 'Reward',
        routes: [
          {
            path: '/im/reward',
            redirect: '/im/reward/lotteryList_list',
          },
          {
            name: 'LotteryList',
            path: '/im/reward/lotteryList_list',
            component: './im/checkIn/LotteryList',
          },
          {
            name: 'CouponList',
            path: '/im/reward/couponList_list',
            component: './im/checkIn/CouponList',
          },
        ],
      },
      {
        path: '/im/checkIn',
        name: 'CheckIn',
        routes: [
          {
            path: '/im/checkIn',
            redirect: '/im/checkIn/checkIn_list',
          },
          {
            name: 'CheckInList',
            path: '/im/checkIn/checkIn_list',
            component: './im/checkIn/CheckInList',
          },
          {
            name: 'RewardConfigList',
            path: '/im/checkIn/rewardConfigList_list',
            component: './im/checkIn/RewardConfigList',
          },
          {
            name: 'DailyRewardConfig',
            path: '/im/checkIn/dailyRewardConfig',
            component: './im/checkIn/DailyRewardConfig',
          },
          {
            name: 'CheckinRule',
            path: '/im/checkIn/checkinRule',
            component: './im/checkIn/CheckinRule',
          },
          {
            name: 'UserPoints',
            path: '/im/checkIn/userPoints_list',
            component: './im/checkIn/UserPoints',
          },
        ],
      },
      {
        path: '/im/audit',
        name: 'Audit',
        routes: [
          {
            path: '/im/audit',
            redirect: '/im/audit/checkIn_standard_audit_list',
          },
          {
            name: 'CheckInStandardAuditList',
            path: '/im/audit/checkIn_standard_audit_list',
            component: './im/audit/CheckInStandardAuditList',
          },
          {
            name: 'RewardDistributionAuditList',
            path: '/im/audit/reward_distribution_audit_list',
            component: './im/audit/RewardDistributionAuditList',
          },
          {
            name: 'IdentityVerificationPending',
            path: '/im/audit/identity_verification_pending',
            component: './im/audit/IdentityVerificationPending',
          },
          {
            name: 'IdentityVerificationHistory',
            path: '/im/audit/identity_verification_history',
            component: './im/audit/IdentityVerificationHistory',
          },
          {
            name: 'WithdrawalAudit',
            path: '/im/audit/withdrawal_audit',
            component: './im/audit/WithdrawalAudit',
          },
        ],
      },
      {
        path: '/im/group',
        name: 'Group',
        routes: [
          {
            path: '/im/group',
            redirect: '/im/group/group_list',
          },
          {
            name: 'GroupList',
            path: '/im/group/group_list',
            component: './im/group/GroupList',
          },
          {
            name: 'GroupMember',
            path: '/im/group/group_member',
            component: './im/group/GroupMember',
            hideInMenu: true,
          },
          {
            name: 'GroupLog',
            path: '/im/group/group_log',
            component: './im/group/GroupLog',
            hideInMenu: true,
          },
        ],
      },
      // {
      //   path: '/im/message',
      //   name: 'Message',
      //   routes: [
      //     {
      //       path: '/im/message',
      //       redirect: '/im/message/user_message',
      //     },
      //     // {
      //     //   name: 'UserMassage',
      //     //   path: '/im/message/user_message',
      //     //   component: './im/message/UserMessage',
      //     // },
      //     {
      //       name: 'GroupMessage',
      //       path: '/im/message/group_message',
      //       component: './im/message/GroupMessage',
      //     },
      //   ],
      // },
      {
        path: '/im/log',
        name: 'Log',
        routes: [
          {
            path: '/im/log',
            redirect: '/im/log/log_list',
          },
          {
            name: 'LogList',
            path: '/im/log/log_list',
            component: './im/log/LogList',
          },
        ],
      },
      {
        path: '/im/notification',
        name: 'Notification',
        routes: [
          {
            path: '/im/notification',
            redirect: '/im/notification/account_list',
          },
          {
            name: 'AccountList',
            path: '/im/notification/account_list',
            component: './im/notification/AccountList',
          },
          {
            name: 'Publish',
            path: '/im/notification/publish',
            component: './im/notification/Publish',
          },
          {
            name: 'ArticleList',
            path: '/im/notification/article_list',
            component: './im/notification/ArticleList',
          },
          {
            name: 'ArticleDetail',
            path: '/im/notification/article_list/article_detail',
            component: './im/notification/ArticleList/components/ArticleDetail',
            hideInMenu: true,
          },
        ],
      },
    ],
  },
  {
    path: '/profile',
    name: 'Profile',
    icon: 'Setting',
    routes: [
      {
        path: '/profile',
        redirect: '/profile/info',
      },
      {
        name: 'Info',
        path: '/profile/info',
        component: './profile/Info',
      },
      {
        name: 'Modify',
        path: '/profile/modify',
        component: './profile/Modify',
      },
      {
        name: 'PayPwd',
        path: '/profile/pay_pwd',
        component: './profile/PayPwd',
      },
    ],
  },
  {
    path: '/',
    redirect: '/organization/info',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
];
