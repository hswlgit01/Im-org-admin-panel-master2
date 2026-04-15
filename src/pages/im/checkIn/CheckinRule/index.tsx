import { getCheckinRuleDescription, getCheckinRuleDescriptionNoCache, updateCheckinRuleDescription } from '@/services/checkin';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Card, message, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const CheckinRuleDescription: React.FC = () => {
  const intl = useIntl();
  const [ruleDescription, setRuleDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // 富文本编辑器配置
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background'
  ];

  // 处理API响应并提取签到规则内容的通用函数
  const processRuleDescriptionResponse = (response) => {
    let ruleDescriptionContent = '';

    if (response?.data) {
      // 1. 尝试直接从response.data获取
      if (typeof response.data.checkin_rule_description === 'string') {
        ruleDescriptionContent = response.data.checkin_rule_description;
      }
      // 2. 尝试从response.data.data获取
      else if (response.data.data && typeof response.data.data.checkin_rule_description === 'string') {
        ruleDescriptionContent = response.data.data.checkin_rule_description;
      }
      // 3. 处理用户组织信息接口的特殊结构
      else if (response.data.organization && typeof response.data.organization.checkin_rule_description === 'string') {
        ruleDescriptionContent = response.data.organization.checkin_rule_description;
      }
      // 4. 遍历response.data的所有字段查找
      else {
        for (const key in response.data) {
          const value = response.data[key];
          if (value && typeof value === 'object' && typeof value.checkin_rule_description === 'string') {
            ruleDescriptionContent = value.checkin_rule_description;
            break;
          }
        }
      }
    }

    console.log('解析出的签到规则内容:', ruleDescriptionContent);
    return ruleDescriptionContent;
  };

  // 加载签到规则说明 - 始终使用缓存破坏参数确保获取最新数据
  const fetchRuleDescription = async () => {
    setLoading(true);
    try {
      // 每次都使用当前时间戳作为缓存破坏参数
      const timestamp = Date.now().toString();
      const response = await getCheckinRuleDescription(timestamp);
      console.log('签到规则API响应:', JSON.stringify(response, null, 2));

      const ruleDescriptionContent = processRuleDescriptionResponse(response);
      setRuleDescription(ruleDescriptionContent);
    } catch (error) {
      console.error('获取签到规则说明失败:', error);
      message.error('获取签到规则说明失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存签到规则说明
  const saveRuleDescription = async () => {
    setSaving(true);
    try {
      // 打印保存前的内容（用于调试）
      console.log('准备保存的签到规则内容:', ruleDescription);

      // 提交更新请求
      const saveResponse = await updateCheckinRuleDescription({
        checkin_rule_description: ruleDescription
      });

      // 打印保存响应（用于调试）
      console.log('保存签到规则响应:', JSON.stringify(saveResponse, null, 2));

      // 保存成功后通过不同的API接口绕过Redis缓存获取最新数据
      try {
        setLoading(true);
        // 使用不同的接口获取组织信息，这个接口可能走不同的缓存路径
        const response = await getCheckinRuleDescriptionNoCache();
        console.log('绕过缓存获取签到规则响应:', JSON.stringify(response, null, 2));

        // 处理响应并更新状态
        const ruleDescriptionContent = processRuleDescriptionResponse(response);
        setRuleDescription(ruleDescriptionContent);

        // 更新最后修改时间
        const now = new Date();
        setLastUpdated(now.toLocaleString());
      } catch (error) {
        console.error('绕过缓存获取签到规则失败:', error);
        // 如果备用接口失败，回退到原始方法
        await fetchRuleDescription();
      } finally {
        setLoading(false);
      }

      // 如果内容为空，显示不同的提示
      if (!ruleDescription || ruleDescription.trim() === '') {
        message.success('已清空签到规则说明。规则已更新，用户将立即看到变更。');
      } else {
        message.success('保存成功。规则已更新，用户将立即看到变更。');
      }
    } catch (error) {
      console.error('保存签到规则说明失败:', error);
      message.error('保存签到规则说明失败');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // 每次组件挂载时都获取最新数据
    fetchRuleDescription();
  }, []);

  return (
    <PageContainer>
      <Spin spinning={loading}>
        <Card
          title="签到规则说明"
          extra={
            <Button
              type="primary"
              loading={saving}
              onClick={saveRuleDescription}
            >
              保存
            </Button>
          }
        >
          <p style={{ marginBottom: 16 }}>
            设置签到规则说明，将在用户签到页面显示。支持富文本编辑，可以设置文字格式、颜色和列表等。
            {lastUpdated && (
              <span style={{ color: '#0089FF', marginLeft: 8 }}>
                最后更新: {lastUpdated}
              </span>
            )}
          </p>
          <ReactQuill
            theme="snow"
            modules={modules}
            formats={formats}
            value={ruleDescription}
            onChange={setRuleDescription}
            style={{ height: 400, marginBottom: 50 }}
          />
        </Card>
      </Spin>
    </PageContainer>
  );
};

export default CheckinRuleDescription;