import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import dayjs from 'dayjs';
import { useMemo, useRef, useState } from 'react';
import { Button, Input, Modal, Tag, message, Descriptions, Space } from 'antd';
import { formatUTCTimeToBeijing, getResourceUrl } from '@/utils/common';
import {
  getWithdrawalList,
  exportWithdrawalCsv,
  approveWithdrawal,
  rejectWithdrawal,
  transferWithdrawal,
  completeWithdrawal,
} from './services';

const { TextArea } = Input;

const WITHDRAWAL_EXPORT_MSG_KEY = 'withdrawal-export';

// 提现状态枚举
const WithdrawalStatus = {
  PENDING: 0,      // 待审核
  APPROVED: 1,     // 已通过
  TRANSFERRING: 2, // 打款中
  COMPLETED: 3,    // 已完成
  REJECTED: 4,     // 已拒绝
  CANCELLED: 5,    // 已取消
};

// 支付类型枚举
const PaymentType = {
  BANK: 0,      // 银行卡
  WECHAT: 1,    // 微信
  ALIPAY: 2,    // 支付宝
};

interface WithdrawalRecord {
  id: string;
  orderNo: string;
  userId?: string;        // 注意: 后端返回的是驼峰命名 userId
  userAccount?: string;   // 用户账号
  nickname?: string;      // 用户昵称（后端来自 user 表 nickname）
  currencyId?: string;    // 币种ID
  currencyName?: string;  // 币种名称
  currencySymbol?: string; // 币种符号
  exchangeRate?: number;  // 汇率
  amount: number;
  amountInCny?: number;   // 人民币金额
  fee: number;            // 手续费（人民币）
  actualAmount: number;
  actualAmountInCny?: number; // 实际到账人民币金额
  status: number;
  paymentType: number;
  paymentInfo: string;
  rejectReason?: string;
  approveTime?: number;
  transferTime?: number;
  completeTime?: number;
  createdAt: number;
}

function parseCreatedAtRange(createdAtRange: unknown): {
  createdAtStart?: number;
  createdAtEnd?: number;
} {
  if (!createdAtRange || !Array.isArray(createdAtRange)) return {};
  const [a, b] = createdAtRange;
  if (!a || !b) return {};
  // 仅选年月日时：按自然日起止传给后端（含结束日当天全天）
  return {
    createdAtStart: dayjs(a).startOf('day').valueOf(),
    createdAtEnd: dayjs(b).endOf('day').valueOf(),
  };
}

const WithdrawalAudit = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const formRef = useRef<ProFormInstance>();
  const [exporting, setExporting] = useState(false);
  /** 同步防抖：避免在 setState 生效前连点触发多次导出 */
  const exportingRef = useRef(false);

  // 状态管理
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WithdrawalRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');

  const getStatusText = (status: number) => {
    const statusMap = {
      [WithdrawalStatus.PENDING]: '待审核',
      [WithdrawalStatus.APPROVED]: '已通过',
      [WithdrawalStatus.TRANSFERRING]: '打款中',
      [WithdrawalStatus.COMPLETED]: '已完成',
      [WithdrawalStatus.REJECTED]: '已拒绝',
      [WithdrawalStatus.CANCELLED]: '已取消',
    };
    return statusMap[status] || '未知';
  };

  // 获取状态标签
  const getStatusTag = (status: number) => {
    const statusMap = {
      [WithdrawalStatus.PENDING]: { text: '待审核', color: 'processing' },
      [WithdrawalStatus.APPROVED]: { text: '已通过', color: 'success' },
      [WithdrawalStatus.TRANSFERRING]: { text: '打款中', color: 'warning' },
      [WithdrawalStatus.COMPLETED]: { text: '已完成', color: 'success' },
      [WithdrawalStatus.REJECTED]: { text: '已拒绝', color: 'error' },
      [WithdrawalStatus.CANCELLED]: { text: '已取消', color: 'default' },
    };
    const item = statusMap[status] || { text: '未知', color: 'default' };
    return <Tag color={item.color}>{item.text}</Tag>;
  };

  // 获取支付方式文本
  const getPaymentTypeText = (type: number) => {
    const typeMap = {
      [PaymentType.BANK]: '银行卡',
      [PaymentType.WECHAT]: '微信',
      [PaymentType.ALIPAY]: '支付宝',
    };
    return typeMap[type] || '未知';
  };

  // 审核通过
  const handleApprove = async (record: WithdrawalRecord) => {
    try {
      await approveWithdrawal({ id: record.id });
      message.success('审核通过成功');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 显示拒绝弹窗
  const showRejectModal = (record: WithdrawalRecord) => {
    setSelectedRecord(record);
    setRejectModalVisible(true);
  };

  // 拒绝审核
  const handleReject = async () => {
    if (!selectedRecord) return;
    if (!rejectReason.trim()) {
      message.error('请输入拒绝原因');
      return;
    }

    try {
      await rejectWithdrawal({
        id: selectedRecord.id,
        reason: rejectReason.trim(),
      });
      message.success('已拒绝提现申请');
      setRejectModalVisible(false);
      setRejectReason('');
      setSelectedRecord(null);
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 确认打款
  const handleTransfer = async (record: WithdrawalRecord) => {
    Modal.confirm({
      title: '确认打款',
      content: `确认对订单 ${record.orderNo} 进行打款操作吗？`,
      onOk: async () => {
        try {
          await transferWithdrawal({ id: record.id });
          message.success('已确认打款');
          actionRef.current?.reload();
        } catch (error: any) {
          message.error(error.message || '操作失败');
        }
      },
    });
  };

  // 确认完成
  const handleComplete = async (record: WithdrawalRecord) => {
    Modal.confirm({
      title: '确认完成',
      content: `确认订单 ${record.orderNo} 已完成打款吗？`,
      onOk: async () => {
        try {
          await completeWithdrawal({ id: record.id });
          message.success('已标记为完成');
          actionRef.current?.reload();
        } catch (error: any) {
          message.error(error.message || '操作失败');
        }
      },
    });
  };

  // 显示详情
  const showDetailModal = (record: WithdrawalRecord) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  // 解析支付信息
  const parsePaymentInfo = (paymentInfo: string) => {
    try {
      return JSON.parse(paymentInfo);
    } catch {
      return {};
    }
  };

  // 打开图片预览
  const handleImagePreview = (url: string) => {
    setPreviewImageUrl(url);
    setImagePreviewVisible(true);
  };

  const handleExportExcel = async () => {
    if (exportingRef.current) return;
    exportingRef.current = true;
    setExporting(true);
    message.loading({
      content: '正在导出，请稍候…',
      key: WITHDRAWAL_EXPORT_MSG_KEY,
      duration: 0,
    });
    const vals = formRef.current?.getFieldsValue?.() ?? {};
    const { keyword, status, createdAtRange } = vals as {
      keyword?: string;
      status?: number | string;
      createdAtRange?: unknown;
    };
    const { createdAtStart, createdAtEnd } = parseCreatedAtRange(createdAtRange);
    try {
      const res = (await exportWithdrawalCsv({
        keyword: keyword || undefined,
        status:
          status !== undefined && status !== '' && status !== null
            ? Number(status)
            : undefined,
        createdAtStart,
        createdAtEnd,
      })) as { data: Blob; response?: { status?: number } };
      const blob = res.data;
      const statusCode = res.response?.status;
      if (statusCode !== undefined && statusCode !== 200) {
        message.error('导出失败');
        return;
      }
      if (blob?.type?.includes?.('application/json')) {
        const text = await blob.text();
        try {
          const j = JSON.parse(text) as { errMsg?: string; errDlt?: string };
          message.error(j.errMsg || j.errDlt || '导出失败');
        } catch {
          message.error('导出失败');
        }
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `withdrawal_export_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error: any) {
      message.error(error?.message || '导出失败');
    } finally {
      message.destroy(WITHDRAWAL_EXPORT_MSG_KEY);
      exportingRef.current = false;
      setExporting(false);
    }
  };

  const columns: ProColumns<WithdrawalRecord>[] = useMemo(
    () => [
      {
        key: 'index',
        dataIndex: 'index',
        valueType: 'indexBorder',
        width: 60,
      },
      {
        title: '搜索',
        key: 'keyword',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: {
          placeholder: '订单号/用户ID',
        },
      },
      {
        title: '申请时间',
        key: 'createdAtRange',
        dataIndex: 'createdAtRange',
        valueType: 'dateRange',
        hideInTable: true,
        colSize: 1.5,
        fieldProps: {
          format: 'YYYY-MM-DD',
          placeholder: ['开始日期', '结束日期'],
        },
      },
      {
        title: '订单号',
        key: 'orderNo',
        dataIndex: 'orderNo',
        align: 'center',
        hideInSearch: true,
        width: 160,
        copyable: true,
      },
      {
        title: '用户账号',
        key: 'userAccount',
        dataIndex: 'userAccount',
        align: 'center',
        hideInSearch: true,
        width: 120,
        copyable: true,
      },
      {
        title: intl.formatMessage({ id: 'user.nickname' }),
        key: 'nickname',
        dataIndex: 'nickname',
        align: 'center',
        hideInSearch: true,
        width: 120,
        ellipsis: true,
        render: (_, record) => record.nickname || '-',
      },
      {
        title: '用户ID',
        key: 'userId',
        dataIndex: 'userId',
        align: 'center',
        hideInSearch: true,
        width: 120,
        copyable: true,
      },
      {
        title: '币种',
        key: 'currencyName',
        dataIndex: 'currencyName',
        align: 'center',
        hideInSearch: true,
        width: 80,
        render: (_, record) => record.currencyName || '-',
      },
      {
        title: '提现金额',
        key: 'amount',
        dataIndex: 'amount',
        align: 'center',
        hideInSearch: true,
        width: 110,
        render: (_, record) => {
          if (record.currencySymbol) {
            return `${record.currencySymbol}${record.amount.toFixed(2)}`;
          }
          return record.amount.toFixed(2);
        },
      },
      {
        title: '人民币金额',
        key: 'amountInCny',
        dataIndex: 'amountInCny',
        align: 'center',
        hideInSearch: true,
        width: 110,
        render: (_, record) => {
          if (record.amountInCny) {
            return `¥${record.amountInCny.toFixed(2)}`;
          }
          return '-';
        },
      },
      {
        title: '手续费',
        key: 'fee',
        dataIndex: 'fee',
        align: 'center',
        hideInSearch: true,
        width: 90,
        render: (_, record) => `¥${record.fee.toFixed(2)}`,
      },
      {
        title: '实际到账',
        key: 'actualAmount',
        dataIndex: 'actualAmount',
        align: 'center',
        hideInSearch: true,
        width: 110,
        render: (_, record) => {
          if (record.currencySymbol) {
            return (
              <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                {record.currencySymbol}{record.actualAmount.toFixed(2)}
              </span>
            );
          }
          return (
            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
              {record.actualAmount.toFixed(2)}
            </span>
          );
        },
      },
      {
        title: '收款方式',
        key: 'paymentType',
        dataIndex: 'paymentType',
        align: 'center',
        hideInSearch: true,
        width: 90,
        render: (_, record) => getPaymentTypeText(record.paymentType),
      },
      {
        title: '状态',
        key: 'status',
        dataIndex: 'status',
        align: 'center',
        width: 90,
        valueType: 'select',
        valueEnum: {
          [WithdrawalStatus.PENDING]: { text: '待审核', status: 'Processing' },
          [WithdrawalStatus.APPROVED]: { text: '已通过', status: 'Success' },
          [WithdrawalStatus.TRANSFERRING]: { text: '打款中', status: 'Warning' },
          [WithdrawalStatus.COMPLETED]: { text: '已完成', status: 'Success' },
          [WithdrawalStatus.REJECTED]: { text: '已拒绝', status: 'Error' },
          [WithdrawalStatus.CANCELLED]: { text: '已取消', status: 'Default' },
        },
        render: (_, record) => getStatusTag(record.status),
      },
      {
        title: '申请时间',
        key: 'createdAt',
        dataIndex: 'createdAt',
        align: 'center',
        hideInSearch: true,
        width: 160,
        render: (_, record) => formatUTCTimeToBeijing(record.createdAt),
      },
      {
        title: '操作',
        key: 'action',
        align: 'center',
        hideInSearch: true,
        fixed: 'right',
        width: 240,
        render: (_, record) => (
          <Space size="small">
            <Button type="link" size="small" onClick={() => showDetailModal(record)}>
              详情
            </Button>
            {record.status === WithdrawalStatus.PENDING && (
              <>
                <Button type="link" size="small" onClick={() => handleApprove(record)}>
                  通过
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  onClick={() => showRejectModal(record)}
                >
                  拒绝
                </Button>
              </>
            )}
            {record.status === WithdrawalStatus.APPROVED && (
              <Button type="link" size="small" onClick={() => handleTransfer(record)}>
                确认打款
              </Button>
            )}
            {record.status === WithdrawalStatus.TRANSFERRING && (
              <Button type="link" size="small" onClick={() => handleComplete(record)}>
                确认完成
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [intl],
  );

  return (
    <PageContainer>
      <ProTable<WithdrawalRecord>
        headerTitle="提现审核列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
          // 查询项全部平铺展示，不折叠、不出现「展开/收起」
          defaultCollapsed: false,
          collapseRender: false,
        }}
        scroll={{ x: 'max-content' }}
        formRef={formRef}
        request={async (params) => {
          try {
            const { current, pageSize, keyword, status, createdAtRange } = params;
            const { createdAtStart, createdAtEnd } = parseCreatedAtRange(createdAtRange);
            const response = await getWithdrawalList({
              page: current || 1,
              pageSize: pageSize || 10,
              keyword,
              status: status !== undefined ? Number(status) : undefined,
              createdAtStart,
              createdAtEnd,
            });

            // 处理API返回的数据格式
            const data = response.data || response;

            return {
              data: data.records || [],
              success: true,
              total: data.total || 0,
            };
          } catch (error) {
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        columns={columns}
        toolBarRender={() => [
          <Button
            key="export"
            loading={exporting}
            disabled={exporting}
            onClick={handleExportExcel}
          >
            导出Excel
          </Button>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      {/* 拒绝弹窗 */}
      <Modal
        title="拒绝提现申请"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason('');
          setSelectedRecord(null);
        }}
        okText="确认"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            订单号: <strong>{selectedRecord?.orderNo}</strong>
          </div>
          <div style={{ marginBottom: 8 }}>
            提现金额: <strong>
            {selectedRecord?.currencySymbol ? selectedRecord.currencySymbol : ''}
            {selectedRecord?.amount.toFixed(2)}
          </strong>
            {selectedRecord?.currencyName !== 'CNY' && selectedRecord?.amountInCny && (
              <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
                (¥{selectedRecord.amountInCny.toFixed(2)})
              </span>
            )}
          </div>
        </div>
        <TextArea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="请输入拒绝原因"
          rows={4}
          maxLength={200}
          showCount
        />
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="提现详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedRecord(null);
        }}
        footer={null}
        width={700}
      >
        {selectedRecord && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="订单号" span={2}>
              {selectedRecord.orderNo}
            </Descriptions.Item>
            <Descriptions.Item label="用户账号">
              {selectedRecord.userAccount || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={intl.formatMessage({ id: 'user.nickname' })}>
              {selectedRecord.nickname || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="用户ID">
              {selectedRecord.userId}
            </Descriptions.Item>
            {selectedRecord.currencyName && (
              <Descriptions.Item label="币种" span={2}>
                {selectedRecord.currencyName}
                {selectedRecord.exchangeRate && (
                  <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
                    (汇率: {selectedRecord.exchangeRate})
                  </span>
                )}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="提现金额">
              {selectedRecord.currencySymbol ? selectedRecord.currencySymbol : ''}
              {selectedRecord.amount.toFixed(2)}
            </Descriptions.Item>
            {selectedRecord.amountInCny ? (
              <Descriptions.Item label="人民币金额">
                ¥{selectedRecord.amountInCny.toFixed(2)}
              </Descriptions.Item>
            ) : null}
            <Descriptions.Item label="手续费(CNY)">
              ¥{selectedRecord.fee.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="实际到账">
              <span style={{ color: '#52c41a', fontWeight: 'bold', fontSize: 16 }}>
                {selectedRecord.currencySymbol ? selectedRecord.currencySymbol : ''}
                {selectedRecord.actualAmount.toFixed(2)}
              </span>
            </Descriptions.Item>
            {selectedRecord.actualAmountInCny ? (
              <Descriptions.Item label="实际到账(CNY)">
                <span style={{ color: '#52c41a', fontWeight: 'bold', fontSize: 16 }}>
                  ¥{selectedRecord.actualAmountInCny.toFixed(2)}
                </span>
              </Descriptions.Item>
            ) : null}
            <Descriptions.Item label="收款方式">
              {getPaymentTypeText(selectedRecord.paymentType)}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {getStatusTag(selectedRecord.status)}
            </Descriptions.Item>
            <Descriptions.Item label="收款信息" span={2}>
              <div>
                {(() => {
                  const info = parsePaymentInfo(selectedRecord.paymentInfo);
                  return (
                    <div>
                      {info.type === 0 && (
                        <>
                          <div>银行名称: {info.bankName}</div>
                          <div>卡号: {info.cardNumber}</div>
                          <div>开户行: {info.branchName}</div>
                          <div>持卡人: {info.accountName}</div>
                        </>
                      )}
                      {info.type === 1 && (
                        <>
                          <div style={{ marginBottom: 8 }}>微信账号</div>
                          <div style={{ marginBottom: 8 }}>姓名: {info.accountName}</div>
                          {info.qrCodeUrl && (
                            <div style={{ marginTop: 12 }}>
                              <img
                                src={getResourceUrl(info.qrCodeUrl)}
                                alt="微信收款码"
                                style={{
                                  maxWidth: 200,
                                  maxHeight: 200,
                                  border: '1px solid #d9d9d9',
                                  borderRadius: 4,
                                  cursor: 'pointer'
                                }}
                                onClick={() => handleImagePreview(getResourceUrl(info.qrCodeUrl))}
                              />
                            </div>
                          )}
                        </>
                      )}
                      {info.type === 2 && (
                        <>
                          <div style={{ marginBottom: 8 }}>支付宝账号</div>
                          <div style={{ marginBottom: 8 }}>账号: {info.accountName}</div>
                          {info.qrCodeUrl && (
                            <div style={{ marginTop: 12 }}>
                              <img
                                src={getResourceUrl(info.qrCodeUrl)}
                                alt="支付宝收款码"
                                style={{
                                  maxWidth: 200,
                                  maxHeight: 200,
                                  border: '1px solid #d9d9d9',
                                  borderRadius: 4,
                                  cursor: 'pointer'
                                }}
                                onClick={() => handleImagePreview(getResourceUrl(info.qrCodeUrl))}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="申请时间" span={2}>
              {formatUTCTimeToBeijing(selectedRecord.createdAt)}
            </Descriptions.Item>
            {selectedRecord.approveTime && (
              <Descriptions.Item label="审核时间" span={2}>
                {formatUTCTimeToBeijing(selectedRecord.approveTime)}
              </Descriptions.Item>
            )}
            {selectedRecord.transferTime && (
              <Descriptions.Item label="打款时间" span={2}>
                {formatUTCTimeToBeijing(selectedRecord.transferTime)}
              </Descriptions.Item>
            )}
            {selectedRecord.completeTime && (
              <Descriptions.Item label="完成时间" span={2}>
                {formatUTCTimeToBeijing(selectedRecord.completeTime)}
              </Descriptions.Item>
            )}
            {selectedRecord.rejectReason && (
              <Descriptions.Item label="拒绝原因" span={2}>
                <span style={{ color: '#ff4d4f' }}>{selectedRecord.rejectReason}</span>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* 图片预览弹窗 */}
      <Modal
        title="收款码"
        open={imagePreviewVisible}
        onCancel={() => setImagePreviewVisible(false)}
        footer={null}
        width={600}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <img
            src={previewImageUrl}
            alt="收款码"
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
          />
        </div>
      </Modal>
    </PageContainer>
  );
};

export default WithdrawalAudit;
