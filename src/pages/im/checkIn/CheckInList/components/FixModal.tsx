import { fixCheckinRecords, getCheckinRecordsForFix } from '@/services/checkin';
import { formatUTCDateOnlyToBeijing } from '@/utils/common';
import { Button, Modal, message, Typography, Space, Alert, Spin, Table, Tag } from 'antd';
import React, { useState, useEffect } from 'react';

const { Text, Title, Paragraph } = Typography;

interface IFixModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  current_id: string;
  username?: string;
}

interface CheckinRecord {
  _id: string;
  date: string;
  streak: number;
  isAbnormal?: boolean;   // 是否异常记录
}

const FixModal: React.FC<IFixModalProps> = (props) => {
  const { visible, onCancel, onSuccess, current_id, username } = props;
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<CheckinRecord[]>([]);
  const [fetching, setFetching] = useState(false);
  const [hasAbnormalStreak, setHasAbnormalStreak] = useState(false);

  // 获取签到记录
  useEffect(() => {
    if (visible && current_id) {
      fetchCheckinRecords();
    }
  }, [visible, current_id]);

  // 获取签到记录
  const fetchCheckinRecords = async () => {
    if (!current_id) return;

    try {
      setFetching(true);
      console.log("准备获取用户签到记录，ID:", current_id);

      // 调用API获取签到记录
      const response = await getCheckinRecordsForFix({
        im_server_user_id: current_id
      });

      console.log("签到记录API响应:", response);

      if (response.data && response.data.records) {
        const recordsData = response.data.records || [];
        console.log("获取到签到记录数量:", recordsData.length);

        // 处理记录，添加异常检测
        const processedRecords = detectAbnormalStreak(recordsData);
        setRecords(processedRecords);
      } else {
        setRecords([]);
        message.warning('未找到签到记录');
      }
    } catch (error: any) {
      console.error('获取签到记录失败:', error);
      message.error(error.message || '获取签到记录失败');
      setRecords([]);
    } finally {
      setFetching(false);
    }
  };

  // 简化的异常连续签到检测
  const detectAbnormalStreak = (records: CheckinRecord[]) => {
    if (!records || records.length === 0) {
      setHasAbnormalStreak(false);
      return records;
    }

    console.log('原始签到记录数据:', records);

    // 由于后端已按降序排列，需要计算正确的连续天数
    const recordsLength = records.length;

    // 添加异常标记
    const processedRecords = records.map((record, index) => {
      // 降序排列下，最新的日期（索引0）应该有最大的连续天数
      const correctStreak = recordsLength - index;
      const isAbnormal = record.streak !== correctStreak;

      console.log(`记录[${index}] 日期:${new Date(record.date).toLocaleDateString()} 当前streak:${record.streak} 正确streak:${correctStreak} 异常:${isAbnormal}`);

      return {
        ...record,
        isAbnormal,
      };
    });

    // 检查是否有异常记录
    const hasAbnormal = processedRecords.some(record => record.isAbnormal);
    setHasAbnormalStreak(hasAbnormal);

    return processedRecords;
  };


  // 执行修复操作
  const handleFix = async () => {
    if (!current_id) {
      message.error('用户ID不能为空');
      return;
    }

    try {
      setLoading(true);
      console.log('开始执行签到记录修复，用户ID:', current_id);

      // 调用修复API
      const response = await fixCheckinRecords({
        im_server_user_id: current_id
      });

      console.log('签到修复API响应:', response);

      if (response.data) {
        const { records_fixed, rewards_added } = response.data;

        if (records_fixed > 0 || rewards_added > 0) {
          message.success(`修复成功！更新了 ${records_fixed} 条记录，添加了 ${rewards_added} 个奖励`);
        } else {
          message.info('签到记录已是正确状态，无需修复');
        }

        onSuccess();
        onCancel();
      } else {
        message.error(response.errDlt || '修复失败，请稍后重试');
      }
    } catch (error: any) {
      console.error('修复失败:', error);
      message.error(error.message || '修复失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => formatUTCDateOnlyToBeijing(date),
    },
    {
      title: '连续天数',
      dataIndex: 'streak',
      key: 'streak',
      render: (streak: number, record: CheckinRecord) => (
        <span style={{
          color: record.isAbnormal ? '#ff4d4f' : 'inherit',
          fontWeight: record.isAbnormal ? 'bold' : 'normal'
        }}>
          {streak}
          {record.isAbnormal && (
            <Tag color="red" style={{ marginLeft: 8 }}>
              异常
            </Tag>
          )}
        </span>
      ),
    },
  ];

  return (
    <Modal
      title={`签到记录修复 - ${username || current_id}`}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleFix}
        >
          执行修复
        </Button>,
      ]}
      width={800}
      destroyOnClose
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 功能说明 */}
        <Alert
          message="修复功能说明"
          description={
            <div>
              <p>此功能将检查并修复用户的连续签到记录中可能存在的问题：</p>
              <ul>
                <li>修正签到记录中错误的连续天数计数</li>
                <li>补发漏发的连续签到奖励</li>
              </ul>
              <p>仅针对最近一段连续签到记录进行修复，不会影响历史断签记录。</p>
            </div>
          }
          type="info"
          showIcon
        />

        {/* 记录状态显示 */}
        {fetching ? (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <Spin tip="正在获取签到记录..." />
          </div>
        ) : (
          <>
            {records.length > 0 ? (
              <>
                <Alert
                  message={
                    hasAbnormalStreak
                      ? "检测到异常连续签到"
                      : "签到记录正常"
                  }
                  type={hasAbnormalStreak ? "warning" : "success"}
                  showIcon
                />

                <Table
                  dataSource={records}
                  columns={columns}
                  rowKey="_id"
                  pagination={false}
                  size="small"
                />
              </>
            ) : (
              <Alert
                message="暂无签到记录"
                type="info"
                showIcon
              />
            )}
          </>
        )}

        {/* 操作提示 */}
        <div style={{ marginTop: '16px' }}>
          <Paragraph>
            <Text strong>注意：</Text>
            即使检测结果显示"正常"，您仍然可以点击"执行修复"按钮尝试修复潜在问题。
            修复操作会修改用户的签到数据并可能添加奖励，请谨慎操作。
          </Paragraph>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Spin tip="正在处理修复请求，请稍候..." />
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default FixModal;
