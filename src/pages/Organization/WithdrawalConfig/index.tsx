import { PageContainer } from '@ant-design/pro-components';
import { Card, Form, InputNumber, Switch, Button, message, Space, Divider, Alert } from 'antd';
import { useEffect, useState } from 'react';
import { getWithdrawalRule, saveWithdrawalRule } from './services';

interface WithdrawalRuleConfig {
  isEnabled: boolean;
  minAmount: number;
  maxAmount: number;
  amountStep: number;
  feeFixed: number;
  feeRate: number;
  needRealName: boolean;
  needBindAccount: boolean;
}

const WithdrawalConfig = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // 加载配置
  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await getWithdrawalRule();
      const data = response.data || response; // 兼容不同的返回格式
      form.setFieldsValue({
        isEnabled: data.isEnabled ?? false,
        minAmount: data.minAmount ?? 5.0,
        maxAmount: data.maxAmount ?? 50000.0,
        amountStep: data.amountStep ?? 0,
        feeFixed: data.feeFixed ?? 5.0,
        feeRate: data.feeRate ?? 1.0,
        needRealName: data.needRealName ?? true,
        needBindAccount: data.needBindAccount ?? true,
      });
    } catch (error: any) {
      message.error(error.message || '加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // 保存配置
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // 验证最大金额必须大于最小金额
      if (values.maxAmount <= values.minAmount) {
        message.error('最大提现金额必须大于最小提现金额');
        return;
      }

      // 步长与起提金额必须自洽：若起提金额本身不是步长的整数倍，
      // 用户将永远无法提出最小金额（例如起提 150、步长 100，
      // 150 不合步长、200 才合法，起提额形同虚设）。
      const step = values.amountStep ?? 0;
      if (step > 0) {
        const minCents = Math.round(values.minAmount * 100);
        const stepCents = Math.round(step * 100);
        if (minCents % stepCents !== 0) {
          message.error(
            `最小提现金额（${values.minAmount}）必须是金额步长（${step}）的整数倍，否则用户无法提出最小金额`,
          );
          return;
        }
      }

      setSaveLoading(true);
      await saveWithdrawalRule(values);
      message.success('保存成功');
      loadConfig(); // 重新加载配置
    } catch (error: any) {
      if (error.errorFields) {
        message.error('请检查表单填写是否正确');
      } else {
        message.error(error.message || '保存失败');
      }
    } finally {
      setSaveLoading(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    loadConfig();
  };

  return (
    <PageContainer>
      <Card loading={loading}>
        <Alert
          message="提现配置说明"
          description={
            <div>
              <p>• 提现功能开关：控制用户是否可以发起提现申请</p>
              <p>• 金额限制：设置单次提现的最小和最大金额</p>
              <p>• 手续费设置：固定手续费 + 按比例收取的手续费</p>
              <p>• 实名认证：要求用户必须完成实名认证才能提现</p>
              <p>• 收款账户绑定：要求用户必须绑定收款账户才能提现</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            isEnabled: false,
            minAmount: 5.0,
            maxAmount: 50000.0,
            amountStep: 0,
            feeFixed: 5.0,
            feeRate: 1.0,
            needRealName: true,
            needBindAccount: true,
          }}
        >
          <Divider orientation="left">基础配置</Divider>

          <Form.Item
            label="启用提现功能"
            name="isEnabled"
            valuePropName="checked"
            extra="关闭后，用户将无法发起提现申请"
          >
            <Switch
              checkedChildren="开启"
              unCheckedChildren="关闭"
            />
          </Form.Item>

          <Form.Item
            label="最小提现金额"
            name="minAmount"
            rules={[
              { required: true, message: '请输入最小提现金额' },
              { type: 'number', min: 0, message: '金额不能小于0' },
            ]}
            extra="用户单次提现的最小金额（单位：元）"
          >
            <InputNumber
              style={{ width: 300 }}
              min={0}
              precision={2}
              addonBefore="¥"
              placeholder="请输入最小提现金额"
            />
          </Form.Item>

          <Form.Item
            label="最大提现金额"
            name="maxAmount"
            rules={[
              { required: true, message: '请输入最大提现金额' },
              { type: 'number', min: 0, message: '金额不能小于0' },
            ]}
            extra="用户单次提现的最大金额（单位：元）"
          >
            <InputNumber
              style={{ width: 300 }}
              min={0}
              precision={2}
              addonBefore="¥"
              placeholder="请输入最大提现金额"
            />
          </Form.Item>

          <Form.Item
            label="金额步长"
            name="amountStep"
            rules={[{ type: 'number', min: 0, message: '步长不能小于0' }]}
            extra="提现金额必须是该值的整数倍。填 0 表示不限制；填 100 即「只能整百提」。需与最小提现金额自洽（如起提 200 + 步长 100）"
          >
            <InputNumber
              style={{ width: 300 }}
              min={0}
              precision={2}
              addonBefore="¥"
              placeholder="0 表示不限制"
            />
          </Form.Item>

          <Divider orientation="left">手续费配置</Divider>

          <Form.Item
            label="固定手续费"
            name="feeFixed"
            rules={[
              { required: true, message: '请输入固定手续费' },
              { type: 'number', min: 0, message: '手续费不能小于0' },
            ]}
            extra="每笔提现固定收取的手续费（单位：元）"
          >
            <InputNumber
              style={{ width: 300 }}
              min={0}
              precision={2}
              addonBefore="¥"
              placeholder="请输入固定手续费"
            />
          </Form.Item>

          <Form.Item
            label="手续费比例"
            name="feeRate"
            rules={[
              { required: true, message: '请输入手续费比例' },
              { type: 'number', min: 0, max: 100, message: '比例范围：0-100' },
            ]}
            extra="按提现金额比例收取的手续费，例如：1% 表示提现100元收取1元手续费"
          >
            <InputNumber
              style={{ width: 300 }}
              min={0}
              max={100}
              precision={2}
              addonAfter="%"
              placeholder="请输入手续费比例"
            />
          </Form.Item>

          <Alert
            message="手续费计算公式"
            description={
              <div>
                <p style={{ marginBottom: 8 }}>
                  总手续费 = <strong>固定手续费</strong> + 提现金额 × <strong>手续费比例</strong>
                </p>
                <p style={{ marginBottom: 0, color: '#666' }}>
                  示例：固定手续费5元，比例1%，提现1000元时：
                  <br />
                  总手续费 = 5 + 1000 × 1% = 5 + 10 = 15元
                  <br />
                  实际到账 = 1000 - 15 = 985元
                </p>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginTop: 16, marginBottom: 24 }}
          />

          <Divider orientation="left">验证配置</Divider>

          <Form.Item
            label="需要实名认证"
            name="needRealName"
            valuePropName="checked"
            extra="开启后，用户必须完成实名认证才能发起提现申请"
          >
            <Switch
              checkedChildren="是"
              unCheckedChildren="否"
            />
          </Form.Item>

          <Form.Item
            label="需要绑定收款账户"
            name="needBindAccount"
            valuePropName="checked"
            extra="开启后，用户必须先绑定收款账户（银行卡/支付宝/微信）才能发起提现申请"
          >
            <Switch
              checkedChildren="是"
              unCheckedChildren="否"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32 }}>
            <Space size="middle">
              <Button
                type="primary"
                onClick={handleSave}
                loading={saveLoading}
                size="large"
              >
                保存配置
              </Button>
              <Button onClick={handleReset} size="large">
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default WithdrawalConfig;
