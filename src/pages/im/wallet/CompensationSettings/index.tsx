import { useEffect, useState } from 'react';
import { useIntl } from '@umijs/max';
import { Card, Spin, message, Button, Space } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import CompensationSettingForm from '@/components/CompensationSettingForm';
import { CompensationSettings, getCompensationSettings } from '@/services/compensation';

const CompensationSettingsPage: React.FC = () => {
  const intl = useIntl();
  const [loading, setLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<CompensationSettings>();


  // 加载补偿金系统设置
  const fetchSettings = async () => {
    try {
      setLoading(true);
      // 添加调试输出
      const result = await getCompensationSettings();
      console.log('API响应完整结果:', JSON.stringify(result, null, 2));

      let settingsData;
      if (result && result.data && result.errCode === 0) {
        console.log('使用嵌套格式解析 errCode=0');
        settingsData = result.data;
      } else if (result && result.data && result.code === 0) {
        console.log('使用嵌套格式解析 code=0');
        settingsData = result.data;
      } else if (result && result.data) {
        console.log('使用直接格式解析');
        settingsData = result.data;
      } else if (result) {
        console.log('使用整个结果作为设置');
        settingsData = result as any;
      } else {
        console.error('无效的响应格式');
        throw new Error('Invalid response format');
      }

      // 确保对象中包含 notice_text 字段，注意使用 === undefined 检查字段是否存在
      if (settingsData && typeof settingsData.notice_text === 'undefined') {
        console.log('API响应中没有 notice_text 字段，手动添加');
        settingsData.notice_text = '';
      } else if (settingsData && settingsData.notice_text === null) {
        console.log('API响应中 notice_text 字段为 null，设置为空字符串');
        settingsData.notice_text = '';
      } else if (settingsData) {
        console.log('API响应中包含 notice_text 字段:', settingsData.notice_text);
      }

      console.log('最终使用的设置数据:', settingsData);
      setSettings(settingsData);
    } catch (error) {
      console.error('补偿金设置获取失败 - 详细错误:', error);
      message.error(intl.formatMessage({
        id: 'components.compensationSettingForm.fetchFailed',
        defaultMessage: '获取补偿金系统设置失败',
      }));
    } finally {
      setLoading(false);
    }
  };

  // 加载补偿金系统设置
  useEffect(() => {
    fetchSettings();
  }, [intl]);

  // 设置保存成功回调
  const handleSettingSuccess = () => {
    // 成功后刷新设置数据
    fetchSettings();
  };

  return (
    <PageContainer
      header={{
        title: intl.formatMessage({
          id: 'components.compensationSettingForm.title',
          defaultMessage: '补偿金系统设置',
        }),
      }}
    >
      <Spin spinning={loading}>
        <Card>
          {!loading && settings && (
            <>
              <Space direction="vertical" style={{ width: '100%' }}>
                <CompensationSettingForm
                  settings={settings}
                  onSuccess={handleSettingSuccess}
                />
              </Space>
            </>
          )}
        </Card>
      </Spin>
    </PageContainer>
  );
};

export default CompensationSettingsPage;