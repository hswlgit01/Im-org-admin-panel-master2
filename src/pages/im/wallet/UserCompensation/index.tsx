import { useState } from 'react';
import { useIntl } from '@umijs/max';
import { Card, Input, Button, Table, Form, Space, message, Modal, InputNumber } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import {
  getUserCompensationBalance,
  adjustUserCompensationBalance,
  UserCompensationBalance,
  AdjustUserCompensationBalanceParams
} from '@/services/compensation';

const UserCompensationPage: React.FC = () => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [userBalance, setUserBalance] = useState<UserCompensationBalance | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // 查询用户补偿金余额
  const handleSearch = async () => {
    try {
      const values = await searchForm.validateFields();
      if (!values.user_id || !values.currency_id) {
        message.warning(intl.formatMessage({
          id: 'pages.userCompensation.inputRequired',
          defaultMessage: '请输入用户ID和币种ID',
        }));
        return;
      }

      setLoading(true);
      const result = await getUserCompensationBalance({
        user_id: values.user_id,
        currency_id: values.currency_id,
      });

      // 添加调试输出
      console.log('用户补偿金余额API响应:', JSON.stringify(result, null, 2));

      // 处理嵌套的data结构
      if (result && result.data && result.errCode === 0) {
        setUserBalance(result.data);
      } else if (result && result.data && result.code === 0) {
        // 兼容旧格式
        setUserBalance(result.data);
      } else if (result && result.data && !result.code && !result.errCode) {
        // 兼容直接返回data的情况
        setUserBalance(result.data);
      } else {
        setUserBalance(null);
        message.info(intl.formatMessage({
          id: 'pages.userCompensation.notFound',
          defaultMessage: '未找到用户补偿金余额信息',
        }));
      }
    } catch (error) {
      console.error('Failed to fetch user compensation balance:', error);
      message.error(intl.formatMessage({
        id: 'pages.userCompensation.fetchFailed',
        defaultMessage: '获取用户补偿金余额失败',
      }));
    } finally {
      setLoading(false);
    }
  };

  // 显示调整余额对话框
  const showAdjustModal = () => {
    if (!userBalance) {
      message.warning(intl.formatMessage({
        id: 'pages.userCompensation.noUserSelected',
        defaultMessage: '请先查询用户补偿金余额',
      }));
      return;
    }

    form.resetFields();
    setModalVisible(true);
  };

  // 调整用户补偿金余额
  const handleAdjust = async () => {
    try {
      if (!userBalance) {
        return;
      }

      const values = await form.validateFields();
      const params: AdjustUserCompensationBalanceParams = {
        user_id: userBalance.user_id,
        currency_id: userBalance.currency_id,
        amount: values.amount.toString(),
        reason: values.reason,
      };

      await adjustUserCompensationBalance(params);
      message.success(intl.formatMessage({
        id: 'pages.userCompensation.adjustSuccess',
        defaultMessage: '调整用户补偿金余额成功',
      }));

      // 关闭对话框并刷新数据
      setModalVisible(false);
      handleSearch();
    } catch (error) {
      console.error('Failed to adjust user compensation balance:', error);
      message.error(intl.formatMessage({
        id: 'pages.userCompensation.adjustFailed',
        defaultMessage: '调整用户补偿金余额失败',
      }));
    }
  };

  const columns = [
    {
      title: intl.formatMessage({
        id: 'pages.userCompensation.userId',
        defaultMessage: '用户ID',
      }),
      dataIndex: 'user_id',
      key: 'user_id',
    },
    {
      title: intl.formatMessage({
        id: 'pages.userCompensation.username',
        defaultMessage: '用户名',
      }),
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: intl.formatMessage({
        id: 'pages.userCompensation.walletId',
        defaultMessage: '钱包ID',
      }),
      dataIndex: 'wallet_id',
      key: 'wallet_id',
    },
    {
      title: intl.formatMessage({
        id: 'pages.userCompensation.currencyId',
        defaultMessage: '币种ID',
      }),
      dataIndex: 'currency_id',
      key: 'currency_id',
    },
    {
      title: intl.formatMessage({
        id: 'pages.userCompensation.currencyName',
        defaultMessage: '币种名称',
      }),
      dataIndex: 'currency_name',
      key: 'currency_name',
    },
    {
      title: intl.formatMessage({
        id: 'pages.userCompensation.compensationBalance',
        defaultMessage: '补偿金余额',
      }),
      dataIndex: 'compensation_balance',
      key: 'compensation_balance',
    },
  ];

  return (
    <PageContainer
      header={{
        title: intl.formatMessage({
          id: 'pages.userCompensation.title',
          defaultMessage: '用户补偿金余额管理',
        }),
      }}
    >
      <Card>
        <Form form={searchForm} layout="inline" style={{ marginBottom: 24 }}>
          <Form.Item
            name="user_id"
            label={intl.formatMessage({
              id: 'pages.userCompensation.userId',
              defaultMessage: '用户ID',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.userCompensation.userIdRequired',
                  defaultMessage: '请输入用户ID',
                }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({
                id: 'pages.userCompensation.userIdPlaceholder',
                defaultMessage: '请输入用户ID',
              })}
              style={{ width: 250 }}
            />
          </Form.Item>
          <Form.Item
            name="currency_id"
            label={intl.formatMessage({
              id: 'pages.userCompensation.currencyId',
              defaultMessage: '币种ID',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.userCompensation.currencyIdRequired',
                  defaultMessage: '请输入币种ID',
                }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({
                id: 'pages.userCompensation.currencyIdPlaceholder',
                defaultMessage: '请输入币种ID',
              })}
              style={{ width: 250 }}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSearch} loading={loading}>
              {intl.formatMessage({
                id: 'pages.userCompensation.search',
                defaultMessage: '查询',
              })}
            </Button>
          </Form.Item>
        </Form>

        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={showAdjustModal} disabled={!userBalance}>
            {intl.formatMessage({
              id: 'pages.userCompensation.adjustBalance',
              defaultMessage: '调整补偿金余额',
            })}
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={userBalance ? [userBalance] : []}
          loading={loading}
          rowKey="user_id"
          pagination={false}
        />

        <Modal
          title={intl.formatMessage({
            id: 'pages.userCompensation.adjustBalance',
            defaultMessage: '调整补偿金余额',
          })}
          open={modalVisible}
          onOk={handleAdjust}
          onCancel={() => setModalVisible(false)}
          destroyOnClose
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="amount"
              label={intl.formatMessage({
                id: 'pages.userCompensation.adjustAmount',
                defaultMessage: '调整金额（正数增加，负数减少）',
              })}
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'pages.userCompensation.amountRequired',
                    defaultMessage: '请输入调整金额',
                  }),
                },
              ]}
            >
              <InputNumber
                placeholder={intl.formatMessage({
                  id: 'pages.userCompensation.amountPlaceholder',
                  defaultMessage: '请输入调整金额',
                })}
                style={{ width: '100%' }}
                precision={2}
              />
            </Form.Item>
            <Form.Item
              name="reason"
              label={intl.formatMessage({
                id: 'pages.userCompensation.adjustReason',
                defaultMessage: '调整原因',
              })}
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'pages.userCompensation.reasonRequired',
                    defaultMessage: '请输入调整原因',
                  }),
                },
              ]}
            >
              <Input.TextArea
                placeholder={intl.formatMessage({
                  id: 'pages.userCompensation.reasonPlaceholder',
                  defaultMessage: '请输入调整原因',
                })}
                rows={4}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </PageContainer>
  );
};

export default UserCompensationPage;