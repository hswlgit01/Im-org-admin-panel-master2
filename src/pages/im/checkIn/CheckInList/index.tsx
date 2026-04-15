import OIMAvatar from '@/components/OIMAvatar';
import { updateUserRole } from '@/services/account';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useIntl } from '@umijs/max';
import { useMemo, useRef, useState } from 'react';
import { formatUTCDateOnlyToBeijing } from '@/utils/common';
import { Button, message } from 'antd';
import { selectCheckInList } from '@/services/checkin';
import RecordModal from './components/RecordModal';
import dayjs from 'dayjs';



// 统一将日期值转换为时间戳（毫秒），支持 Dayjs/Moment 对象和手动输入的字符串
const toTimestampMs = (value: any): number => {
  if (!value) return NaN;

  // 优先使用对象自身的 valueOf（Dayjs/Moment 通常返回 number）
  if (typeof value.valueOf === 'function') {
    const v = value.valueOf();
    if (typeof v === 'number' && Number.isFinite(v)) {
      return v;
    }
  }

  // 兼容手动输入的字符串日期（例如 2026-02-01）
  if (typeof value === 'string') {
    const parsed = dayjs(value);
    if (parsed.isValid()) {
      return parsed.valueOf();
    }
  }

  return NaN;
};

const UserList = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const [modalProps, setModalProps] = useState({
    visible: false,
    current_id: '',
  })
  const columns: ProColumns<API.UserManage.User>[] = useMemo(
    () => [
      {
        title: intl.formatMessage({ id: 'user.keyword' }),
        key: 'keyword',
        dataIndex: 'keyword',
        editable: false,
        hideInTable: true,
        align: 'center',
      },
      {
        title: '签到日期范围',
        key: 'dateRange',
        dataIndex: 'dateRange',
        hideInTable: true,
        valueType: 'dateRange',
        align: 'center',
        search: {
          transform: (value: any) => {
            if (!value || !Array.isArray(value) || value.length !== 2) {
              return {};
            }
            const [start, end] = value;
            const startMs = toTimestampMs(start);
            const endMs = toTimestampMs(end);

            if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
              // 日期值不合法时不传筛选参数，避免后端报参数错误
              return {};
            }

            return {
              startTime: Math.floor(startMs / 1000).toString(),
              endTime: Math.floor(endMs / 1000).toString(),
            };
          },
        },
      },
      {
        title: intl.formatMessage({ id: 'user.faceURL' }),
        dataIndex: 'face_url',
        key: 'face_url',
        hideInSearch: true,
        align: 'center',
        render: (_, record) => <OIMAvatar src={record.face_url} text={record.nickname} />,
      },
      {
        title: intl.formatMessage({ id: 'user.nickname' }),
        key: 'nickname',
        dataIndex: 'nickname',
        align: 'center',
        hideInSearch: true,
      },
      {
        title: intl.formatMessage({ id: 'pages.login.account' }),
        key: 'account',
        dataIndex: 'account',
        hideInSearch: true,
        align: 'center',
      },
      {
        title: intl.formatMessage({ id: 'user.userID' }),
        key: 'user_id',
        dataIndex: 'user_id',
        align: 'center',
        hideInSearch: true,
      },
      {
        title: '签到日期',
        key: 'date',
        dataIndex: 'date',  // 数据来自 checkin 表，展示使用 date 字段（签到日），非 created_at
        align: 'center',
        hideInSearch: true,
        render: (_, record) => formatUTCDateOnlyToBeijing(record.date),
      },
      {
        title: '连续签到天数',
        key: 'streak',
        dataIndex: 'streak',
        align: 'center',
        hideInSearch: true,
        render: (_, record) => (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '28px',
            height: '24px',
            padding: '0 8px',
            lineHeight: '24px',
            borderRadius: '12px',
            color: '#fff',
            background: '#1890ff',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
          }}>
            {record.streak}
          </div>
        ),
      },
      {
        title: '操作',
        key: 'action',
        align: 'center',
        hideInSearch: true,
        render: (_: any, record: any) => {
          return (
            <Button
              type="link"
              onClick={() => {
                setModalProps({
                  visible: true,
                  current_id: record.im_server_user_id,
                })
              }}
            >
              查看近期签到记录
            </Button>
          );
        },
      },
    ],
    [],
  );



  return (
    <PageContainer>
      <RecordModal
        visible={modalProps.visible}
        current_id={modalProps.current_id}
        onCancel={()=>{
          setModalProps({
            visible: false,
            current_id: '',
          })
        }}
      />
      <ProTable<API.UserManage.User>
        columns={columns}
        actionRef={actionRef}
        request={async (params = {}) => {
          const { current, pageSize, keyword, startTime, endTime } = params as any;
          const trimmedKeyword =
            typeof keyword === 'string' ? keyword.trim() : undefined;
          const finalKeyword =
            trimmedKeyword && trimmedKeyword.length > 0 ? trimmedKeyword : undefined;

          const { data } = await selectCheckInList({
            page: current,
            pageSize,
            keyword: finalKeyword,
            startTime,
            endTime,
            order: 'date',  // 以签到日期排序（降序，最新的日期在前）
          })

          const res = data.data.map((item) => {
            return {
              ...item,
              ...item.im_server_user_info,
              account: item.attribute.account,
            };
          });
          return {
            data: res,
            success: true,
            total: data.total,
          };
        }}
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          defaultPageSize: 10,
          showQuickJumper: true,
        }}
      />
    </PageContainer>
  );
};

export default UserList;
