import OIMAvatar from '@/components/OIMAvatar';
import { updateUserRole } from '@/services/account';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useIntl } from '@umijs/max';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatUTCDateOnlyToBeijing } from '@/utils/common';
import { Space, message, Modal, Button } from 'antd';
import { selectCheckInList } from '@/services/checkin';
import SupplementModal from './SupplementModal';
import FixModal from './FixModal';


interface IRecordModalProps {
    visible: boolean;
    onCancel: () => void;
    current_id: string;
}
const RecordModal = (props: IRecordModalProps) => {
    const { visible, onCancel, current_id } = props;

    const intl = useIntl();

    // 添加tableActionRef，用于手动触发表格刷新
    const tableActionRef = useRef<ActionType>();

    // 添加补签和修复弹窗状态
    const [supplementModalVisible, setSupplementModalVisible] = useState(false);
    const [fixModalVisible, setFixModalVisible] = useState(false);

    // 使用useEffect监听current_id变化，触发表格重新加载
    useEffect(() => {
        if (visible && current_id && tableActionRef.current) {
            // 当用户ID变化时，刷新表格数据
            tableActionRef.current.reload();
        }
    }, [visible, current_id]);

    const columns: ProColumns<API.UserManage.User>[] = useMemo(
        () => [
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

        ],
        [],
    );
    return (
        <Modal
            title="近期签到记录"
            open={visible}
            onCancel={onCancel}
            footer={
                <Space>
                    <Button
                        onClick={() => setFixModalVisible(true)}
                    >
                        修复
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => setSupplementModalVisible(true)}
                    >
                        补签
                    </Button>
                </Space>
            }
            width={900}
            destroyOnClose={true} // 更改为destroyOnClose属性，确保关闭时完全销毁
            key={`checkin-records-${current_id}`} // 添加key属性，确保不同用户有不同的Modal实例
        >
            <SupplementModal
                visible={supplementModalVisible}
                current_id={current_id}
                username="用户"
                onCancel={() => setSupplementModalVisible(false)}
                onSuccess={() => {
                    if (tableActionRef.current) {
                        tableActionRef.current.reload();
                    }
                    setSupplementModalVisible(false);
                }}
            />
            <FixModal
                visible={fixModalVisible}
                current_id={current_id}
                username="用户"
                onCancel={() => setFixModalVisible(false)}
                onSuccess={() => {
                    if (tableActionRef.current) {
                        tableActionRef.current.reload();
                    }
                    setFixModalVisible(false);
                }}
            />
            <ProTable<API.UserManage.User>
                actionRef={tableActionRef}
                columns={columns}
                search={false}
                params={{ userId: current_id }} // 作为依赖参数，当 current_id 变化时触发表格刷新
                request={async (params = {}) => {
                    console.log('查询签到记录，用户ID:', current_id); // 添加日志
                    const { data } = await selectCheckInList({
                        page: params.current,
                        pageSize: params.pageSize,
                        imServerUserId: current_id,
                        keyword: undefined, // 不再走模糊搜索，只按精确ID过滤
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
                pagination={{
                    defaultPageSize: 10,
                    showQuickJumper: true,
                    showSizeChanger: true,
                    pageSizeOptions: [10, 20, 50, 100],
                }}
            />

        </Modal>

    )
}

export default RecordModal;
