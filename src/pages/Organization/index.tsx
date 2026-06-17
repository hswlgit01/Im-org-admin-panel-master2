import {
  changeOrganizationInfo,
  organizationInfo,
  selectMemberList,
  updateUserRole,
  updateUserStatus,
} from '@/services/account';
import { splitUpload } from '@/services/upload';
import { getWalletBalance } from '@/services/wallet';
import {
  CopyOutlined,
  EditOutlined,
  PartitionOutlined,
  PlusOutlined,
  TeamOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Spin,
  Table,
  Tag,
  Upload,
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import type { UploadFile } from 'antd/es/upload/interface';
import { UploadRequestOption } from 'rc-upload/lib/interface';
import React, { useEffect, useState } from 'react';
import styles from './index.less';
import InsertMemberModal from '@/pages/Organization/components/InsertMemberModal';
import { createPortal } from 'react-dom';
import SelectUserModal, { SelectedListItem, SelectModalOptions } from '@/components/SelectUserModal';
import { useSetState } from 'ahooks';
import { useIntl } from '@umijs/max';
import { formatUTCTimeToBeijing, getResourceUrl } from '@/utils/common';
import ResetModal from '@/pages/chat/user/UserList/ResetModal';

const { Search } = Input;


interface ITableParams {
  roles: string[];
  page: number;
  pageSize: number;
  keyword?: string;
  status?: string;
}
type TListType = 'member' | 'group';



const OrganizationDetail: React.FC = () => {
  const intl = useIntl();

  const [insertMemberVisible, setInsertMemberVisible] = useState(false);
  const [selectUserModalOptions, setSelectUserModalOptions] = useState<SelectModalOptions>({
    open: false,
    selectType: 'owner',
  });
  const [orgData, setOrgData] = useState({
    name: '',
    createTime: '',
    verified: false,
    type: '',
    totalUser: 0,
    verifiedUserTotal: 0,
    totalGroup: 0,
    balance: 0,
    contact: '',
    phone: '',
    email: '',
    inviteCode: '',
    description: '',
    faceURL: '',
    accountPrefix: '',
  });

  const roleMap: Record<string, string> = {
  SuperAdmin: intl.formatMessage({ id: 'superAdmin' }),
  BackendAdmin: intl.formatMessage({ id: 'organizationAdmin' }),
  GroupManager: intl.formatMessage({ id: 'orgAdmin' }),
  TermManager: '团队长',
  Normal: intl.formatMessage({ id: 'regularMember' }),
}
  const fetchOrganizationInfo = async () => {
    setLoading(true);
    try {
      // dawn 2026-06-17 修复组织详情加载态：接口异常时也要释放页面遮罩
      const { data } = await organizationInfo();
      setOrgData({
        name: data.name,
        createTime: new Date(data.created_at).toLocaleDateString(),
        verified: data.status === 'pass',
        type: data.type === 'enterprise' ? intl.formatMessage({ id: 'enterpriseOrg' }) : data.type,
        totalUser: data.user_total || 0, // 成员总数
        verifiedUserTotal: data.verified_user_total || 0, // 已实名成员总数
        totalGroup: data.group_total || 0, // 群组数量
        balance: 0,
        contact: data.contacts,
        phone: data.phone,
        email: data.email,
        inviteCode: data.invitation_code,
        description: data.description,
        faceURL: data.logo || '',
        accountPrefix: data.account_prefix,
      });

      // 如果钱包存在，则获取钱包余额
      if (data?.wallet_exist) {
        try {
          const balanceRes = await getWalletBalance();
          if (balanceRes.data) {
            setOrgData((prev) => ({
              ...prev,
              balance: balanceRes.data.total_balance_usd || 0,
            }));
          }
        } catch (error) {
          console.error('获取钱包余额失败:', error);
        }
      }
    } catch (error) {
      console.error('获取组织信息失败:', error);
      message.error('获取组织信息失败');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchOrganizationInfo();
  }, []);



  const [listType, setListType] = useState<TListType>('');

  const [memberTableParams, setMemberTableParams] = useSetState<ITableParams>({
    roles: ['SuperAdmin', 'BackendAdmin'],
    page: 1,
    pageSize: 5,
  })
  const [groupTableParams, setGroupTableParams] = useSetState<ITableParams>({
    roles: ['GroupManager', 'TermManager'],
    page: 1,
    pageSize: 5,
  })
  const [memberList, setMemberList] = useState({
    total: 0,
    list: []
  });
  const [groupManagerList, setGroupManagerList] = useState({
    total: 0,
    list: []
  })
  const [loading, setLoading] = useState(false);
  const [resetUserID, setResetUserID] = useState<string | null>(null);

  // 编辑信息相关状态
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editForm] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadState, setUploadState] = useState({
    url: undefined as string | undefined,
    loading: false,
  });

  useEffect(() => {
    if (listType === '') {
      selectUserList('member');
      selectUserList('group');
    } else {
      selectUserList(listType)
    }
  }, [listType, groupTableParams, memberTableParams])


  const selectUserList = async (type: TListType) => {
    try {
      // dawn 2026-06-17 修复组织详情加载态：成员列表异常时不影响页面主体展示
      const res = await selectMemberList(type === 'member' ? memberTableParams : groupTableParams);
      console.log('selectUserList', res);
      const list = res.data.data;
      if (type === 'member') {
        setMemberList({
          total: res.data.total,
          list,
        });
      } else {
        setGroupManagerList({
          total: res.data.total,
          list,
        });
      }
    } catch (error) {
      console.error('获取组织成员列表失败:', error);
      message.error(type === 'member' ? '获取后台管理员失败' : '获取团队长列表失败');
    }
  }
  const openSelectUserModal = () => {
    setSelectUserModalOptions({
      ...selectUserModalOptions,
      open: true,
      selectType: 'owner',
    });
  };

  const closeSelectUserModal = () => {
    setSelectUserModalOptions({
      ...selectUserModalOptions,
      open: false,
    });
  };

  const onMemberTableChange = (pagination) => {
    setMemberTableParams({
      page: pagination.current
    })
    setListType('member');
  }

  const onGroupTableChange = (pagination) => {
    setGroupTableParams({
      page: pagination.current
    })
    setListType('group');
  }

  const handleUserSelected = (selectedList: SelectedListItem) => {
    if (selectedList.data.length > 0) {
      const user = selectedList.data[0];
      updateUserRole({
        user_id: user.userID,
        role: 'TermManager'
      }).then(() => {
        message.success(intl.formatMessage({ id: 'operationSuccess' }));
        selectUserList('group')
      })
    }
  };

  const handleSearch = (listType: TListType, value: string) => {
    if (listType === 'member') {
      setMemberTableParams({
        keyword: value
      })
    } else {
      setGroupTableParams({
        keyword: value
      })
    }
    setListType(listType);
  };

  const handleStatusChange = (listType: TListType, value: string) => {
    if (listType === 'member') {
      setMemberTableParams({
        status: value === 'all' ? '' : value
      })
    } else {
      setGroupTableParams({
        status: value === 'all' ? '' : value
      })
    }
    setListType(listType);
  };

  const handleMemberStatusChange = (id: number, currentStatus: string) => {
    updateUserStatus({ user_id: id, status: currentStatus === 'Enable' ? 'Disable' : 'Enable' }).then(() => {
      message.success(intl.formatMessage({ id: 'operationSuccess' }));
      selectUserList('member')
    })
  };

  const removeGroupManager = (id: number) => {
    updateUserRole({ user_id: id, role: 'Normal' }).then(() => {
      message.success(intl.formatMessage({ id: 'operationSuccess' }));
      selectUserList('group')
    })
  };


  const memberColumns = [
    {
      title: intl.formatMessage({ id: 'memberInfo' }),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div className={styles.memberInfo}>
          <Avatar className={styles.memberAvatar} src={getResourceUrl(record.user?.face_url)}>{record.user?.nickname}</Avatar>
          <div>
            <div>{record.user?.nickname}</div>
          </div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({ id: 'loginAccount' }),
      dataIndex: 'account',
      key: 'account',
      render: (_, record) => (
        <>{record.attribute?.account}</>
      ),
    },
    {
      title: intl.formatMessage({ id: 'role' }),
      dataIndex: 'role',
      key: 'role',
      render: (text: string) => {
        let color = 'default';
        return <Tag color={color}>{roleMap[text]}</Tag>;
      },
    },
    {
      title: intl.formatMessage({ id: 'createTime' }),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => {
        return formatUTCTimeToBeijing(text);
      },
    },
    {
      title: intl.formatMessage({ id: 'status' }),
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => {
        return <Badge status={text === 'Enable' ? 'success' : 'error'} text={text === 'Enable' ? '启用' : '禁用'} />;
      },
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: any) => (
        <div className={styles.actionBtns}>
          <Button type="link" onClick={() => setResetUserID(record.user_id)}>
            {intl.formatMessage({ id: 'user.resetPassword' })}
          </Button>
          {record.role === 'GroupManager' || record.role === 'TermManager' ? (
            <Button
              type="link"
              danger
              onClick={() => removeGroupManager(record.user_id)}
            >
              {intl.formatMessage({ id: 'remove' })}
            </Button>
          ) : record.status === 'Enable' ? (
            <Button
              type="link"
              danger
              onClick={() => handleMemberStatusChange(record.user_id, record.status)}
            >
              {intl.formatMessage({ id: 'disable' })}
            </Button>
          ) : (
            <Button type="link" onClick={() => handleMemberStatusChange(record.user_id, record.status)}>
              {intl.formatMessage({ id: 'enable' })}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const adminColumns = [
    {
      title: intl.formatMessage({ id: 'memberInfo' }),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div className={styles.memberInfo}>
          <Avatar className={styles.memberAvatar} src={getResourceUrl(record.user?.face_url)}>{record.user?.nickname}</Avatar>
          <div>
            <div>{record.user?.nickname}</div>
          </div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({ id: 'account' }),
      dataIndex: 'account',
      key: 'account',
      render: (_, record) => (
        <>{record.attribute?.account}</>
      ),
    },
    {
      title: intl.formatMessage({ id: 'email' }),
      dataIndex: 'email',
      key: 'email',
      render: (_, record) => (
        <>{record.attribute?.email}</>
      ),
    },
    // {
    //   title: '角色',
    //   dataIndex: 'role',
    //   key: 'role',
    //   render: (text: string) => {
    //     let color = 'default';
    //     return <Tag color={color}>{roleMap[text]}</Tag>;
    //   },
    // },
    {
      title: intl.formatMessage({ id: 'joinTime' }),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => {
        return formatUTCTimeToBeijing(text);
      },
    },
    {
      title: intl.formatMessage({ id: 'status' }),
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => {
        return <Badge status={text === 'Enable' ? 'success' : 'error'} text={text === 'Enable' ? '启用' : '禁用'} />;
      },
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: any) => (
        <div className={styles.actionBtns}>
          <Button type="link" onClick={() => setResetUserID(record.user_id)}>
            {intl.formatMessage({ id: 'user.resetPassword' })}
          </Button>
          {record.role === 'GroupManager' || record.role === 'TermManager' ? (
            <Button
              type="link"
              danger
              onClick={() => removeGroupManager(record.user_id)}
            >
              {intl.formatMessage({ id: 'remove' })}
            </Button>
          ) : record.status === 'Enable' ? (
            <Button
              type="link"
              danger
              onClick={() => handleMemberStatusChange(record.user_id, record.status)}
            >
              {intl.formatMessage({ id: 'disable' })}
            </Button>
          ) : (
            <Button type="link" onClick={() => handleMemberStatusChange(record.user_id, record.status)}>
              {intl.formatMessage({ id: 'enable' })}
            </Button>
          )}
        </div>
      ),
    },
  ];
  // 打开编辑信息弹窗
  const showEditModal = () => {
    // 初始化表单数据
    editForm.setFieldsValue({
      name: orgData.name,
      type: orgData.type,
      contact: orgData.contact,
      phone: orgData.phone,
      email: orgData.email,
      description: orgData.description,
      inviteCode: orgData.inviteCode,
    });

    // 如果有组织logo，可以设置到fileList中
    setFileList(
      orgData.faceURL
        ? [
          {
            uid: '-1',
            name: 'logo.png',
            status: 'done',
            url: orgData.faceURL,
          },
        ]
        : [],
    );

    // 重置上传状态
    setUploadState({
      url: orgData.faceURL || undefined,
      loading: false,
    });

    setEditModalVisible(true);
  };

  // 提交编辑表单
  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      console.log('values', values);
      const params = {
        email: values.email,
        phone: values.phone,
        contacts: values.contact,
        description: values.description,
        invitation_code: values.inviteCode,
        logo: uploadState.url || orgData.faceURL,
      };
      const res = await changeOrganizationInfo(params);

      if (res.errCode === 0) {
        fetchOrganizationInfo();
      }

         message.success(intl.formatMessage({ id: 'operationSuccess' }));
      setEditModalVisible(false);
    } catch (error) {
      console.error('验证失败:', error);
    }
  };

  // 自定义上传方法
  const customUpload = async (data: UploadRequestOption) => {
    setUploadState((state) => ({ ...state, loading: true }));
    try {
      const { url: logoUrl } = await splitUpload(data.file as File);
      if (logoUrl) {
        setUploadState({ url: logoUrl, loading: false });
        // 更新文件列表显示
        setFileList([
          {
            uid: '-1',
            name: (data.file as File).name,
            status: 'done',
            url: logoUrl,
          },
        ]);
      }
    } catch (error) {
      setUploadState((state) => ({ ...state, loading: false }));
      message.error(intl.formatMessage({ id: 'operationFailed' }));
      console.log(error);
    }
  };

  // 上传文件变化处理
  const handleFileChange = ({ fileList }: { fileList: any[] }) => {
    setFileList(fileList);
  };

  // 上传之前的处理
  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error(intl.formatMessage({ id: 'onlyJpgPng' }));
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error(intl.formatMessage({ id: 'imageSizeLimit' }));
    }
    return isJpgOrPng && isLt2M;
  };

  const handleEditCancel = () => {
    setEditModalVisible(false);
  };

  // 在组件中添加状态
  const [keyPairModalVisible, setKeyPairModalVisible] = useState(false);
  const [generatingKeyPair, setGeneratingKeyPair] = useState(false);
  const [keyPairResult, setKeyPairResult] = useState<{
    publicKey: string;
    privateKey: string;
  } | null>(null);

  // 打开生成密钥对对话框
  const showKeyPairModal = () => {
    setKeyPairModalVisible(true);
  };

  // 生成密钥对
  const handleGenerateKeyPair = async () => {
    setGeneratingKeyPair(true);
    try {
      // 这里调用后端API生成密钥对
      // const result = await generateKeyPair();
      // 模拟API返回
      const result = {
        publicKey: 'xxxxxxx公钥内容xxxxxxx',
        privateKey: 'xxxxxxx私钥内容xxxxxxx',
      };
      setKeyPairResult(result);
      message.success('密钥对生成成功');
    } catch (error) {
      message.error('生成密钥对失败');
    } finally {
      setGeneratingKeyPair(false);
    }
  };

  // 复制内容到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('复制成功');
  };



  return (
    <PageContainer
      header={{
        title: '',
        breadcrumb: <Breadcrumb items={[{ title: '首页' }, { title: '组织管理' }]} />,
      }}
    >
      <ResetModal userID={resetUserID} setUserID={setResetUserID} />
      <Spin spinning={loading}>
        <Card className={styles.orgInfoCard}>
          <div className={styles.orgHeader}>
            <div className={styles.orgLogo}>
              <Avatar size={64} shape="square" src={getResourceUrl(orgData.faceURL) === '' ? undefined : getResourceUrl(orgData.faceURL)}>
                {orgData.name?.charAt(0)}
              </Avatar>
            </div>
            <div className={styles.orgBasicInfo}>
              <div className={styles.orgName}>
                <h2>{orgData.name}</h2>
                <div className={styles.orgTags}>
                  {orgData.verified && <Tag color="success">{intl.formatMessage({ id: 'verified' })}</Tag>}
                  <Tag color="blue">{orgData.type}</Tag>
                </div>
              </div>
              <div className={styles.orgCreateTime}>{intl.formatMessage({ id: 'createdAt' })} {orgData.createTime}</div>
            </div>
            <div className={styles.orgActions}>
              <Button icon={<EditOutlined />} onClick={showEditModal}>
                {intl.formatMessage({ id: 'editInfo' })}
              </Button>
              {/*<Button type="primary" icon={<PlusOutlined />}>*/}
              {/*  生成密钥对*/}
              {/*</Button>*/}
            </div>
          </div>

          <div className={styles.orgStats}>
            <Row gutter={16}>
              <Col span={8}>
                <div className={styles.statItem}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#e6f7ff' }}>
                    {/* <span className={styles.iconScore}></span> */}
                    <PartitionOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                  </div>
                  <div className={styles.statInfo}>
                    <div className={styles.statLabel}>{intl.formatMessage({ id: 'totalMembers' })}</div>
                    <div className={styles.statValue}>{orgData.totalUser}</div>
                    <div className={styles.statSubValue}>已实名 {orgData.verifiedUserTotal}</div>
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div className={styles.statItem}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#f9f0ff' }}>
                    {/* <span className={styles.iconMembers}></span> */}
                    <TeamOutlined style={{ fontSize: '24px', color: '#722ed1' }} />
                  </div>
                  <div className={styles.statInfo}>
                    <div className={styles.statLabel}>{intl.formatMessage({ id: 'groupCount' })}</div>
                    <div className={styles.statValue}>{orgData.totalGroup}</div>
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div className={styles.statItem}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#fffbe6' }}>
                    {/* <span className={styles.iconBalance}></span> */}
                    <WalletOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                  </div>
                  <div className={styles.statInfo}>
                    <div className={styles.statLabel}>{intl.formatMessage({ id: 'accountBalance' })}</div>
                    <div className={styles.statValue}>{orgData.balance} CNY</div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          <div className={styles.orgDetailItems}>
            <div className={styles.detailRow}>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>{intl.formatMessage({ id: 'organizationName' })}</div>
                <div className={styles.detailValue}>{orgData.name}</div>
              </div>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>{intl.formatMessage({ id: 'contactPerson' })}</div>
                <div className={styles.detailValue}>{orgData.contact}</div>
              </div>
            </div>
            <div className={styles.detailRow}>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>{intl.formatMessage({ id: 'organizationType' })}</div>
                <div className={styles.detailValue}>{orgData.type}</div>
              </div>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>{intl.formatMessage({ id: 'contactNumber' })}</div>
                <div className={styles.detailValue}>{orgData.phone}</div>
              </div>
            </div>
            <div className={styles.detailRow}>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>{intl.formatMessage({ id: 'establishmentDate' })}</div>
                <div className={styles.detailValue}>{orgData.createTime}</div>
              </div>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>{intl.formatMessage({ id: 'email' })}</div>
                <div className={styles.detailValue}>{orgData.email}</div>
              </div>
            </div>
            <div className={styles.detailRow}>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>{intl.formatMessage({ id: 'invitationCode' })}</div>
                <div className={styles.detailValue}>{orgData.inviteCode}</div>
              </div>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>{intl.formatMessage({ id: 'organizationDescription' })}</div>
                <div className={styles.detailValue}>{orgData.description}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card title={intl.formatMessage({ id: 'organizationAdmin' })} className={styles.membersCard} style={{ marginTop: 24 }}>
          <div className={styles.memberSearch}>
            <div className={styles.filterStatus}>
              <span>{intl.formatMessage({ id: 'status' })}：</span>
              <Select
                defaultValue={intl.formatMessage({ id: 'all' })}
                style={{ width: 120 }}
                onChange={(value: string) => handleStatusChange('member', value)}
                options={[
                  { value: 'all', label: intl.formatMessage({ id: 'all' }) },
                  { value: 'Enable', label: intl.formatMessage({ id: 'normal' }) },
                  { value: 'Disable', label: intl.formatMessage({ id: 'disabled' }) },
                ]}
              />
            </div>
            <div className={styles.memberActions}>
              <Search placeholder={intl.formatMessage({ id: 'searchMembers' })} onSearch={(value: string) => handleSearch('member', value)} style={{ width: 250 }} />
              <Button type="primary" onClick={() => setInsertMemberVisible(true)} icon={<PlusOutlined />}>
                {intl.formatMessage({ id: 'addAdmin' })}
              </Button>
            </div>
          </div>
          <Table
            columns={memberColumns}
            dataSource={memberList.list}
            rowKey="id"
            pagination={{ pageSize: 5, total: memberList.total }}
            onChange={onMemberTableChange}
            loading={loading}
          />
        </Card>
        <Card title={intl.formatMessage({ id: 'orgAdmin' })} className={styles.membersCard} style={{ marginTop: 24 }}>
          <div className={styles.memberSearch}>
            <div className={styles.filterStatus}>
              <span>{intl.formatMessage({ id: 'status' })}：</span>
              <Select
                defaultValue={intl.formatMessage({ id: 'all' })}
                style={{ width: 120 }}
                onChange={(value: string) => handleStatusChange('group', value)}
                options={[
                  { value: 'all', label: intl.formatMessage({ id: 'all' }) },
                  { value: 'Enable', label: intl.formatMessage({ id: 'normal' }) },
                  { value: 'Disable', label: intl.formatMessage({ id: 'disabled' }) },
                ]}
              />
            </div>
            <div className={styles.memberActions}>
              <Search placeholder={intl.formatMessage({ id: 'searchMembers' })} onSearch={(value: string) => handleSearch('group', value)} style={{ width: 250 }} />
              <Button type="primary" onClick={openSelectUserModal} icon={<PlusOutlined />}>
                {intl.formatMessage({ id: 'addOrgAdmin' })}
              </Button>
            </div>
          </div>
          <Table
            columns={adminColumns}
            dataSource={groupManagerList.list}
            rowKey="id"
            pagination={{ pageSize: 5, total: groupManagerList.total }}
            onChange={onGroupTableChange}
            loading={loading}
          />
        </Card>
      </Spin>
      <InsertMemberModal
        isModalVisible={insertMemberVisible}
        onCancel={() => setInsertMemberVisible(false)}
        onSuccess={() => selectUserList('member')}
        accountPrefix={orgData.accountPrefix}
      />
      {/* 编辑信息弹窗 */}
      <Modal
        title={intl.formatMessage({ id: 'editOrgInfo' })}
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={handleEditCancel}
        width={600}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" initialValues={orgData}>
          <Form.Item name="avatar" label={intl.formatMessage({ id: 'orgLogo' })}>
            <Spin spinning={uploadState.loading}>
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={handleFileChange}
                beforeUpload={beforeUpload}
                maxCount={1}
                customRequest={customUpload}
                showUploadList={true}
              >
                {fileList.length === 0 && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>{intl.formatMessage({ id: 'upload' })}</div>
                  </div>
                )}
              </Upload>
            </Spin>
          </Form.Item>
          <Form.Item
            name="contact"
            label={intl.formatMessage({ id: 'contactPerson' })}
            rules={[{ required: true}]}
          >
            <Input/>
          </Form.Item>

          <Form.Item
            name="phone"
            label={intl.formatMessage({ id: 'contactNumber' })}
            rules={[
              { required: true},
              // { pattern: /^1\d{10}$/, message: intl.formatMessage({ id: 'enterValidPhone' }) },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label={intl.formatMessage({ id: 'email' })}
            rules={[
              { required: true },
              { type: 'email', message: intl.formatMessage({ id: 'enterValidEmail' }) },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label={intl.formatMessage({ id: 'orgDescription' })}>
            <TextArea rows={4}/>
          </Form.Item>
        </Form>
      </Modal>

      {/* 生成密钥对对话框 */}
      <Modal
        title="生成密钥对"
        open={keyPairModalVisible}
        onCancel={() => {
          setKeyPairModalVisible(false);
          setKeyPairResult(null);
        }}
        footer={
          keyPairResult
            ? [
              <Button
                key="close"
                onClick={() => {
                  setKeyPairModalVisible(false);
                  setKeyPairResult(null);
                }}
              >
                关闭
              </Button>,
            ]
            : [
              <Button key="cancel" onClick={() => setKeyPairModalVisible(false)}>
                取消
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={generatingKeyPair}
                onClick={handleGenerateKeyPair}
              >
                生成
              </Button>,
            ]
        }
        width={600}
      >
        {!keyPairResult ? (
          <div>
            <p>生成密钥对用于API访问和应用认证，请妥善保存生成的私钥。</p>
            <p className={styles.warningText}>注意：私钥仅显示一次，请及时保存。</p>
          </div>
        ) : (
          <div className={styles.keyPairResult}>
            <div className={styles.keyItem}>
              <div className={styles.keyLabel}>公钥：</div>
              <div className={styles.keyValue}>
                <Input.TextArea rows={3} value={keyPairResult.publicKey} readOnly />
                <Button
                  type="link"
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(keyPairResult.publicKey)}
                >
                  复制
                </Button>
              </div>
            </div>
            <div className={styles.keyItem}>
              <div className={styles.keyLabel}>私钥：</div>
              <div className={styles.keyValue}>
                <Input.TextArea rows={3} value={keyPairResult.privateKey} readOnly />
                <Button
                  type="link"
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(keyPairResult.privateKey)}
                >
                  复制
                </Button>
              </div>
            </div>
            <Alert message="请妥善保存私钥，私钥不会再次显示" type="warning" showIcon />
          </div>
        )}
      </Modal>
      {createPortal(
        <SelectUserModal
          selectModalOptions={{
            ...selectUserModalOptions,
            open: selectUserModalOptions.open,
            disabledData: groupManagerList.list.map(v => v.user_id)
          }}
          // filterIds={groupManagerList.map(v=>v.user_id)}
          closeSelectModal={closeSelectUserModal}
          selectedCallBack={handleUserSelected}
        />,
        document.body,
      )}
    </PageContainer>
  );
};

export default OrganizationDetail;
