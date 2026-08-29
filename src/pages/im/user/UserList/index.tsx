import OIMAvatar from '@/components/OIMAvatar';
import { CheckCircleFilled } from '@ant-design/icons';
// dawn 2026-04-27 删 updateUserAuth：UserList 的"非好友发送消息"开关已移除，
// 这个 service 在本页不再被调用，留着会触发 ESLint no-unused-vars。
import {
  downloadTemplate,
  postOrgUserWalletSnapshot,
  selectMemberList,
  getOrgUserOperationTimes,
  updateUserRole,
  uploadTemplate,
} from '@/services/account';
import { assignUserTag, selectUserTagsList } from '@/services/checkin';
import {
  updateBlock,
  getIdentityVerificationDetail,
  cancelIdentityVerification,
  updateOrgUserNickname,
  resetUserPassword,
  adjustUserBalance,
} from '@/services/user';
import { formatUTCTimeToBeijing, getResourceUrl } from '@/utils/common';
import type { ActionType, FormInstance, ProColumns } from '@ant-design/pro-components';
import { ModalForm, PageContainer, ProFormCheckbox, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
// dawn 2026-04-27 删 Switch：用户列表 can_send_free_msg 开关已移除，本页不再使用 Switch
import { Alert, Button, Form, message, Popconfirm, Select, Space, Tag, Upload, Input, Modal, Tooltip } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import ForcedOfflineDrawer from './ForcedOfflineDrawer';
import ErrorDataModal from './components/ErrorDataModal';

const { Option } = Select;

const USER_LIST_EXPORT_MSG_KEY = 'user-list-export-excel';
const USER_LIST_EXPORT_PAGE_SIZE = 500;
const USER_LIST_EXPORT_MAX_PAGES = 500;

export type DrawerOptions = {
  visible: boolean;
  selectUser: API.UserManage.User | undefined;
};

const WEB_ADJUSTABLE_ROLES = ['Normal', 'GroupManager', 'TermManager'];

/** 用户列表与导出请求的角色过滤（须包含 TermManager，否则团队长不会出现在列表中） */
const USER_LIST_QUERY_ROLES = ['GroupManager', 'TermManager', 'Normal'];

/** 组织用户 role 字段展示文案（与接口 role 一致） */
const ORG_USER_ROLE_LABELS: Record<string, string> = {
  Normal: '普通用户',
  GroupManager: '管理员',
  TermManager: '团队长',
  SuperAdmin: '超级管理员',
  BackendAdmin: '后台管理员',
};

// dawn 2026-06-16 新增角色认证标识：后台用户列表中管理员/团队长昵称旁展示蓝色认证图标。
const USER_ROLE_BADGE_ROLES = ['GroupManager', 'TermManager', 'SuperAdmin', 'BackendAdmin'];

const UserList = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const uploadRef = useRef<boolean>(false);
  const formRef = useRef<FormInstance>();
  const [drawerOptions, setDrawerOptions] = useState<DrawerOptions>({
    visible: false,
    selectUser: undefined,
  });

  const [tagList, setTagList] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [exportExcelLoading, setExportExcelLoading] = useState(false);
  const exportExcelBusyRef = useRef(false);
  const [userInfoType, setUserInfoType] = useState('account');
  const [errorDataModalProps, setErrorDataModalProps] = useState({
    visible: false,
    errorData: [],
  });

  const [identityDetailVisible, setIdentityDetailVisible] = useState(false);
  const [currentIdentityDetail, setCurrentIdentityDetail] =
    useState<API.UserManage.IdentityVerification | null>(null);
  const [nicknameModal, setNicknameModal] = useState<{
    open: boolean;
    userId?: string;
    nickname?: string;
  }>({ open: false });
  const [nicknameForm] = Form.useForm<{ nickname: string }>();
  const [nicknameUpdateLoading, setNicknameUpdateLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRowsMap, setSelectedRowsMap] = useState<Map<string, any>>(() => new Map());

  const [roleModal, setRoleModal] = useState<{
    open: boolean;
    userId?: string;
    currentRole?: string;
  }>({ open: false });
  const [targetRole, setTargetRole] = useState<string>('TermManager');

  const openRoleAdjustModal = useCallback((record: any) => {
    const c = record.role || 'Normal';
    if (!WEB_ADJUSTABLE_ROLES.includes(c)) return;
    setRoleModal({ open: true, userId: record.user_id, currentRole: c });
    if (c === 'Normal') setTargetRole('TermManager');
    else if (c === 'TermManager') setTargetRole('GroupManager');
    else if (c === 'GroupManager') setTargetRole('TermManager');
    else setTargetRole('Normal');
  }, []);

  const getRoleAdjustOptions = (current?: string) => {
    if (!current || current === 'Normal') {
      return [
        { value: 'Normal', label: '普通用户' },
        { value: 'TermManager', label: '升级为团队长' },
        { value: 'GroupManager', label: '升级为管理员' },
      ];
    }
    if (current === 'TermManager') {
      return [
        { value: 'Normal', label: '普通用户' },
        { value: 'GroupManager', label: '升级为管理员' },
      ];
    }
    if (current === 'GroupManager') {
      return [
        { value: 'Normal', label: '普通用户' },
        { value: 'TermManager', label: '设为团队长' },
      ];
    }
    return [];
  };

  const submitRoleAdjust = useCallback(async () => {
    if (!roleModal.userId) return;
    if (targetRole === roleModal.currentRole) {
      message.info('角色未变更');
      setRoleModal({ open: false });
      return;
    }
    await updateUserRole({ user_id: roleModal.userId, role: targetRole });
    message.success('操作成功');
    setRoleModal({ open: false });
    actionRef.current?.reload();
  }, [roleModal.userId, roleModal.currentRole, targetRole]);

  useEffect(() => {
    selectUserTagsList({
      page: 1,
      pageSize: 1000,
    }).then((res) => {
      const tmp = res.data.data || [];

      setTagList(
        tmp.map((v) => {
          return {
            ...v,
            label: v.tag_name,
            value: v.id,
          };
        }),
      );
    });
  }, []);



  const viewIdentityDetail = async (userID: string) => {
    try {
      const { data } = await getIdentityVerificationDetail(userID);
      if (data && data.list && data.list.length > 0) {
        setCurrentIdentityDetail(data.list[0]);
        setIdentityDetailVisible(true);
      } else {
        message.warning('未找到该用户的实名认证信息');
      }
    } catch (error) {
      message.error('获取实名认证信息失败');
    }
  };

  const handleCancelVerification = async (userID: string) => {
    try {
      await cancelIdentityVerification({ userID });
      message.success('已取消实名认证');
      setIdentityDetailVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      message.error('取消实名认证失败');
    }
  };

  // ---- 后台手动调节余额 ----
  const [adjustForm] = Form.useForm();
  const [adjustModal, setAdjustModal] = useState<{
    open: boolean;
    record?: any;
    balances?: any[];
    // 幂等键：每次打开弹窗生成一个，提交失败重试时沿用同一个。
    // 这是防重复加钱的关键 —— 若每次点提交都换新 key，网络超时重试就会重复入账。
    requestId?: string;
  }>({ open: false });
  const [adjustLoading, setAdjustLoading] = useState(false);

  const openAdjustModal = useCallback(
    (record: any) => {
      const balances =
        (record.wallet_balances?.length ? record.wallet_balances : null) ??
        (record.wallet?.balances?.length ? record.wallet.balances : null) ??
        (record.balances?.length ? record.balances : null) ??
        [];
      if (!balances.length) {
        message.warning('该用户暂无钱包余额数据，无法调节');
        return;
      }
      adjustForm.resetFields();
      adjustForm.setFieldsValue({
        currencyId: balances[0].currency_id ?? balances[0].currencyId,
      });
      setAdjustModal({
        open: true,
        record,
        balances,
        requestId:
          typeof crypto !== 'undefined' && (crypto as any).randomUUID
            ? (crypto as any).randomUUID()
            : `adj-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      });
    },
    [adjustForm],
  );

  const submitAdjustBalance = useCallback(async () => {
    const values = await adjustForm.validateFields();
    if (!adjustModal.record || !adjustModal.requestId) return;

    setAdjustLoading(true);
    try {
      await adjustUserBalance({
        targetUserId: adjustModal.record.user_id,
        currencyId: values.currencyId,
        // 金额以字符串传递，避免 JSON 序列化把 100.10 变成 100.09999999999999
        amount: String(values.amount).trim(),
        reason: values.reason.trim(),
        requestId: adjustModal.requestId,
      });
      message.success('调整成功');
      setAdjustModal({ open: false });
      adjustForm.resetFields();
      actionRef.current?.reload();
    } catch (e: any) {
      // 刻意不重置 requestId：用户重试时沿用同一个幂等键，
      // 即使上一次其实已在服务端成功（只是响应超时），也不会重复入账。
      message.error(e?.message || '调整失败');
    } finally {
      setAdjustLoading(false);
    }
  }, [adjustForm, adjustModal]);

  const openNicknameModal = useCallback((record: any) => {
    setNicknameModal({
      open: true,
      userId: record.user_id,
      nickname: record.user?.nickname || '',
    });
    nicknameForm.setFieldsValue({
      nickname: record.user?.nickname || '',
    });
  }, [nicknameForm]);

  const submitNicknameUpdate = useCallback(async () => {
    const values = await nicknameForm.validateFields();
    if (!nicknameModal.userId) return;
    setNicknameUpdateLoading(true);
    try {
      await updateOrgUserNickname({
        userID: nicknameModal.userId,
        nickname: values.nickname,
      });
      message.success('修改成功');
      setNicknameModal({ open: false });
      nicknameForm.resetFields();
      actionRef.current?.reload();
    } finally {
      setNicknameUpdateLoading(false);
    }
  }, [nicknameForm, nicknameModal.userId]);

  const ModifyModel = (modalProps) => {
    const { initData, tags } = modalProps;
    const [form] = Form.useForm();
    return (
      <ModalForm
        title="设置标签"
        trigger={
          <Button
            type="link"
            onClick={() => {
              if (initData && initData.tags) {
                form.setFieldValue(
                  'tag_ids',
                  initData.tags.map((v) => v.id),
                );
              }
            }}
          >
            设置标签
          </Button>
        }
        form={form}
        autoFocusFirstInput
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            form.resetFields();
          },
        }}
        submitTimeout={2000}
        onFinish={async (values) => {
          await assignUserTag({
            im_user_server_id: initData.im_server_user_id,
            tag_ids: values.tag_ids,
          });
          message.success('提交成功');
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormCheckbox.Group name="tag_ids" label="用户标签" options={tags} />
      </ModalForm>
    );
  };

  const selectBefore = (
    <Select defaultValue="account" onChange={(value) => setUserInfoType(value)}>
      <Option value="nickname">昵称</Option>
      <Option value="account">账号</Option>
    </Select>
);
  const columns: ProColumns<API.UserManage.User>[] = useMemo(
    () => [
      {
        key: 'index',
        dataIndex: 'index',
        valueType: 'indexBorder',
        width: 40,
        fixed: 'left',
      },
      {
        title: intl.formatMessage({ id: 'user.faceURL' }),
        dataIndex: 'face_url',
        key: 'face_url',
        hideInSearch: true,
        align: 'center',
        width: 72,
        fixed: 'left',
        render: (_, record) => (
          <OIMAvatar size={28} src={record.user.face_url} text={record.nickname} />
        ),
      },
      {
        title: '所属角色',
        key: 'role',
        dataIndex: 'role',
        valueType: 'select',
        fieldProps: {
          allowClear: true,
          placeholder: '全部',
        },
        valueEnum: {
          GroupManager: { text: '管理员' },
          TermManager: { text: '团队长' },
          Normal: { text: '普通用户' },
        },
        align: 'center',
        width: 100,
        fixed: 'left',
        render: (_, record) => {
          const code = String((record as { role?: string }).role ?? '').trim();
          const text = ORG_USER_ROLE_LABELS[code] ?? (code !== '' ? code : '-');
          const color =
            code === 'SuperAdmin'
              ? 'red'
              : code === 'BackendAdmin'
                ? 'purple'
                : code === 'GroupManager'
                  ? 'blue'
                  : code === 'TermManager'
                    ? 'cyan'
                    : code === 'Normal'
                      ? 'default'
                      : 'default';
          return <Tag color={color}>{text}</Tag>;
        },
      },
      {
        title: intl.formatMessage({ id: 'user.nickname' }),
        key: 'nickname',
        dataIndex: 'nickname',
        width: 230,
        fixed: 'left',
        align: 'center',
        formItemProps: {
          label: '用户信息',
        },
        render: (_, record) => {
          const role = String((record as { role?: string }).role ?? '').trim();
          const nickname = record.nickname || (record as any).user?.nickname || '-';
          const badgeTitle = ORG_USER_ROLE_LABELS[role] ?? '管理员/团队长';
          return (
            <Space size={4}>
              <span>{nickname}</span>
              {USER_ROLE_BADGE_ROLES.includes(role) && (
                <Tooltip title={badgeTitle}>
                  <CheckCircleFilled style={{ color: '#1890ff', fontSize: 14 }} />
                </Tooltip>
              )}
            </Space>
          );
        },
        renderFormItem: () => {
          return (
            <Input
                allowClear
                addonBefore={selectBefore}
              />
          );
        },
      },
      {
        title: '用户标签',
        key: 'tags',
        dataIndex: 'tags',
        width: 200,
        align: 'center',
        render: (_, record) => {
          if (record.tags) {
            return (
              <Space size="small" wrap>
                {record.tags.map((v) => (
                  <Tag color="blue">{v.tag_name}</Tag>
                ))}
              </Space>
            );
          }
          return '-';
        },
        renderFormItem: () => {
          return (
            <Select
              mode="multiple"
              options={tagList}
              allowClear
              showSearch
              onChange={(values) => {
                formRef.current?.setFieldValue('tag_ids', values);
              }}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          );
        },
      },
      {
        title: intl.formatMessage({ id: 'pages.login.account' }),
        key: 'account',
        dataIndex: 'account',
        hideInSearch: true,
        align: 'center',
        width: 180,
        render: (_, record) => {
          const row = record as API.UserManage.User & {
            attribute?: { account?: string };
          };
          return row.attribute?.account ?? row.account ?? '-';
        },
      },
      // dawn 2026-04-27 删除用户列表里"非好友发送消息"的开关：
      // 这个权限本质属于角色权限（free_private_chat），已经在「角色列表」里管理，
      // 后端 roleCanSendFreeMsg() 会按角色刷新 user.can_send_free_msg。用户列表
      // 再保留一个个人级开关会让两套权限来源互相覆盖，按用户要求改成只走角色页配置。
      {
        title: 'IP地址',
        key: 'login_ip',
        dataIndex: 'login_ip',
        hideInTable: true,
        fieldProps: {
          placeholder: '最近登录IP，子串模糊匹配',
        },
      },
      {
        title: 'IP地址',
        key: 'last_login_record_ip',
        dataIndex: 'last_login_record_ip',
        hideInSearch: true,
        width: 120,
        align: 'center',
        sorter: true,
        render: (_, record) => {
          const row = record as API.UserManage.User & { last_login_record_ip?: string };
          return row.last_login_record_ip?.trim() ? row.last_login_record_ip : '-';
        },
      },
      {
        title: 'IP所属地',
        key: 'last_login_record_ip_region',
        dataIndex: 'last_login_record_ip_region',
        hideInSearch: true,
        width: 220,
        align: 'center',
        sorter: true,
      },
      {
        // dawn 2026-07-04 最近操作时间：客户端打开APP上报的时间
        title: '最近操作时间',
        key: 'last_operation_time',
        dataIndex: 'last_operation_time',
        hideInSearch: true,
        width: 170,
        align: 'center',
        render: (_, record) => {
          const t = (record as any).last_operation_time as number | undefined;
          return t && t > 0 ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '-';
        },
      },
      {
        title: '平台',
        key: 'platform',
        dataIndex: 'platform',
        hideInSearch: true,
        width: 80,
        align: 'center',
      },
      {
        title: intl.formatMessage({ id: 'pages.login.email' }),
        key: 'email',
        dataIndex: 'email',
        hideInSearch: true,
        width: 200,
        align: 'center',
      },
      {
        title: intl.formatMessage({ id: 'user.userID' }),
        key: 'user_id',
        dataIndex: 'user_id',
        align: 'center',
        width: 90,
        hideInSearch: true,
      },
      {
        title: '创建时间',
        key: 'create_time',
        dataIndex: 'create_time',
        align: 'center',
        width: 180,
        valueType: 'dateRange',
        render: (t_, record) => {
          return formatUTCTimeToBeijing(record.create_time);
        },
        fieldProps: {
          allowEmpty: [true, true]
        }
      },
      {
        title: '实名认证',
        key: 'isRealNameVerified',
        dataIndex: 'isRealNameVerified',
        hideInSearch: true,
        align: 'center',
        width: 100,
        render: (_, record) => (
          <Tag color={record.isRealNameVerified ? 'success' : 'default'}>
            {record.isRealNameVerified ? '已认证' : '未认证'}
          </Tag>
        ),
      },
      {
        title: '余额',
        key: 'balance',
        dataIndex: 'balance',
        hideInSearch: true,
        align: 'center',
        width: 180,
        render: (_, record) => {
          // 检查是否有余额数据 - 数据可能在不同位置，尝试多种路径
          const balances =
            (record.wallet_balances && record.wallet_balances.length > 0) ? record.wallet_balances :
            (record.wallet && record.wallet.balances && record.wallet.balances.length > 0) ? record.wallet.balances :
            (record.balances && record.balances.length > 0) ? record.balances :
            null;

          if (balances) {
            return (
              <div>
                {balances.map((balance, index) => {
                  // 尝试不同的字段名称
                  const currencyName = balance.currency_name || balance.currencyName || balance.currency_id || balance.currencyId || '未知币种';
                  const balanceValue = balance.available_balance || balance.availableBalance || balance.balance || balance.amount || 0;
                  return (
                    <div key={index} style={{ marginBottom: 4 }}>
                      <Tag color="blue">
                        {currencyName}: {parseFloat(balanceValue).toFixed(2)}
                      </Tag>
                    </div>
                  );
                })}
              </div>
            );
          }
          return <span style={{ color: '#999' }}>无余额数据</span>;
        },
      },
      {
        title: '补偿金余额',
        key: 'compensationBalance',
        dataIndex: 'compensationBalance',
        hideInSearch: true,
        align: 'center',
        width: 180,
        render: (_, record) => {
          // 检查是否有补偿金余额数据 - 现在是单一字符串值
          const compensationBalance =
            record.compensation_balance || // 新API返回格式
            (record.wallet && record.wallet.compensation_balance) || // 备选路径
            record.compensationBalance || // 驼峰格式
            null;

          // 处理单个字符串值的补偿金余额
          if (compensationBalance) {
            return (
              <div>
                <Tag color="green">
                  {parseFloat(compensationBalance).toFixed(2)}
                </Tag>
              </div>
            );
          }

          // 向后兼容：检查旧的数组格式（如果有的话）
          const compensationBalances =
            (record.compensation_balances && record.compensation_balances.length > 0) ? record.compensation_balances :
            (record.wallet && record.wallet.compensation_balances && record.wallet.compensation_balances.length > 0) ? record.wallet.compensation_balances :
            (record.compensationBalances && record.compensationBalances.length > 0) ? record.compensationBalances :
            null;

          if (compensationBalances) {
            return (
              <div>
                {compensationBalances.map((balance, index) => {
                  // 尝试不同的字段名称
                  const currencyName = balance.currency_name || balance.currencyName || balance.currency_id || balance.currencyId || '未知币种';
                  const balanceValue = balance.compensation_balance || balance.compensationBalance || balance.balance || balance.amount || 0;

                  return (
                    <div key={index} style={{ marginBottom: 4 }}>
                      <Tag color="green">
                        {currencyName}: {parseFloat(balanceValue).toFixed(2)}
                      </Tag>
                    </div>
                  );
                })}
              </div>
            );
          }
          return <span style={{ color: '#999' }}>无补偿金数据</span>;
        },
      },
      {
        title: '操作',
        key: 'action',
        hideInSearch: true,
        width: 320,
        align: 'center',
        fixed: 'right',
        render: (_: any, record: any) => (
          <Space size="small">
            {WEB_ADJUSTABLE_ROLES.includes(record.role) && (
              <Button type="link" onClick={() => openRoleAdjustModal(record)}>
                调整角色
              </Button>
            )}
            <Button type="link" onClick={() => openNicknameModal(record)}>
              修改昵称
            </Button>
            <Button type="link" onClick={() => openAdjustModal(record)}>
              调节余额
            </Button>
            {/* dawn 2026-06-24 组织用户列表新增"重置密码"操作：重置为默认密码 123456 */}
            <Popconfirm
              title="确定将登录密码重置为默认 123456?"
              onConfirm={async () => {
                await resetUserPassword({ userID: record.user_id });
                message.success('密码已重置为默认 123456');
                actionRef.current?.reload();
              }}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link">重置密码</Button>
            </Popconfirm>
            <Popconfirm
              title="确定要封禁此用户吗?"
              onConfirm={async () => {
                await updateBlock({ userID: record.im_server_user_id });
                message.success('封禁成功');
                actionRef.current?.reload();
              }}
              okText="确定"
              cancelText="取消"
            >
              <Button danger type="link">
                封禁
              </Button>
            </Popconfirm>
            {record.isRealNameVerified && (
              <Button type="link" onClick={() => viewIdentityDetail(record.user_id)}>
                实名详情
              </Button>
            )}
            <ModifyModel initData={record} tags={tagList} />
          </Space>
        ),
      },
    ],
    [tagList, openRoleAdjustModal, openNicknameModal],
  );
  const handleExportNicknameAccountExcel = async () => {
    if (exportExcelBusyRef.current) return;
    exportExcelBusyRef.current = true;
    setExportExcelLoading(true);
    message.loading({ content: '正在导出…', key: USER_LIST_EXPORT_MSG_KEY, duration: 0 });
    try {
      const formVals = formRef.current?.getFieldsValue?.() ?? {};
      const exportRoleRaw = formVals.role;
      const exportRoleStr =
        exportRoleRaw != null && String(exportRoleRaw).trim() !== ''
          ? String(exportRoleRaw).trim()
          : '';
      const exportRoles =
        exportRoleStr !== '' && USER_LIST_QUERY_ROLES.includes(exportRoleStr)
          ? [exportRoleStr]
          : USER_LIST_QUERY_ROLES;
      const searchParams: Record<string, unknown> = {
        roles: exportRoles,
        tag_ids: formVals.tag_ids,
        can_send_free_msg: Number(formVals.can_send_free_msg),
        omit_wallet: true,
      };
      const exportUserQ =
        formVals.nickname != null && String(formVals.nickname).trim() !== ''
          ? String(formVals.nickname).trim()
          : '';
      if (userInfoType === 'account') {
        if (exportUserQ) searchParams.account = exportUserQ;
      } else if (exportUserQ) {
        searchParams.keyword = exportUserQ;
      }
      if (formVals.create_time?.[0]) {
        searchParams.start_time = String(new Date(formVals.create_time[0]).getTime() / 1000);
      }
      if (formVals.create_time?.[1]) {
        searchParams.end_time = String(new Date(formVals.create_time[1]).getTime() / 1000);
      }
      const exportLoginIp =
        formVals.login_ip != null && String(formVals.login_ip).trim() !== ''
          ? String(formVals.login_ip).trim()
          : '';
      if (exportLoginIp) {
        searchParams.login_ip = exportLoginIp;
      }

      const rows: {
        nickname: string;
        account: string;
        createdAt: string;
        registerIp: string;
        lastLoginIp: string;
      }[] = [];
      let page = 1;
      let total = 0;
      while (page <= USER_LIST_EXPORT_MAX_PAGES) {
        const { data } = await selectMemberList({
          ...searchParams,
          page,
          pageSize: USER_LIST_EXPORT_PAGE_SIZE,
        });
        const batch = data?.data ?? [];
        total = typeof data?.total === 'number' ? data.total : 0;
        for (const item of batch) {
          const createdRaw = item?.created_at as string | undefined;
          const createdAt =
            createdRaw != null && String(createdRaw).trim() !== ''
              ? formatUTCTimeToBeijing(createdRaw)
              : '';
          rows.push({
            nickname: item?.user?.nickname ?? '',
            account: item?.attribute?.account ?? '',
            createdAt,
            registerIp: (item as { register_ip?: string })?.register_ip ?? '',
            lastLoginIp: (item as { last_login_record_ip?: string })?.last_login_record_ip ?? '',
          });
        }
        if (batch.length === 0 || rows.length >= total) break;
        page += 1;
      }

      if (rows.length === 0) {
        message.warning({ content: '没有可导出的用户', key: USER_LIST_EXPORT_MSG_KEY });
        return;
      }

      const aoa: string[][] = [
        ['用户昵称', '账号', '创建时间', '注册IP', '最近登录IP'],
        ...rows.map((r) => [r.nickname, r.account, r.createdAt, r.registerIp, r.lastLoginIp]),
      ];
      const xlsxModule = await import('xlsx');
      const XLSX = (
        'default' in xlsxModule && xlsxModule.default != null ? xlsxModule.default : xlsxModule
      ) as typeof import('xlsx');
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '用户列表');
      XLSX.writeFile(wb, `用户列表_${dayjs().format('YYYY-MM-DD_HHmmss')}.xlsx`);
      message.success({ content: `已导出 ${rows.length} 条`, key: USER_LIST_EXPORT_MSG_KEY });
    } catch (e) {
      console.error(e);
      message.error({ content: '导出失败', key: USER_LIST_EXPORT_MSG_KEY });
    } finally {
      exportExcelBusyRef.current = false;
      setExportExcelLoading(false);
    }
  };

  const handleUploadChange = async ({ file }) => {
    if (uploadLoading && uploadRef.current) {
      return;
    }
    setUploadLoading(true);
    uploadRef.current = true;
    const formData = new FormData();
    formData.append('file', file.originFileObj);
    try {
      const res = await uploadTemplate(formData);
      if (res.errCode === 0 && res.data.error.length === 0) {
        message.success('操作成功');
        actionRef.current?.reload();
      } else if (res.errCode === 0 && res.data.error.length !== 0) {
        setErrorDataModalProps({
          visible: true,
          errorData: res.data.error,
        })
      }
    } catch (error) {
      console.log('error-----', error);
    } finally {
      setUploadLoading(false);
      uploadRef.current = false;
    }
  }

  return (
    <PageContainer>
      <ForcedOfflineDrawer
        drawerOptions={drawerOptions}
        reload={() => actionRef.current?.reload()}
        setDrawerOptions={setDrawerOptions}
      />
      <Modal
        title="调节余额"
        open={adjustModal.open}
        onOk={submitAdjustBalance}
        confirmLoading={adjustLoading}
        onCancel={() => {
          setAdjustModal({ open: false });
          adjustForm.resetFields();
        }}
        okText="确认调整"
        destroyOnClose
        width={520}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="此操作会直接改动用户余额"
          description="调整会计入用户账单（显示为「后台调整」及填写的原因），并记录后台操作日志。请确认金额无误后再提交。"
        />
        <div style={{ marginBottom: 12 }}>
          <span style={{ color: '#888' }}>用户：</span>
          <strong>{adjustModal.record?.user?.nickname || adjustModal.record?.user_id}</strong>
        </div>
        <div style={{ marginBottom: 16 }}>
          <span style={{ color: '#888' }}>当前余额：</span>
          {(adjustModal.balances ?? []).map((b: any, i: number) => (
            <Tag color="blue" key={i}>
              {b.currency_name || b.currencyName || b.currency_id || b.currencyId}:{' '}
              {parseFloat(b.available_balance || b.availableBalance || b.balance || 0).toFixed(2)}
            </Tag>
          ))}
        </div>
        <Form form={adjustForm} layout="vertical">
          <Form.Item
            label="币种"
            name="currencyId"
            rules={[{ required: true, message: '请选择币种' }]}
          >
            <Select
              options={(adjustModal.balances ?? []).map((b: any) => ({
                value: b.currency_id ?? b.currencyId,
                label:
                  (b.currency_name || b.currencyName || b.currency_id || b.currencyId) +
                  `（当前 ${parseFloat(
                    b.available_balance || b.availableBalance || b.balance || 0,
                  ).toFixed(2)}）`,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="调整金额"
            name="amount"
            extra="正数为增加，负数为扣减。例：100 表示加 100，-50 表示扣 50"
            rules={[
              { required: true, message: '请输入调整金额' },
              {
                validator: (_, value) => {
                  const v = String(value ?? '').trim();
                  if (!v) return Promise.resolve();
                  if (!/^-?\d+(\.\d{1,2})?$/.test(v)) {
                    return Promise.reject(new Error('金额格式不正确，最多两位小数'));
                  }
                  if (Number(v) === 0) {
                    return Promise.reject(new Error('调整金额不能为 0'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            {/* 用 Input 而非 InputNumber：金额需以字符串原样传给后端，
                走 number 类型会经过 JS 浮点，100.10 可能变成 100.09999999999999 */}
            <Input placeholder="如 100 或 -50" allowClear />
          </Form.Item>
          <Form.Item
            label="再次输入金额确认"
            name="amountConfirm"
            dependencies={['amount']}
            extra="防止手滑多打一个 0，两次输入需完全一致"
            rules={[
              { required: true, message: '请再次输入金额' },
              ({ getFieldValue }) => ({
                validator: (_, value) => {
                  if (String(value ?? '').trim() === String(getFieldValue('amount') ?? '').trim()) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的金额不一致'));
                },
              }),
            ]}
          >
            <Input placeholder="再次输入相同金额" allowClear />
          </Form.Item>
          <Form.Item
            label="调整原因"
            name="reason"
            extra="用户会在账单中看到该原因，请如实填写"
            rules={[
              { required: true, message: '请填写调整原因' },
              { max: 100, message: '原因不超过 100 字' },
            ]}
          >
            <Input.TextArea rows={2} placeholder="如：活动补发 / 误扣返还 / 客诉赔付" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="修改昵称"
        open={nicknameModal.open}
        onOk={submitNicknameUpdate}
        confirmLoading={nicknameUpdateLoading}
        onCancel={() => {
          setNicknameModal({ open: false });
          nicknameForm.resetFields();
        }}
        destroyOnClose
      >
        <Form form={nicknameForm} layout="vertical">
          <Form.Item
            label="用户昵称"
            name="nickname"
            rules={[
              { required: true, message: '请输入用户昵称' },
              { max: 50, message: '昵称长度不能超过 50' },
            ]}
          >
            <Input allowClear placeholder="请输入新的用户昵称" />
          </Form.Item>
        </Form>
      </Modal>
      <ErrorDataModal
        visible={errorDataModalProps.visible}
        closeModal={() => setErrorDataModalProps({ visible: false, errorData: [] })}
        errorData={errorDataModalProps.errorData}
      />
      <Modal
        title="实名认证详情"
        open={identityDetailVisible}
        onCancel={() => setIdentityDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIdentityDetailVisible(false)}>
            关闭
          </Button>,
          currentIdentityDetail && currentIdentityDetail.status === 2 && (
            <Popconfirm
              key="cancel"
              title="确认取消该用户的实名认证？"
              onConfirm={() => handleCancelVerification(currentIdentityDetail.userID)}
            >
              <Button type="primary" danger>
                取消认证
              </Button>
            </Popconfirm>
          ),
        ]}
        width={600}
      >
        {currentIdentityDetail && (
          <div style={{ padding: '20px 0' }}>
            <p>
              <strong>用户昵称：</strong>
              {currentIdentityDetail.nickname || '-'}
            </p>
            <p>
              <strong>账号：</strong>
              {currentIdentityDetail.account || '-'}
            </p>
            <p>
              <strong>真实姓名：</strong>
              {currentIdentityDetail.realName}
            </p>
            <p>
              <strong>身份证号：</strong>
              {currentIdentityDetail.idCardNumber}
            </p>
            <p>
              <strong>认证状态：</strong>
              <Tag
                color={
                  currentIdentityDetail.status === 2
                    ? 'success'
                    : currentIdentityDetail.status === 1
                      ? 'processing'
                      : currentIdentityDetail.status === 3
                        ? 'error'
                        : 'default'
                }
              >
                {currentIdentityDetail.status === 2
                  ? '已认证'
                  : currentIdentityDetail.status === 1
                    ? '审核中'
                    : currentIdentityDetail.status === 3
                      ? '已拒绝'
                      : '待认证'}
              </Tag>
            </p>
            <p>
              <strong>提交时间：</strong>
              {currentIdentityDetail.applyTime
                ? formatUTCTimeToBeijing(currentIdentityDetail.applyTime)
                : '-'}
            </p>
            {(currentIdentityDetail.status === 2 || currentIdentityDetail.status === 3) && (
              <>
                <p>
                  <strong>审核时间：</strong>
                  {currentIdentityDetail.verifyTime
                    ? formatUTCTimeToBeijing(currentIdentityDetail.verifyTime)
                    : '-'}
                </p>
                {currentIdentityDetail.verifyAdminName && (
                  <p>
                    <strong>审核管理员：</strong>
                    {currentIdentityDetail.verifyAdminName}
                  </p>
                )}
              </>
            )}
            {currentIdentityDetail.status === 3 && currentIdentityDetail.rejectReason && (
              <p>
                <strong>拒绝原因：</strong>
                <span style={{ color: '#ff4d4f' }}>{currentIdentityDetail.rejectReason}</span>
              </p>
            )}
            <div style={{ marginTop: 20 }}>
              <strong>身份证照片：</strong>
              <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
                <div>
                  <p>正面</p>
                  <img
                    src={getResourceUrl(currentIdentityDetail.idCardFront)}
                    alt="身份证正面"
                    style={{ width: 200, border: '1px solid #d9d9d9', borderRadius: 4 }}
                  />
                </div>
                <div>
                  <p>反面</p>
                  <img
                    src={getResourceUrl(currentIdentityDetail.idCardBack)}
                    alt="身份证反面"
                    style={{ width: 200, border: '1px solid #d9d9d9', borderRadius: 4 }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        title="调整角色"
        open={roleModal.open}
        onCancel={() => setRoleModal({ open: false })}
        onOk={submitRoleAdjust}
        destroyOnClose
      >
        <Select
          style={{ width: '100%' }}
          value={targetRole}
          onChange={(v) => setTargetRole(v)}
          options={getRoleAdjustOptions(roleModal.currentRole)}
        />
      </Modal>
      <ProTable<API.UserManage.User>
        columns={columns}
        actionRef={actionRef}
        formRef={formRef}
        scroll={{ x: 'max-content' }}
        search={{
          labelWidth: 'auto',
        }}
        rowKey={(record) => record.user_id}
        request={async (params = {}, sort = {}) => {
          const tag_ids = formRef.current?.getFieldValue('tag_ids');

          // const { data } = await getOrganizationUsers({
          //   pageNumber: params.current as number,
          //   showNumber: params.pageSize as number,
          //   keyword: params.nickname,
          // });

          if (params.create_time) {
            params.start_time = params.create_time[0];
            params.end_time = params.create_time[1];
          }
          const roleParam = params.role as string | string[] | undefined;
          const roleStr = Array.isArray(roleParam)
            ? roleParam[0]
            : roleParam != null
              ? String(roleParam).trim()
              : '';
          const rolesForQuery =
            roleStr !== '' && USER_LIST_QUERY_ROLES.includes(roleStr)
              ? [roleStr]
              : USER_LIST_QUERY_ROLES;
          const searchParams = {
            roles: rolesForQuery,
            page: params.current,
            pageSize: params.pageSize,
            tag_ids: tag_ids,
            can_send_free_msg: Number(params.can_send_free_msg),
            omit_wallet: true,
          } as Record<string, unknown>;
          const ipSort = sort.last_login_record_ip;
          const ipRegionSort = sort.last_login_record_ip_region;
          if (ipSort) {
            searchParams.order_key = 'last_login_record_ip';
            searchParams.order_direction = ipSort === 'ascend' ? 'asc' : 'desc';
          } else if (ipRegionSort) {
            searchParams.order_key = 'last_login_record_ip_region';
            searchParams.order_direction = ipRegionSort === 'ascend' ? 'asc' : 'desc';
          }
          const userQ =
            params.nickname != null && String(params.nickname).trim() !== ''
              ? String(params.nickname).trim()
              : '';
          if (userInfoType === 'account') {
            if (userQ) searchParams.account = userQ;
          } else if (userQ) {
            searchParams.keyword = userQ;
          }

          if (params.create_time) {
            if (params.create_time[0]) {
              searchParams.start_time = String(new Date(params.create_time[0]).getTime() / 1000);
            }
            if (params.create_time[1]) {
              searchParams.end_time = String(new Date(params.create_time[1]).getTime() / 1000);
            }
          }
          const listLoginIp =
            params.login_ip != null && String(params.login_ip).trim() !== ''
              ? String(params.login_ip).trim()
              : '';
          if (listLoginIp) {
            searchParams.login_ip = listLoginIp;
          }
          const { data } = await selectMemberList(searchParams);

          const tmpData = data.data ?? [];
          let res = tmpData.map((item) => {
            return {
              ...item,
              ...item.attribute,
              nickname: item.user.nickname,
            };
          });
          const userIds = res.map((r: { user_id?: string }) => r.user_id).filter(Boolean) as string[];
          if (userIds.length > 0) {
            try {
              const snap = await postOrgUserWalletSnapshot({ user_ids: userIds });
              const s = snap as { data?: { list?: API.UserManage.WalletSnapshotItem[] }; list?: API.UserManage.WalletSnapshotItem[] };
              const list = s?.data?.list ?? s?.list ?? [];
              const wmap = new Map(list.map((x) => [x.user_id, x]));
              res = res.map((row: { user_id?: string; wallet_balances?: unknown; compensation_balance?: string }) => {
                const w = row.user_id ? wmap.get(row.user_id) : undefined;
                if (!w) return row;
                return {
                  ...row,
                  wallet_balances: w.wallet_balances ?? row.wallet_balances,
                  compensation_balance: w.compensation_balance ?? row.compensation_balance,
                };
              });
            } catch (e) {
              console.error('wallet_snapshot', e);
            }
            // dawn 2026-07-04 最近操作时间：批量取并合并进行(user_id→毫秒)。
            try {
              const opRes = await getOrgUserOperationTimes({ user_ids: userIds });
              const omap = ((opRes as any)?.data ?? (opRes as any) ?? {}) as Record<string, number>;
              res = res.map((row: { user_id?: string }) =>
                row.user_id && omap[row.user_id]
                  ? { ...row, last_operation_time: omap[row.user_id] }
                  : row,
              );
            } catch (e) {
              console.error('operation_times', e);
            }
          }
          return {
            data: res,
            success: true,
            total: data.total,
          };
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys, rows) => {
            setSelectedRowKeys(keys);
            setSelectedRowsMap((prev) => {
              const next = new Map(prev);
              const keySet = new Set(keys.map(String));
              (rows as any[]).forEach((r) => {
                if (r?.user_id) next.set(String(r.user_id), r);
              });
              for (const uid of [...next.keys()]) {
                if (!keySet.has(uid)) next.delete(uid);
              }
              return next;
            });
          },
          preserveSelectedRowKeys: true,
        }}
        tableAlertRender={false}
        toolBarRender={() => [
          <Button
            key="batch-block"
            danger
            disabled={selectedRowKeys.length === 0}
            onClick={() => {
              Modal.confirm({
                title: `确定封禁选中的 ${selectedRowKeys.length} 个用户？`,
                content: '将按组织黑名单规则处理，请谨慎操作。',
                okText: '封禁',
                okType: 'danger',
                cancelText: '取消',
                onOk: async () => {
                  const targets = selectedRowKeys
                    .map((k) => selectedRowsMap.get(String(k)))
                    .filter(Boolean) as any[];
                  const missingIm = selectedRowKeys.length - targets.length;
                  const skippedNoIm = targets.filter((r) => !r.im_server_user_id).length;
                  const toBlock = targets.filter((r) => r.im_server_user_id);
                  const failures: string[] = [];
                  for (const r of toBlock) {
                    try {
                      await updateBlock({ userID: r.im_server_user_id });
                    } catch (e: any) {
                      const label = r.nickname || r.account || r.user_id || r.im_server_user_id;
                      failures.push(String(label));
                    }
                  }
                  if (failures.length) {
                    message.warning(
                      `部分失败（${failures.length}）：${failures.slice(0, 5).join('、')}${
                        failures.length > 5 ? '…' : ''
                      }`,
                    );
                  } else if (toBlock.length === 0) {
                    message.warning(
                      missingIm || skippedNoIm
                        ? '选中行缺少数据或未绑定 IM 用户，无法封禁'
                        : '没有可封禁的用户',
                    );
                  } else {
                    message.success('封禁已提交');
                  }
                  setSelectedRowKeys([]);
                  setSelectedRowsMap(new Map());
                  actionRef.current?.reload();
                },
              });
            }}
          >
            一键封禁
          </Button>,
          <Button
            key="export-excel"
            loading={exportExcelLoading}
            disabled={exportExcelLoading}
            onClick={handleExportNicknameAccountExcel}
          >
            导出 Excel
          </Button>,
          <Button
            key="download"
            type="primary"
            onClick={async () => {
              const res = await downloadTemplate();
              const url = URL.createObjectURL(res);
              const a = document.createElement('a');
              a.href = url;
              a.download = '批量导入用户模板.xlsx';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            下载模板
          </Button>,
          <Upload accept=".xlsx" onChange={handleUploadChange} showUploadList={false}>
            <Button loading={uploadLoading} key='upload' type='primary'>批量导入用户</Button>
          </Upload>
        ]}
        pagination={{
          defaultPageSize: 10,
          showQuickJumper: true,
        }}
      />
    </PageContainer>
  );
};

export default UserList;
