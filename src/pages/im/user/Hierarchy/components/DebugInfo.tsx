import React, { useState, useEffect } from 'react';
import { Card, Collapse, Typography, Button, Space } from 'antd';
import { CHAT_URL } from '@/config';

const { Panel } = Collapse;
const { Text } = Typography;

const DebugInfo: React.FC = () => {
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<{
    orgId: string | null;
    accountToken: string | null;
    adminToken: string | null;
    baseUrl: string;
  }>({
    orgId: null,
    accountToken: null,
    adminToken: null,
    baseUrl: CHAT_URL,
  });

  useEffect(() => {
    setDebugInfo({
      orgId: localStorage.getItem('OrganizationID'),
      accountToken: localStorage.getItem('IMAccountToken'),
      adminToken: localStorage.getItem('IMAdminToken'),
      baseUrl: CHAT_URL,
    });
  }, []);

  const refreshDebugInfo = () => {
    setDebugInfo({
      orgId: localStorage.getItem('OrganizationID'),
      accountToken: localStorage.getItem('IMAccountToken'),
      adminToken: localStorage.getItem('IMAdminToken'),
      baseUrl: CHAT_URL,
    });
  };

  if (!showDebug) {
    return (
      <Button
        type="link"
        onClick={() => setShowDebug(true)}
        style={{ marginBottom: 16 }}
      >
        显示调试信息
      </Button>
    );
  }

  return (
    <Card title="调试信息" size="small" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button type="link" onClick={() => setShowDebug(false)}>隐藏调试信息</Button>
        <Button type="primary" size="small" onClick={refreshDebugInfo}>
          刷新调试信息
        </Button>

        <Collapse>
          <Panel header="认证信息" key="1">
            <p><Text strong>组织ID: </Text> {debugInfo.orgId || '未设置'}</p>
            <p>
              <Text strong>账号Token: </Text>
              {debugInfo.accountToken
                ? `${debugInfo.accountToken.substring(0, 10)}...${debugInfo.accountToken.substring(debugInfo.accountToken.length - 10)}`
                : '未设置'
              }
            </p>
            <p>
              <Text strong>管理员Token: </Text>
              {debugInfo.adminToken
                ? `${debugInfo.adminToken.substring(0, 10)}...${debugInfo.adminToken.substring(debugInfo.adminToken.length - 10)}`
                : '未设置'
              }
            </p>
          </Panel>

          <Panel header="API配置" key="2">
            <p><Text strong>API基础URL: </Text> {debugInfo.baseUrl}</p>
            <p><Text strong>API示例路径: </Text> {`${debugInfo.baseUrl}/third_admin/hierarchy/tree`}</p>
            <p>
              <Text strong>请求头: </Text>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify({
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'operationID': '示例ID',
                  'isAccount': 'true',
                  'token': debugInfo.accountToken ? `${debugInfo.accountToken.substring(0, 10)}...` : '未设置',
                  'orgId': debugInfo.orgId,
                  'organizationId': debugInfo.orgId,
                  'OrganizationID': debugInfo.orgId,
                }, null, 2)}
              </pre>
            </p>
          </Panel>
        </Collapse>
      </Space>
    </Card>
  );
};

export default DebugInfo;