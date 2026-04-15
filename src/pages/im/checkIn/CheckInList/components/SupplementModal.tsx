import { supplementCheckin, supplementMultipleDates, selectCheckInList } from '@/services/checkin';
import { Button, Form, Modal, message, Space, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './SupplementCalendar.css';

interface ISupplementModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  current_id: string;
  username?: string;
}

type ValuePiece = Date | null;
type Value = Date[];

const SupplementModal: React.FC<ISupplementModalProps> = (props) => {
  const { visible, onCancel, onSuccess, current_id, username } = props;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingCheckIns, setFetchingCheckIns] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Value>([]);
  const [checkedInDates, setCheckedInDates] = useState<Date[]>([]);
  const [activeDate, setActiveDate] = useState<Date>(new Date());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [latestCheckinDate, setLatestCheckinDate] = useState<Date | null>(null);

  // 获取用户已签到的日期记录，基于当前查看的月份
  const fetchUserCheckIns = async (date: Date = new Date()) => {
    if (!current_id) return;

    try {
      setFetchingCheckIns(true);

      // 计算当前视图月份的开始和结束日期（使用CST时区）
      // 转换为北京时间以确保日期边界一致性
      const cstOffset = 8 * 60 * 60 * 1000; // 中国标准时间偏移量（+8小时）
      const utcTime = date.getTime();
      const cstTime = new Date(utcTime + (date.getTimezoneOffset() * 60 * 1000) + cstOffset);

      const year = cstTime.getFullYear();
      const month = cstTime.getMonth();

      // 获取月初和月末，并向前后各扩展一个月，覆盖相邻月份日期
      // 注意：这里使用CST时区创建日期
      const startDate = new Date(Date.UTC(year, month - 1, 1) + cstOffset);
      const endDate = new Date(Date.UTC(year, month + 2, 0) + cstOffset);

      // 格式化日期为YYYY-MM-DD格式（CST时区显示）
      const formatDateForQuery = (date: Date) => {
        // 转换为CST显示
        const cstDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60 * 1000) + cstOffset);
        const y = cstDate.getFullYear();
        const m = String(cstDate.getMonth() + 1).padStart(2, '0');
        const d = String(cstDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      console.log(`加载签到记录：${formatDateForQuery(startDate)} 至 ${formatDateForQuery(endDate)}`);

      // 使用后端API的时间过滤功能
      // 转换为Unix时间戳（秒）作为查询参数
      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      const endTimestamp = Math.floor(endDate.getTime() / 1000);

      const { data } = await selectCheckInList({
        imServerUserId: current_id,           // 精确按用户过滤，避免 keyword 聚合
        startTime: startTimestamp.toString(), // 添加开始时间参数
        endTime: endTimestamp.toString(),     // 添加结束时间参数
      });

      // 从响应中提取签到日期
      const checkedInDatesArray = data.data
        .filter((item: any) => item.im_server_user_id === current_id)
        .map((item: any) => {
          // 修正：使用date字段而不是created_at字段
          // 处理后端传来的UTC时间，确保我们使用CST时区处理日期
          const utcDate = new Date(item.date);  // 改为使用date字段
          const cstDate = new Date(utcDate.getTime() + (utcDate.getTimezoneOffset() * 60 * 1000) + cstOffset);
          // 日志调试信息
          console.log('签到记录:', {
            recordId: item._id,
            date: item.date,
            created_at: item.created_at,
            utcDate: utcDate.toISOString(),
            cstDate: cstDate.toISOString()
          });
          // 只保留日期部分（去除时间）
          return new Date(Date.UTC(cstDate.getFullYear(), cstDate.getMonth(), cstDate.getDate()) + cstOffset);
        });

      setCheckedInDates(checkedInDatesArray);

      // 确定最新的签到日期，用于验证连续性
      if (checkedInDatesArray.length > 0) {
        const sortedDates = [...checkedInDatesArray].sort((a, b) => b.getTime() - a.getTime());
        setLatestCheckinDate(sortedDates[0]);
      } else {
        setLatestCheckinDate(null);
      }
    } catch (error) {
      console.error('获取签到记录失败:', error);
      message.error('获取签到记录失败');
    } finally {
      setFetchingCheckIns(false);
    }
  };

  // 当用户ID变化或弹窗显示时重置表单并加载签到记录
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setSelectedDates([]);

      // 重置日期到当前月
      const today = new Date();
      setActiveDate(today);

      // 加载当前月的签到记录
      fetchUserCheckIns(today);
    }
  }, [visible, current_id, form]);

  // 处理日历视图变化
  const handleActiveStartDateChange = ({ activeStartDate }: { activeStartDate: Date | null }) => {
    if (
      activeStartDate &&
      (activeStartDate.getMonth() !== activeDate.getMonth() ||
        activeStartDate.getFullYear() !== activeDate.getFullYear())
    ) {
      setActiveDate(activeStartDate);
      fetchUserCheckIns(activeStartDate);
    }
  };

  // 处理日期选择变更 - 支持多选
  const handleDateChange = (value: Date | Date[]) => {
    if (Array.isArray(value)) {
      // 如果是日期数组（范围选择），使用这个范围
      setSelectedDates(value);
      validateDateContinuity(value);
    } else if (value instanceof Date) {
      // 如果是单个日期，添加/移除这个日期
      const newSelectedDates = [...selectedDates];
      const dateExists = newSelectedDates.findIndex(
        date => date instanceof Date && isSameDay(date, value)
      );

      if (dateExists >= 0) {
        // 如果已存在，则移除
        newSelectedDates.splice(dateExists, 1);
      } else {
        // 如果不存在，则添加
        newSelectedDates.push(value);
      }

      setSelectedDates(newSelectedDates);
    }
  };

  // 验证所选日期是否符合连续性规则（已不再强制要求连续，仅保留供扩展使用）
  const validateDateContinuity = (value: Value) => {
    // 确保我们有一个日期数组来处理
    if (!value || !Array.isArray(value) || value.length === 0) {
      setValidationError(null);
      return;
    }

    const dates = value.filter((date): date is Date => date instanceof Date);
    if (dates.length === 0) {
      setValidationError(null);
      return;
    }

    // 添加日志，查看选择的日期和已签到日期
    console.log('验证日期:', {
      selectedDates: dates.map(d => ({
        date: d.toString(),
        formatted: formatDate(d),
        timestamp: d.getTime()
      })),
      checkedInDates: checkedInDates.map(d => ({
        date: d.toString(),
        formatted: formatDate(d),
        timestamp: d.getTime()
      }))
    });

    // 检查是否有今天或未来日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hasInvalidDate = dates.some(date => {
      const dateCst = toCstDate(date);
      return dateCst.getTime() >= today.getTime();
    });

    if (hasInvalidDate) {
      setValidationError('不能为今天或未来日期补签');
      return;
    }

    // 检查是否有已签到的日期
    const hasCheckedInDate = dates.some(date =>
      checkedInDates.some(checkedDate => isSameDay(date, checkedDate))
    );

    if (hasCheckedInDate) {
      setValidationError('所选日期包含已签到日期');
      return;
    }

    // 如果没有最近的签到记录，无需检查连续性
    if (!latestCheckinDate) {
      setValidationError(null);
      return;
    }

    // 准备所有日期列表（已签到 + 待补签）
    let allDates = [...checkedInDates];

    // 添加所选日期
    dates.forEach(date => {
      if (!allDates.some(d => isSameDay(d, date))) {
        allDates.push(date);
      }
    });

    // 按日期排序（仅用于调试或后续扩展，不再强制要求连续）
    allDates.sort((a, b) => a.getTime() - b.getTime());

    // 通过所有验证（只要不包含今天/未来和已签到日期，就视为合法）
    setValidationError(null);
  };

  // 验证选择的日期是否符合基本条件（用于提交前检查）
  const validateSelectedDates = (value: Value) => {
    // 确保我们有一个日期数组来处理
    if (!value || !Array.isArray(value) || value.length === 0) {
      return false;
    }

    const dates = value.filter((date): date is Date => date instanceof Date);
    if (dates.length === 0) {
      return false;
    }

    // 检查是否有选择今天或未来日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const date of dates) {
      if (date.getTime() >= today.getTime()) {
        message.error('不能为今天及未来日期补签');
        return false;
      }
    }

    return true;
  };

  // 中国标准时间偏移量（+8小时）
  const cstOffset = 8 * 60 * 60 * 1000;

  // 转换为CST时区的日期
  const toCstDate = (date: Date) => {
    return new Date(date.getTime() + (date.getTimezoneOffset() * 60 * 1000) + cstOffset);
  };

  // 格式化日期为YYYY-MM-DD格式（CST时区）
  const formatDate = (date: Date) => {
    // 转换为CST时区
    const cstDate = toCstDate(date);
    const year = cstDate.getFullYear();
    const month = String(cstDate.getMonth() + 1).padStart(2, '0');
    const day = String(cstDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 格式化日期为API格式 YYYY-MM-DDT00:00:00+08:00
  const formatDateForApi = (date: Date) => {
    return formatDate(date) + 'T00:00:00+08:00';
  };

  // 检查两个日期是否为同一天（基于CST时区）
  const isSameDay = (date1: Date, date2: Date) => {
    // 转换为CST时区再比较
    const cstDate1 = toCstDate(date1);
    const cstDate2 = toCstDate(date2);

    return (
      cstDate1.getFullYear() === cstDate2.getFullYear() &&
      cstDate1.getMonth() === cstDate2.getMonth() &&
      cstDate1.getDate() === cstDate2.getDate()
    );
  };

  // 计算两个日期之间相差的天数（基于CST时区）
  const getDaysDifference = (date1: Date, date2: Date) => {
    // 转换为CST时区的午夜时间
    const date1Midnight = new Date(Date.UTC(
      toCstDate(date1).getFullYear(),
      toCstDate(date1).getMonth(),
      toCstDate(date1).getDate()
    ) + cstOffset);

    const date2Midnight = new Date(Date.UTC(
      toCstDate(date2).getFullYear(),
      toCstDate(date2).getMonth(),
      toCstDate(date2).getDate()
    ) + cstOffset);

    // 计算天数差异
    return Math.abs(Math.floor(
      (date2Midnight.getTime() - date1Midnight.getTime()) / (24 * 60 * 60 * 1000)
    ));
  };

  // 提交表单
  const handleOk = async () => {
    try {
      if (!selectedDates || !Array.isArray(selectedDates) || selectedDates.length === 0) {
        message.error('请选择补签日期');
        return;
      }

      // 验证选择的日期是否符合基本规则
      if (!validateSelectedDates(selectedDates)) {
        return;
      }

      setLoading(true);

      // 确保我们只处理有效的日期对象
      const validDates = selectedDates.filter((date): date is Date => date instanceof Date);

      // 对选择的日期进行排序（转换为CST后比较）
      const sortedDates = [...validDates].sort((a, b) => toCstDate(a).getTime() - toCstDate(b).getTime());

      // 将日期转换为API所需格式
      const formattedDates = sortedDates.map(date => formatDateForApi(date));

      // 增强日志输出，显示详细的日期信息
      console.log("补签日期详情:", {
        原始日期: sortedDates.map(date => date.toString()),
        格式化日期: sortedDates.map(date => formatDate(date)),
        API格式: formattedDates,
        时间戳: sortedDates.map(date => date.getTime())
      });

      // 调用多日期补签API
      const response = await supplementMultipleDates({
        im_server_user_id: current_id,
        dates: formattedDates,
      });

      console.log('补签API响应:', response);

      if (response.data) {
        // 增强响应处理，提供更详细的信息
        if (response.data.success_count > 0) {
          // 有成功补签的日期
          message.success(`补签成功，成功补签 ${response.data.success_count} 天`);
          // 补签成功后，重新拉取当前视图范围内的签到记录并重置选择状态
          try {
            await fetchUserCheckIns(activeDate);
          } catch (e) {
            console.error('补签后刷新签到记录失败:', e);
          }
          setSelectedDates([]);
          onSuccess();
          onCancel();
        } else if (response.data.skipped_dates?.length > 0) {
          // 所有日期都被跳过（已有签到记录）：同步更新本地已签到日期，让日历立即变为“绿色已签到”状态
          const rawSkipped: any[] = response.data.skipped_dates;

          // 将后端返回的日期转换为本地 Date，并与 checkedInDates / selectedDates 对齐
          const skippedDateObjs: Date[] = rawSkipped
            .map((d: any) => new Date(d))
            .filter((d: Date) => d instanceof Date && !Number.isNaN(d.getTime()));

          if (skippedDateObjs.length > 0) {
            // 更新已签到日期列表：补齐这些“其实已经签到过”的日期
            const newCheckedInDates = [...checkedInDates];
            skippedDateObjs.forEach((sd) => {
              if (!newCheckedInDates.some((cd) => isSameDay(cd, sd))) {
                const cst = toCstDate(sd);
                const normalized = new Date(
                  Date.UTC(cst.getFullYear(), cst.getMonth(), cst.getDate()) + cstOffset,
                );
                newCheckedInDates.push(normalized);
              }
            });
            setCheckedInDates(newCheckedInDates);

            // 从当前选择中移除这些已签到日期，避免仍显示为“蓝色选中”
            const filteredSelected = selectedDates.filter(
              (d) => !skippedDateObjs.some((sd) => isSameDay(d as Date, sd)),
            );
            setSelectedDates(filteredSelected);
          }

          const skippedDatesStr = response.data.skipped_dates
            .map((d: string) => new Date(d).toLocaleDateString('zh-CN'))
            .join(', ');

          message.info(`所选日期已有签到记录，无需补签: ${skippedDatesStr}`);
        } else {
          // 其他情况
          message.success('操作完成');
          onSuccess();
          onCancel();
        }
      } else {
        // 处理错误情况
        message.error(response.errDlt || '补签失败，请稍后重试');
        console.error('补签API错误:', response.errDlt || '未知错误');
      }
    } catch (error: any) {
      console.error('补签失败:', error);
      message.error(error.message || '补签失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 禁用今天及以后的日期，以及已签到的日期
  const tileDisabled = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return false;

    // 转换为CST时区后，获取今天的午夜时间
    const todayCst = toCstDate(new Date());
    const todayCstMidnight = new Date(
      Date.UTC(todayCst.getFullYear(), todayCst.getMonth(), todayCst.getDate()) + cstOffset
    );

    // 获取日历单元格日期的CST午夜时间
    const dateCst = toCstDate(date);
    const dateCstMidnight = new Date(
      Date.UTC(dateCst.getFullYear(), dateCst.getMonth(), dateCst.getDate()) + cstOffset
    );

    // 禁用今天及以后的日期（基于CST时区）
    if (dateCstMidnight.getTime() >= todayCstMidnight.getTime()) {
      return true;
    }

    // 禁用已签到的日期
    return checkedInDates.some(checkedDate => isSameDay(checkedDate, date));
  };

  // 为日历单元格添加自定义样式
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return '';

    // 已签到日期添加特殊样式
    if (checkedInDates.some(checkedDate => isSameDay(checkedDate, date))) {
      return 'already-checked-in';
    }

    // 已选择的日期添加特殊样式
    for (let i = 0; i < selectedDates.length; i++) {
      if (isSameDay(selectedDates[i], date)) {
        // 直接使用CSS类名，不再尝试添加自定义data属性
        return `selected-for-supplement selection-index-${i + 1}`;
      }
    }

    return '';
  };

  // 为日历单元格添加额外内容
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    // 为已签到日期添加标记
    if (checkedInDates.some(checkedDate => isSameDay(checkedDate, date))) {
      return (
        <div className="checked-in-marker">
          ✓
        </div>
      );
    }

    return null;
  };

  return (
    <Modal
      title={`补签 - ${username || current_id}`}
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnClose
      width={700} // 稍微扩大一点宽度，适应日历控件
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="选择需要补签的日期"
          name="date_range"
          rules={[{ required: true, message: '请选择补签日期' }]}
          extra="点击选择需要补签的日期，可选择多个日期。已签到的日期会被标记（绿色），不可重复选择。"
          validateStatus={validationError ? 'error' : undefined}
          help={validationError}
        >
          {fetchingCheckIns ? (
            <div className="calendar-container" style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <Spin tip="加载签到记录中..." />
            </div>
          ) : (
            <div className="calendar-container">
              <Calendar
                selectRange={false}
                // 这些 any 类型仅用于适配第三方库的类型定义，实际传入的数据仍然是 Date[]
                value={selectedDates as any}
                onChange={handleDateChange as any}
                onActiveStartDateChange={handleActiveStartDateChange as any}
                activeStartDate={activeDate as any}
                tileDisabled={tileDisabled}
                tileClassName={tileClassName}
                tileContent={tileContent}
                calendarType="iso8601" // 使用ISO 8601标准，每周第一天为周一
                locale="zh-CN"
                formatDay={(locale, date) => date.getDate().toString()} // 仅显示日期数字
                formatShortWeekday={(locale, date) =>
                  ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
                } // 自定义周几显示
                formatMonthYear={(locale, date) =>
                  `${date.getFullYear()}年${date.getMonth() + 1}月`
                } // 自定义年月显示
              />
            </div>
          )}
        </Form.Item>

        <div className="calendar-legend">
          <div className="legend-item">
            <span className="legend-color already-checked-in-legend"></span>
            <span className="legend-text">已签到日期</span>
          </div>
          <div className="legend-item">
            <span className="legend-color selected-for-supplement-legend"></span>
            <span className="legend-text">选择补签日期</span>
          </div>
        </div>

        <div className="selection-info">
          已选择 <span className="selection-count">{selectedDates.length}</span> 天
          {selectedDates.length > 0 && (
            <Button
              size="small"
              type="link"
              onClick={() => {
                setSelectedDates([]);
                setValidationError(null);
              }}
            >
              清空选择
            </Button>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Spin tip="正在处理补签请求，请稍候..." />
          </div>
        )}

        {/* 补签警告提示 */}
        <div style={{
          marginTop: 16,
          marginBottom: 16,
          padding: '8px 12px',
          backgroundColor: '#fffbe6',
          border: '1px solid #ffe58f',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{
            fontSize: 20,
            marginRight: 8,
            color: '#faad14'
          }}>⚠️</span>
          <span>警告：补签操作可能导致签到奖励重复发放，请谨慎操作。</span>
        </div>
      </Form>
    </Modal>
  );
};

export default SupplementModal;
