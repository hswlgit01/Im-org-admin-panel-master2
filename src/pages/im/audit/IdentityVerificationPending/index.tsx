import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import type { Key } from 'react';
import { useMemo, useRef, useState } from 'react';

import {
  approveIdentityVerification,
  approveIdentityVerificationBatch,
  getIdentityVerificationList,
  rejectIdentityVerification,
} from '@/services/user';
import { formatUTCTimeToBeijing, getResourceUrl } from '@/utils/common';
import { Button, Image, Input, Modal, Popconfirm, Tag, message } from 'antd';

const { TextArea } = Input;

const IdentityVerificationPending = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<API.UserManage.IdentityVerification | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [batchApproving, setBatchApproving] = useState(false);

  const handleApprove = async (record: API.UserManage.IdentityVerification) => {
    try {
      await approveIdentityVerification({ userID: record.userID });
      message.success('审核通过成功');
      actionRef.current?.reload();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleReject = async () => {
    if (!selectedRecord) return;

    try {
      await rejectIdentityVerification({
        userID: selectedRecord.userID,
        rejectReason: rejectReason.trim() || undefined,
      });
      message.success('已拒绝认证申请');
      setRejectModalVisible(false);
      setRejectReason('');
      setSelectedRecord(null);
      actionRef.current?.reload();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const showRejectModal = (record: API.UserManage.IdentityVerification) => {
    setSelectedRecord(record);
    setRejectModalVisible(true);
  };

  const showDetailModal = (record: API.UserManage.IdentityVerification) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  const parseBatchResult = (res: unknown): API.UserManage.IdentityApproveBatchResult => {
    const r = res as Record<string, unknown>;
    const inner = (r?.data ?? r) as API.UserManage.IdentityApproveBatchResult;
    return {
      success: typeof inner?.success === 'number' ? inner.success : 0,
      failed: Array.isArray(inner?.failed) ? inner.failed : [],
    };
  };

  const handleBatchApprove = async () => {
    const ids = selectedRowKeys.map(String).filter(Boolean);
    if (ids.length === 0) {
      message.warning('请先勾选要通过的申请');
      return;
    }
    setBatchApproving(true);
    try {
      const batchSize = 200;
      let totalOk = 0;
      const allFailed: API.UserManage.IdentityApproveBatchFailure[] = [];
      for (let i = 0; i < ids.length; i += batchSize) {
        const chunk = ids.slice(i, i + batchSize);
        const res = await approveIdentityVerificationBatch({ userIDs: chunk });
        const { success, failed } = parseBatchResult(res);
        totalOk += success;
        if (failed?.length) {
          allFailed.push(...failed);
        }
      }
      if (allFailed.length === 0) {
        message.success(`批量通过成功，共 ${totalOk} 条`);
      } else {
        Modal.warning({
          title: '批量审核完成（部分失败）',
          width: 560,
          content: (
            <div>
              <p>
                成功 {totalOk} 条，失败 {allFailed.length} 条。
              </p>
              <ul style={{ maxHeight: 240, overflow: 'auto', paddingLeft: 18, marginBottom: 0 }}>
                {allFailed.slice(0, 50).map((f) => (
                  <li key={f.userID}>
                    <code>{f.userID}</code>：{f.errMsg}
                  </li>
                ))}
              </ul>
              {allFailed.length > 50 && <p style={{ marginTop: 8 }}>… 仅展示前 50 条失败原因</p>}
            </div>
          ),
        });
      }
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch {
      message.error('批量审核请求失败');
    } finally {
      setBatchApproving(false);
    }
  };

  const columns: ProColumns<API.UserManage.IdentityVerification>[] = useMemo(
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
          placeholder: '用户ID/账号/昵称',
        },
      },
      {
        title: '用户ID',
        key: 'userID',
        dataIndex: 'userID',
        align: 'center',
        hideInSearch: true,
        width: 150,
      },
      {
        title: '账号',
        key: 'account',
        dataIndex: 'account',
        align: 'center',
        hideInSearch: true,
        width: 120,
      },
      {
        title: '昵称',
        key: 'nickname',
        dataIndex: 'nickname',
        align: 'center',
        hideInSearch: true,
        width: 120,
      },
      {
        title: '真实姓名',
        key: 'realName',
        dataIndex: 'realName',
        align: 'center',
        hideInSearch: true,
        width: 100,
      },
      {
        title: '身份证号',
        key: 'idCardNumber',
        dataIndex: 'idCardNumber',
        align: 'center',
        hideInSearch: true,
        width: 180,
      },
      {
        title: '提交时间',
        key: 'applyTime',
        dataIndex: 'applyTime',
        align: 'center',
        hideInSearch: true,
        width: 170,
        render: (_, record) => formatUTCTimeToBeijing(record.applyTime),
      },
      {
        title: '状态',
        key: 'status',
        dataIndex: 'status',
        align: 'center',
        hideInSearch: true,
        width: 100,
        render: () => <Tag color="orange">审核中</Tag>,
      },
      {
        title: '操作',
        key: 'action',
        align: 'center',
        hideInSearch: true,
        width: 200,
        fixed: 'right',
        render: (_: any, record: API.UserManage.IdentityVerification) => (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <Button type="link" size="small" onClick={() => showDetailModal(record)}>
              查看详情
            </Button>
            <Popconfirm
              title="确定通过此认证申请吗?"
              onConfirm={() => handleApprove(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" style={{ color: '#52c41a' }}>
                通过
              </Button>
            </Popconfirm>
            <Button
              type="link"
              size="small"
              danger
              onClick={() => showRejectModal(record)}
            >
              拒绝
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <PageContainer>
      <ProTable<API.UserManage.IdentityVerification>
        rowKey="userID"
        columns={columns}
        actionRef={actionRef}
        scroll={{ x: 1400 }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
          preserveSelectedRowKeys: true,
        }}
        tableAlertRender={({ selectedRowKeys: keys }) => (
          <span>已选 {keys.length} 条</span>
        )}
        tableAlertOptionRender={() => (
          <Button type="link" size="small" onClick={() => setSelectedRowKeys([])}>
            取消选择
          </Button>
        )}
        toolBarRender={() => [
          <Popconfirm
            key="batch"
            title={`确定批量通过已选的 ${selectedRowKeys.length} 条申请吗？`}
            disabled={selectedRowKeys.length === 0 || batchApproving}
            onConfirm={handleBatchApprove}
            okText="确定"
            cancelText="取消"
          >
            <Button type="primary" loading={batchApproving} disabled={selectedRowKeys.length === 0}>
              批量审核
            </Button>
          </Popconfirm>,
        ]}
        request={async (params) => {
          const { keyword, current, pageSize } = params;
          const res = await getIdentityVerificationList({
            status: 1, // 只查询审核中状态
            keyword,
            pagination: {
              pageNumber: current || 1,
              showNumber: pageSize || 10,
            },
          });

          return {
            data: res.data?.list || [],
            success: true,
            total: res.data?.total || 0,
          };
        }}
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        dateFormatter="string"
      />

      {/* 拒绝原因弹窗 */}
      <Modal
        title="拒绝认证申请"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason('');
          setSelectedRecord(null);
        }}
        okText="确定"
        cancelText="取消"
      >
        <div style={{ marginBottom: '16px' }}>
          <p style={{ marginBottom: '8px' }}>
            拒绝原因（选填）：
          </p>
          <TextArea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="请输入拒绝原因，将会展示给用户"
            rows={4}
            maxLength={200}
            showCount
          />
        </div>
      </Modal>

      {/* 详情查看弹窗 */}
      <Modal
        title="实名认证详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedRecord(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setDetailModalVisible(false)}>
            取消
          </Button>,
          <Popconfirm
            key="approve"
            title="确定通过此认证申请吗?"
            onConfirm={() => {
              if (selectedRecord) {
                handleApprove(selectedRecord);
                setDetailModalVisible(false);
              }
            }}
            okText="确定"
            cancelText="取消"
          >
            <Button type="primary" style={{ background: '#52c41a', borderColor: '#52c41a' }}>
              通过
            </Button>
          </Popconfirm>,
          <Button
            key="reject"
            danger
            onClick={() => {
              setDetailModalVisible(false);
              if (selectedRecord) {
                showRejectModal(selectedRecord);
              }
            }}
          >
            拒绝
          </Button>,
        ]}
        width={700}
      >
        {selectedRecord && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>
                用户信息
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ color: '#666' }}>用户ID：</span>
                  <span>{selectedRecord.userID}</span>
                </div>
                <div>
                  <span style={{ color: '#666' }}>账号：</span>
                  <span>{selectedRecord.account || '-'}</span>
                </div>
                <div>
                  <span style={{ color: '#666' }}>昵称：</span>
                  <span>{selectedRecord.nickname || '-'}</span>
                </div>
                <div>
                  <span style={{ color: '#666' }}>提交时间：</span>
                  <span>{formatUTCTimeToBeijing(selectedRecord.applyTime)}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>
                认证信息
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ color: '#666' }}>真实姓名：</span>
                  <span>{selectedRecord.realName}</span>
                </div>
                <div>
                  <span style={{ color: '#666' }}>身份证号：</span>
                  <span>{selectedRecord.idCardNumber}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>
                身份证照片
              </h3>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div>
                  <p style={{ marginBottom: '8px', color: '#666' }}>身份证正面</p>
                  <Image
                    src={getResourceUrl(selectedRecord.idCardFront)}
                    alt="身份证正面"
                    width={250}
                    style={{ borderRadius: '4px', border: '1px solid #d9d9d9' }}
                  />
                </div>
                <div>
                  <p style={{ marginBottom: '8px', color: '#666' }}>身份证反面</p>
                  <Image
                    src={getResourceUrl(selectedRecord.idCardBack)}
                    alt="身份证反面"
                    width={250}
                    style={{ borderRadius: '4px', border: '1px solid #d9d9d9' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default IdentityVerificationPending;
