import { createOrUpdateDailyRewardConfig, deleteDailyRewardConfig, getDailyRewardConfig } from '@/services/checkin';
import { getWalletBalance } from '@/services/wallet';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Card, Col, Form, InputNumber, message, Row, Select, Spin, Switch, Space, Empty } from 'antd';
import { useEffect, useState } from 'react';

const DailyRewardConfig = () => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [enabled, setEnabled] = useState(false);

  // 获取货币列表
  const fetchCurrencies = async () => {
    try {
      const response = await getWalletBalance();
      if (response?.data?.wallet_balance) {
        const currencyList = response.data.wallet_balance.map((item: any) => ({
          id: item.currency_id,
          name: item.wallet_currency.name,
          icon: item.wallet_currency.icon,
          decimals: item.wallet_currency.decimals,
        }));
        setCurrencies(currencyList);
      }
    } catch (error) {
      console.error('获取货币列表失败:', error);
    }
  };

  // 获取当前配置
  const fetchCurrentConfig = async () => {
    setLoading(true);
    try {
      const response = await getDailyRewardConfig();
      if (response?.data) {
        const config = response.data;
        setEnabled(true);
        form.setFieldsValue({
          reward_id: config.reward_id,
          reward_amount: parseFloat(config.reward_amount),
        });
      } else {
        setEnabled(false);
        form.resetFields();
      }
    } catch (error) {
      console.error('获取日常签到奖励配置失败:', error);
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  // 保存配置
  const handleSave = async (values: any) => {
    setSubmitting(true);
    try {
      await createOrUpdateDailyRewardConfig({
        type: 'cash', // 固定为现金类型
        reward_id: values.reward_id,
        reward_amount: values.reward_amount,
      });
      message.success(intl.formatMessage({ id: 'component.message.saveSuccess', defaultMessage: '保存成功' }));
      fetchCurrentConfig();
    } catch (error) {
      console.error('保存日常签到奖励配置失败:', error);
      message.error(intl.formatMessage({ id: 'component.message.saveFailed', defaultMessage: '保存失败' }));
    } finally {
      setSubmitting(false);
    }
  };

  // 删除配置（关闭功能）
  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await deleteDailyRewardConfig();
      message.success(intl.formatMessage({ id: 'pages.checkIn.dailyRewardConfig.disableSuccess', defaultMessage: '已关闭日常签到奖励' }));
      setEnabled(false);
      form.resetFields();
    } catch (error) {
      console.error('关闭日常签到奖励失败:', error);
      message.error(intl.formatMessage({ id: 'component.message.operationFailed', defaultMessage: '操作失败' }));
    } finally {
      setSubmitting(false);
    }
    return true;
  };

  // 切换开关
  const handleToggle = async (checked: boolean) => {
    if (!checked) {
      // 关闭功能
      await handleDelete();
    } else {
      // 开启功能（显示表单）
      setEnabled(true);
    }
  };

  useEffect(() => {
    fetchCurrencies();
    fetchCurrentConfig();
  }, []);

  return (
    <PageContainer>
      <Spin spinning={loading}>
        <Card
          title={
            <Space>
              <span>{intl.formatMessage({ id: 'menu.IM.CheckIn.DailyRewardConfig', defaultMessage: '日常签到奖励配置' })}</span>
              <Switch
                checked={enabled}
                onChange={handleToggle}
                checkedChildren={intl.formatMessage({ id: 'component.switch.enabled', defaultMessage: '已开启' })}
                unCheckedChildren={intl.formatMessage({ id: 'component.switch.disabled', defaultMessage: '已关闭' })}
                loading={submitting}
              />
            </Space>
          }
          extra={
            <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666' }}>
              {intl.formatMessage({ id: 'pages.checkIn.dailyRewardConfig.description', defaultMessage: '配置用户每日签到时获得的奖励，目前仅支持余额奖励类型' })}
            </span>
          }
        >
          {enabled ? (
            <Form
              form={form}
              onFinish={handleSave}
              layout="vertical"
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="reward_id"
                    label={intl.formatMessage({ id: 'pages.checkIn.dailyRewardConfig.rewardCurrency', defaultMessage: '奖励货币' })}
                    rules={[{ required: true, message: intl.formatMessage({ id: 'pages.checkIn.dailyRewardConfig.pleaseSelectCurrency', defaultMessage: '请选择奖励货币' }) }]}
                  >
                    <Select placeholder={intl.formatMessage({ id: 'pages.checkIn.dailyRewardConfig.selectCurrencyPlaceholder', defaultMessage: '请选择货币类型' })}>
                      {currencies.map(currency => (
                        <Select.Option key={currency.id} value={currency.id}>
                          {currency.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="reward_amount"
                    label={intl.formatMessage({ id: 'pages.checkIn.dailyRewardConfig.rewardAmount', defaultMessage: '奖励金额' })}
                    rules={[
                      { required: true, message: intl.formatMessage({ id: 'pages.checkIn.dailyRewardConfig.pleaseEnterAmount', defaultMessage: '请输入奖励金额' }) },
                      {
                        type: 'number',
                        min: 0.01,
                        message: intl.formatMessage({ id: 'pages.checkIn.dailyRewardConfig.amountMustBePositive', defaultMessage: '金额必须大于0' })
                      },
                      {
                        validator: (_, value) => {
                          if (value && String(value).indexOf('.') > -1) {
                            const decimalPart = String(value).split('.')[1];
                            if (decimalPart && decimalPart.length > 2) {
                              return Promise.reject(intl.formatMessage({
                                id: 'pages.checkIn.dailyRewardConfig.maxTwoDecimals',
                                defaultMessage: '金额最多保留两位小数'
                              }));
                            }
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <InputNumber
                      min={0.01}
                      precision={2}
                      style={{ width: '100%' }}
                      placeholder={intl.formatMessage({ id: 'pages.checkIn.dailyRewardConfig.enterAmountPlaceholder', defaultMessage: '请输入金额' })}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  {intl.formatMessage({ id: 'pages.checkIn.dailyRewardConfig.saveConfig', defaultMessage: '保存配置' })}
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <Empty
              description={intl.formatMessage({ id: 'pages.checkIn.dailyRewardConfig.functionDisabled', defaultMessage: '日常签到奖励功能已关闭，请开启开关以配置' })}
              style={{ padding: '40px 0' }}
            />
          )}
        </Card>
      </Spin>
    </PageContainer>
  );
};

export default DailyRewardConfig;