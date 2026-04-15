import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { useMemo, useRef, useState } from 'react';

import { getIdentityVerificationList } from '@/services/user';
import { formatUTCTimeToBeijing, getResourceUrl } from '@/utils/common';
import { Button, Image, Modal, Tag } from 'antd';

const statusMap = {
  2: { text: '已通过', color: 'green' },
  3: { text: '已拒绝', color: 'red' },
};

const IdentityVerificationHistory = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<API.UserManage.IdentityVerification | null>(null);

  const showDetailModal = (record: API.UserManage.IdentityVerification) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
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
        title: '状态',
        key: 'status',
        dataIndex: 'status',
        align: 'center',
        hideInTable: true,
        valueType: 'select',
        valueEnum: {
          2: { text: '已通过' },
          3: { text: '已拒绝' },
        },
        fieldProps: {
          placeholder: '全部',
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
        valueType: 'dateRange',
        align: 'center',
        width: 170,
        render: (_, record) => formatUTCTimeToBeijing(record.applyTime),
        sorter: true, // 添加排序功能
        fieldProps: {
          allowEmpty: [true, true],
        },
      },
      {
        title: '审核时间',
        key: 'verifyTime',
        dataIndex: 'verifyTime',
        valueType: 'dateRange',
        align: 'center',
        width: 170,
        render: (_, record) =>
          record.verifyTime ? formatUTCTimeToBeijing(record.verifyTime) : '-',
        sorter: true, // 添加排序功能
        fieldProps: {
          allowEmpty: [true, true],
        },
      },
      {
        title: '审核管理员',
        key: 'verifyAdmin',
        dataIndex: 'verifyAdmin',
        align: 'center',
        hideInSearch: true,
        width: 120,
        render: (_, record) => record.verifyAdmin || '-',
      },
      {
        title: '状态',
        key: 'statusDisplay',
        dataIndex: 'status',
        align: 'center',
        hideInSearch: true,
        width: 100,
        render: (_, record) => {
          const status = statusMap[record.status as 2 | 3];
          return status ? <Tag color={status.color}>{status.text}</Tag> : null;
        },
      },
      {
        title: '拒绝原因',
        key: 'rejectReason',
        dataIndex: 'rejectReason',
        align: 'center',
        hideInSearch: true,
        width: 200,
        ellipsis: true,
        render: (_, record) =>
          record.status === 3 ? record.rejectReason || '无' : '-',
      },
      {
        title: '操作',
        key: 'action',
        align: 'center',
        hideInSearch: true,
        width: 120,
        fixed: 'right',
        render: (_: any, record: API.UserManage.IdentityVerification) => (
          <Button type="link" size="small" onClick={() => showDetailModal(record)}>
            查看详情
          </Button>
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
        scroll={{ x: 1600 }}
        request={async (params, sort) => {
          console.log(params, 'params');

          const searchParams = {
            status: params.status ? Number(params.status) : undefined, // 不传status则查询所有历史记录(2和3)
            keyword: params.keyword,
            pagination: {
              pageNumber: params.current || 1,
              showNumber: params.pageSize || 10,
            }
          };

          // 处理排序参数
          if (sort && Object.keys(sort).length > 0) {
            const key = Object.keys(sort)[0];
            searchParams.orderKey = key;
            searchParams.orderDirection = sort[key] === 'ascend' ? 'asc' : 'desc';
          }

          // 处理提交时间范围
          if (params.applyTime) {
            if (params.applyTime[0]) {
              searchParams.applyStartTime = String(new Date(params.applyTime[0]).getTime() / 1000);
            }
            if (params.applyTime[1]) {
              searchParams.applyEndTime = String(new Date(params.applyTime[1]).getTime() / 1000);
            }
          }

          // 处理审核时间范围
          if (params.verifyTime) {
            if (params.verifyTime[0]) {
              searchParams.verifyStartTime = String(new Date(params.verifyTime[0]).getTime() / 1000);
            }
            if (params.verifyTime[1]) {
              searchParams.verifyEndTime = String(new Date(params.verifyTime[1]).getTime() / 1000);
            }
          }

          const res = await getIdentityVerificationList(searchParams);

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

      {/* 详情查看弹窗 */}
      <Modal
        title="实名认证详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedRecord(null);
        }}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => {
              setDetailModalVisible(false);
              setSelectedRecord(null);
            }}
          >
            关闭
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

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>
                审核信息
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ color: '#666' }}>审核状态：</span>
                  {selectedRecord.status === 2 ? (
                    <Tag color="green">已通过</Tag>
                  ) : (
                    <Tag color="red">已拒绝</Tag>
                  )}
                </div>
                <div>
                  <span style={{ color: '#666' }}>审核时间：</span>
                  <span>
                    {selectedRecord.verifyTime
                      ? formatUTCTimeToBeijing(selectedRecord.verifyTime)
                      : '-'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#666' }}>审核管理员：</span>
                  <span>{selectedRecord.verifyAdmin || '-'}</span>
                </div>
                {selectedRecord.status === 3 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: '#666' }}>拒绝原因：</span>
                    <span>{selectedRecord.rejectReason || '无'}</span>
                  </div>
                )}
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

export default IdentityVerificationHistory;
