import {
  addWebhook,
  deleteWebhook,
  getWebhookList,
  getWebhookTriggerList,
  updateWebhookStatus,
} from '@/services/webhook';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const triggerObj = {
  recharge: '充值',
  transfer: '转账',
};

const WebhookPage = () => {
  const [status, setStatus] = useState<string>('全部');
  const [loading, setLoading] = useState<boolean>(false);
  const [webhookList, setWebhookList] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [currentWebhook, setCurrentWebhook] = useState<any>(null);
  const [searchValue, setSearchValue] = useState<string>('');
  const [form] = Form.useForm();
  const [webhookTriggerList, setWebhookTriggerList] = useState<any[]>([]);

  const fetchWebhookList = async () => {
    setLoading(true);
    try {
      const params: any = {
        organization_id: localStorage.getItem('OrganizationID') || '',
      };

      // 添加关键词筛选
      if (searchValue) {
        params.keyword = searchValue;
      }

      // 添加状态筛选
      if (status !== '全部') {
        params.status = status === '启用' ? true : false;
      }

      const res = await getWebhookList(params);
      setLoading(false);

      if (res?.data) {
        setWebhookList(res.data.data);
      } else {
        setWebhookList([]);
        console.error('Webhook列表数据格式错误', res?.data);
      }
    } catch (error) {
      console.error('获取Webhook列表失败', error);
      setWebhookList([]);
    }
    setLoading(false);
  };

  // 获取Webhook事件类型
  const fetchWebhookTriggerList = async () => {
    const { data } = await getWebhookTriggerList();
    const triggerList = data.map((item: string) => ({
      label: triggerObj[item as keyof typeof triggerObj] || item,
      value: item,
    }));
    console.log('triggerList', triggerList);
    setWebhookTriggerList(triggerList);
  };

  useEffect(() => {
    fetchWebhookList();
    fetchWebhookTriggerList();
  }, []);

  // 处理搜索输入变化
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    console.log('searchValue', searchValue);
  };

  // 处理搜索按钮点击或回车
  const handleSearch = () => {
    fetchWebhookList();
  };

  // 处理清除搜索内容
  const handleClear = () => {
    setSearchValue('');
    fetchWebhookList();
  };

  // 当状态变化时重新获取列表
  useEffect(() => {
    fetchWebhookList();
  }, [status]);

  const showModal = (webhook?: any) => {
    setCurrentWebhook(webhook || null);
    if (webhook) {
      form.setFieldsValue(webhook);
      form.setFieldsValue({
        webhook_event: webhook.webhook_trigger_event.map((item: any) => item.event),
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setCurrentWebhook(null);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('表单提交的值:', values);
      if (currentWebhook) {
        const res = await updateWebhookStatus({
          ...values,
          webhook_id: currentWebhook.id,
        });
        if (res?.errCode === 0) {
          message.success('Webhook更新成功');
          setIsModalVisible(false);
          form.resetFields();
          fetchWebhookList();
        }
      } else {
        const res = await addWebhook({
          ...values,
        });
        if (res?.errCode === 0) {
          message.success('Webhook添加成功');
          setIsModalVisible(false);
          form.resetFields();
          fetchWebhookList();
        }
      }
    } catch (error) {
      console.error('表单验证失败', error);
    }
  };

  // 处理状态变更
  const handleStatusChange = async (checked: boolean, record: any) => {
    console.log('record', record);
    const eventList = record.webhook_trigger_event.map((item: any) => item.event);
    try {
      const res = await updateWebhookStatus({
        webhook_id: record.id,
        status: checked,
        url: record.url,
        webhook_event: eventList,
      });
      if (res?.errCode === 0) {
        message.success(`Webhook状态已${checked ? '启用' : '禁用'}`);
        fetchWebhookList();
      }
    } catch (error) {
      console.error('更新Webhook状态失败', error);
    }
  };

  // 处理删除Webhook
  const handleDelete = async (record: any) => {
    try {
      const res = await deleteWebhook({
        webhook_id: record.id,
      });
      if (res?.errCode === 0) {
        message.success('Webhook删除成功');
        fetchWebhookList();
      }
    } catch (error) {
      console.error('删除Webhook失败', error);
    }
  };

  const columns = [
    {
      title: 'WEBHOOK URL',
      dataIndex: 'url',
      key: 'url',
    },
    {
      title: '触发事件',
      dataIndex: 'webhook_trigger_event',
      key: 'webhook_trigger_event',
      render: (list: any) => {
        console.log('list', list);
        return (
          <>
            {list.map((item: any) => (
              <Tag color="blue" key={item.id}>
                {triggerObj[item.event]}
              </Tag>
            ))}
          </>
        );
      },
    },
    // {
    //   title: '请求方式',
    //   dataIndex: 'method',
    //   key: 'method',
    // },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (created_at: string) => {
        console.log('created_at', created_at);
        return created_at ? dayjs(created_at).format('YYYY-MM-DD HH:mm:ss') : '';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: boolean, record: any) => (
        <Switch
          checked={status}
          onChange={(checked) => handleStatusChange(checked, record)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <a className="text-blue-500" onClick={() => showModal(record)}>
            编辑
          </a>
          <Popconfirm
            title="确定要删除此Webhook吗?"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <a className="text-red-500">删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: '',
      }}
    >
      <Spin spinning={loading}>
        <div className="bg-white p-6 rounded-md">
          <div className="flex justify-between mb-4">
            <div className="text-lg font-medium">Webhook管理</div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
              添加Webhook
            </Button>
          </div>

          <div className="flex justify-between mb-4">
            <Input.Search
              placeholder="搜索Webhook"
              prefix={<SearchOutlined />}
              style={{ width: 240 }}
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              onSearch={handleSearch}
              onPressEnter={handleSearch}
            />
            <div>
              <span className="mr-2">状态：</span>
              <select
                className="border rounded-md px-2 py-1"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="全部">全部</option>
                <option value="启用">启用</option>
                <option value="禁用">禁用</option>
              </select>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={webhookList || []}
            pagination={{ position: ['bottomRight'] }}
            rowKey="id"
          />

          <div className="mt-6">
            <div className="text-lg font-medium mb-4">Webhook使用说明</div>
            <div className="bg-blue-50 p-4 rounded-md mb-4 flex items-start">
              <div className="text-blue-500 mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
              <div>
                Webhook允许您的应用程序接收来自我们的实时事件通知。当特定事件发生时，我们会向配置的URL发送HTTP
                Post请求。
              </div>
            </div>

            <div className="mb-4">
              <div className="font-medium mb-2">请求格式</div>
              <div>所有Webhook请求都会包含以下HTTP头：</div>
              <pre className="bg-gray-100 p-3 rounded-md mt-2 overflow-x-auto">
                <code>
                  Content-Type: application/json
                  <br />
                  X-Webhook-Event: {'事件类型'}
                  <br />
                  X-Webhook-Delivery: {'唯一请求ID'}
                </code>
              </pre>
            </div>

            <div>
              <div className="font-medium mb-2">请求体示例</div>
              <pre className="bg-gray-100 p-3 rounded-md mt-2 overflow-x-auto">
                <code>
                  {`{
  "event": "transfer",
  "timestamp": "2025-04-21T08:30:42Z",
  "data": {
    "userID": "u12345",
    "username": "john_doe",
    "email": "john@example.com",
    "registeredAt": "2025-04-21T08:30:42Z"
  }
}`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </Spin>

      {/* 添加/编辑Webhook的Modal表单 */}
      <Modal
        title={currentWebhook ? '编辑Webhook' : '添加Webhook'}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleSubmit}
        maskClosable={false}
        width={600}
        style={{ minHeight: 600 }}
      >
        <Form form={form} layout="vertical" initialValues={{ method: 'POST', status: true }}>
          <Form.Item
            name="url"
            label="Webhook URL"
            rules={[
              { required: true, message: '请输入Webhook URL' },
              { type: 'url', message: '请输入有效的URL地址' },
            ]}
          >
            <Input placeholder="请输入接收事件通知的URL" />
          </Form.Item>

          <Form.Item
            name="webhook_event"
            label="触发事件"
            rules={[{ required: true, message: '请选择至少一个触发事件' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择触发事件"
              options={webhookTriggerList}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default WebhookPage;
