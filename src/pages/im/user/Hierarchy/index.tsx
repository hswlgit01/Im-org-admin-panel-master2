import { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Row, Col, Space, Spin, Alert, Button } from 'antd';
import { useIntl, useRequest, history } from '@umijs/max';
import { getHierarchyTree, getHierarchyDetail } from '@/services/hierarchy';
import HierarchyTree from './components/HierarchyTree';
import UserDetail from './components/UserDetail';
import DirectDownline from './components/DirectDownline';
import SearchUser from './components/SearchUser';
import { getStoredOrganizationId } from '@/utils/organization';

const Hierarchy: React.FC = () => {
  const intl = useIntl();
  const [selectedUser, setSelectedUser] = useState<API.Hierarchy.UserHierarchyInfo | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [hasOrgId, setHasOrgId] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [processedTreeData, setProcessedTreeData] = useState<any>(null); // 存储处理后的树数据

  // 初始化组件状态

  // 检查组织ID是否存在
  useEffect(() => {
    const orgId = getStoredOrganizationId();
    setHasOrgId(!!orgId);
    setLoading(false);
  }, []);

  // 简化的获取层级树数据方法 - 直接返回原始响应
  const { data: apiResponse, loading: treeLoading, error: treeError } = useRequest(
    getHierarchyTree,
    {
      onSuccess: (res) => {
        console.log("【关键调试】API响应原始数据:", res ? JSON.stringify(res, null, 2) : '无响应');
      }
    }
  );

  // 从API响应中提取树数据并进行处理
  useEffect(() => {
    console.log("【关键调试】useEffect触发, apiResponse类型:", apiResponse ? typeof apiResponse : '无数据');

    let treeData = null;

    // 处理已发现的直接返回根节点对象的格式 {root: {...}}
    if (apiResponse && apiResponse.root && apiResponse.root.user_id) {
      console.log("【处理】从API响应中直接提取root对象");
      treeData = apiResponse.root;
    }
    // 处理标准的层级树响应格式 {errCode: 0, data: {root: {...}}}
    else if (apiResponse && apiResponse.errCode === 0 && apiResponse.data && apiResponse.data.root) {
      console.log("【处理】从标准API响应中提取层级树数据 (data.root)");
      treeData = apiResponse.data.root;
    }
    // 处理用户列表格式 {errCode: 0, data: {users: [...]}}
    else if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data.users) && apiResponse.data.users.length > 0) {
      console.log("【处理】从用户列表响应中提取层级树数据 (data.users[0])");
      treeData = apiResponse.data.users[0];
    }
    // 可能API直接返回根节点本身
    else if (apiResponse && apiResponse.user_id) {
      console.log("【处理】API直接返回了根节点对象");
      treeData = apiResponse;
    }

    // 检查是否成功提取到数据
    if (treeData) {
      console.log("【处理】提取到树数据:", {
        user_id: treeData.user_id,
        nickname: treeData.nickname,
        level: treeData.level
      });

      // 确保数据有children属性
      const dataWithChildren = {...treeData};
      if (!dataWithChildren.hasOwnProperty('children')) {
        dataWithChildren.children = [];
        console.log("【处理】为根节点添加空children数组");
      }

      // 更新处理后的树数据
      setProcessedTreeData(dataWithChildren);
      console.log("【处理】成功设置processedTreeData:", dataWithChildren.user_id);

      // 自动选择根节点
      if (dataWithChildren.user_id && !selectedUserId) {
        setSelectedUserId(dataWithChildren.user_id);
        console.log("【处理】已选择根节点:", dataWithChildren.user_id);
      }
    } else {
      console.warn("【错误】未能从API响应中提取有效的树数据:", apiResponse);
    }
  }, [apiResponse]); // 移除selectedUserId依赖，避免选择用户时触发树数据重新处理

  // Fetch user detailed info when a user is selected
  const { loading: userLoading } = useRequest(
    () => getHierarchyDetail({ user_id: selectedUserId as string })
      .then(res => {
        // 检查响应格式并提取正确的数据
        let userData = null;

        // 处理多种可能的API响应格式
        if (res && res.data && res.data.user) {
          // 如果数据在data.user中
          userData = res.data.user;
        } else if (res && res.data) {
          // 如果数据直接在data中
          userData = res.data;
        } else if (res && res.user_id) {
          // 如果数据在顶层对象中
          userData = res;
        }

        setSelectedUser(userData);
        return userData;
      }),
    {
      refreshDeps: [selectedUserId],
      ready: !!selectedUserId,
    }
  );

  // Handle user selection from tree
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
  };

  // Handle user selection from search
  const handleSearchSelect = (user: API.Hierarchy.UserHierarchyInfo) => {
    setSelectedUser(user);
    setSelectedUserId(user.user_id);
  };

  // 重定向到登录页
  const handleLogin = () => {
    history.push('/login');
  };

  if (loading) {
    return (
      <PageContainer>
        <Spin size="large" />
      </PageContainer>
    );
  }

  // 如果没有组织ID，显示警告
  if (!hasOrgId) {
    return (
      <PageContainer>
        <Alert
          message="登录信息缺失"
          description="无法获取组织信息，请重新登录系统。"
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={handleLogin}>
              去登录
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={intl.formatMessage({ id: 'pages.hierarchyManagement.title', defaultMessage: '层级管理' })}
      content={intl.formatMessage({ id: 'pages.hierarchyManagement.description', defaultMessage: '查看和管理组织中的用户层级关系' })}
    >
      <Row gutter={16}>
        {/* Left side - Hierarchy Tree */}
        <Col span={8}>
          <Card
            title={intl.formatMessage({ id: 'pages.hierarchyManagement.tree.title', defaultMessage: '层级树' })}
            bordered={false}
            style={{ height: 'calc(100vh - 220px)', overflowY: 'auto' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <SearchUser onUserSelect={handleSearchSelect} />
              {treeLoading ? (
                <Spin />
              ) : treeError ? (
                <Alert
                  message="获取层级树失败"
                  description={`错误详情: ${treeError.message || JSON.stringify(treeError)}`}
                  type="error"
                  showIcon
                />
              ) : (
                <>
                  {/* 传递数据前的详细检查 */}
                  {console.log("【关键检查】传递到HierarchyTree之前的数据:",
                    processedTreeData ? {
                      user_id: processedTreeData.user_id,
                      hasChildren: processedTreeData.hasOwnProperty('children'),
                      childrenIsArray: Array.isArray(processedTreeData.children),
                      stateValue: processedTreeData === null ? 'null' : 'object'
                    } : '无数据')}

                  {processedTreeData ? (
                    <HierarchyTree
                      treeData={processedTreeData}
                      onUserSelect={handleUserSelect}
                      selectedUserId={selectedUserId}
                      treeError={treeError}
                      treeLoading={treeLoading}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Spin>
                        <div style={{ padding: '30px' }}>
                          <p>处理层级数据中...</p>
                        </div>
                      </Spin>
                    </div>
                  )}
                </>
              )}
            </Space>
          </Card>
        </Col>

        {/* Right side - User Details and Direct Downline */}
        <Col span={16}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* User Details */}
            <Card
              title={intl.formatMessage({ id: 'pages.hierarchyManagement.userDetail.title', defaultMessage: '用户详情' })}
              bordered={false}
              loading={userLoading}
            >
              {selectedUser ? (
                <UserDetail user={selectedUser} />
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  {intl.formatMessage({ id: 'pages.hierarchyManagement.userDetail.placeholder', defaultMessage: '请从层级树中选择一个用户查看详情' })}
                </div>
              )}
            </Card>

            {/* Direct Downline List */}
            <Card
              title={intl.formatMessage({ id: 'pages.hierarchyManagement.directDownline.title', defaultMessage: '直接下级' })}
              bordered={false}
              style={{ height: 'calc(100vh - 460px)', overflowY: 'auto' }}
            >
              {selectedUserId ? (
                <DirectDownline userId={selectedUserId} />
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  {intl.formatMessage({ id: 'pages.hierarchyManagement.directDownline.placeholder', defaultMessage: '请从层级树中选择一个用户查看其直接下级' })}
                </div>
              )}
            </Card>
          </Space>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default Hierarchy;
