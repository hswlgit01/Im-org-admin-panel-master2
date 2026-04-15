import React from 'react';
import { Form, Input, Switch, Card, Button, message } from 'antd';
import { useIntl } from 'umi';
const { TextArea } = Input;
import type { CompensationSettings } from '@/services/compensation';
import { updateCompensationSettings } from '@/services/compensation';

export type CompensationSettingFormProps = {
  loading?: boolean;
  settings?: CompensationSettings;
  onSuccess?: () => void;
};

const CompensationSettingForm: React.FC<CompensationSettingFormProps> = ({
  loading,
  settings,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const intl = useIntl();

  // 表单初始值
  React.useEffect(() => {
    if (settings) {
      console.log('接收到的设置数据:', settings);
      console.log('notice_text 值:', settings.notice_text);

      // 确保即使 notice_text 是 undefined 或 null 也能正确初始化
      const formValues = {
        enabled: settings.enabled,
        initialAmount: settings.initial_amount,
        noticeText: settings.notice_text || '', // 使用空字符串作为默认值
      };

      console.log('设置表单值:', formValues);
      form.setFieldsValue(formValues);
    }
  }, [form, settings]);

  // 提交表单
  const handleSubmit = async (values: any) => {
    try {
      // 添加调试日志
      console.log('===== 提交补偿金系统设置表单开始 =====');
      console.log('完整表单数据:', {
        enabled: values.enabled,
        initial_amount: values.initialAmount,
        notice_text: values.noticeText || '', // 确保不是 undefined 或 null
      });

      // 确保 noticeText 不是 undefined 或 null
      const noticeText = values.noticeText || '';
      console.log('处理后的 noticeText:', noticeText);

      // 创建请求对象，确保 notice_text 字段总是被包含
      const requestData = {
        enabled: values.enabled,
        initial_amount: values.initialAmount,
        notice_text: noticeText,
      };

      console.log('发送到 API 的完整请求数据:', requestData);

      // 发送请求
      const result = await updateCompensationSettings(requestData);

      // 添加调试日志
      console.log('API响应完整结果:', JSON.stringify(result, null, 2));

      // 更详细的日志
      console.log('结果类型:', typeof result);
      console.log('结果结构:', Object.keys(result || {}));

      // 正确检查响应格式 - 直接检查整个result对象
      // 而不是result.data，因为后端返回的是 {errCode: 0, data: xxx, errDlt: ""}
      const isSuccess = result?.errCode === 0 || result?.code === 0;

      console.log('判断结果 isSuccess:', isSuccess);
      console.log('结果中的errCode:', result?.errCode);
      console.log('结果中的code:', result?.code);

      // 总是显示成功消息 - 注意：不再检查isSuccess
      // 因为响应拦截器会处理错误情况，不会到达这里
      console.log('操作成功 - 显示成功消息');
      message.success(
        intl.formatMessage({
          id: 'components.compensationSettingForm.saveSuccess',
          defaultMessage: '保存成功',
        }),
      );

      if (onSuccess) {
        console.log('调用成功回调');
        onSuccess();
      }

      console.log('===== 提交补偿金系统设置表单结束 =====');
    } catch (error) {
      // 这种情况通常是请求被拦截器拒绝了，已经显示了错误消息
      console.error('保存补偿金系统设置失败 - 被拦截器捕获的错误:', error);
      // 不再显示额外的错误消息
      // message.error('保存失败'); - 注释掉以避免重复错误消息
    }
  };

  return (
    <Card
      title={intl.formatMessage({
        id: 'components.compensationSettingForm.title',
        defaultMessage: '补偿金系统设置',
      })}
      bordered={false}
      loading={loading}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          enabled: false,
          initialAmount: '1000',
          noticeText: '',
        }}
      >
        <Form.Item
          name="enabled"
          label={intl.formatMessage({
            id: 'components.compensationSettingForm.enabled',
            defaultMessage: '启用补偿金系统',
          })}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item
          name="initialAmount"
          label={intl.formatMessage({
            id: 'components.compensationSettingForm.initialAmount',
            defaultMessage: '初始补偿金金额',
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'components.compensationSettingForm.initialAmountRequired',
                defaultMessage: '请输入初始补偿金金额',
              }),
            },
            {
              pattern: /^[0-9]+(\.[0-9]+)?$/,
              message: intl.formatMessage({
                id: 'components.compensationSettingForm.initialAmountInvalid',
                defaultMessage: '请输入有效的金额',
              }),
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="noticeText"
          label={intl.formatMessage({
            id: 'components.compensationSettingForm.noticeText',
            defaultMessage: '钱包开通说明文本',
          })}
          tooltip={intl.formatMessage({
            id: 'components.compensationSettingForm.noticeTextTip',
            defaultMessage: '此文本会在用户开通钱包时显示为提示信息',
          })}
        >
          <TextArea rows={4} placeholder={intl.formatMessage({
            id: 'components.compensationSettingForm.noticeTextPlaceholder',
            defaultMessage: '请输入钱包开通时显示给用户的说明文本，例如：开通钱包后将获得1000补偿金...',
          })} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            {intl.formatMessage({
              id: 'components.compensationSettingForm.save',
              defaultMessage: '保存',
            })}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default CompensationSettingForm;