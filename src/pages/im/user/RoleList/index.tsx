import { selectRolePermissions, updateRolePermissions } from '@/services/user';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { PageContainer, ProTable, ModalForm, ProFormCheckbox } from '@ant-design/pro-components';
import { Button, message, Form, Tooltip } from 'antd';
import { useEffect, useState } from 'react';


const permission_code_list = [
    {
        label: '修改昵称',
        value: 'modify_nickname',
    },
    {
        label: (
            <span>
                发送文件
                <Tooltip title="允许在单聊/群聊中发送文件类消息">
                    <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
            </span>
        ),
        value: 'send_file',
    },
    {
        label: (
            <span>
                发送名片
                <Tooltip title="允许在单聊/群聊中发送名片类消息">
                    <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
            </span>
        ),
        value: 'send_business_card',
    },
    {
        label: (
            <span>
                建群
                <Tooltip title="允许创建群组">
                    <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
            </span>
        ),
        value: 'create_group',
    },
    {
        label: (
            <span>
                加好友
                <Tooltip title="允许发起添加好友申请">
                    <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
            </span>
        ),
        value: 'add_friend',
    },
    {
        label: (
            <span>
                非好友可私聊
                <Tooltip title="勾选后，该角色成员无需先加好友即可发起单聊">
                    <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
            </span>
        ),
        value: 'free_private_chat',
    },
    {
        label: <div>允许发送红包</div>,
        value: 'send_red_packet',
    },
    {
        label: <div>允许转账</div>,
        value: 'transfer',
    },
    {
        label: <div>允许签到</div>,
        value: 'checkin',
    },
    {
        label: <div>允许抽奖</div>,
        value: 'lottery',
    },
    {
        label: <div>允许开启直播</div>,
        value: 'livestream',
    },
    {
        label: (
            <div>
                官方账号保护 &nbsp;
                <Tooltip title="拥有此权限的用户不能被发起音视频通话、踢出群组、禁言">
                    <QuestionCircleOutlined />
                </Tooltip>
            </div>
        ),
        value: 'official_protection',
    },

]
const RoleList = () => {
    const [form] = Form.useForm<{ permissions_code: string[] }>();

    const [permissionsObj, setPermissionObj] = useState<Record<string, string[]>>({
        Normal: [],
        GroupManager: [],
        TermManager: [],
    });
    useEffect(() => {
        selectTableData();
    }, [])

    const selectTableData = async () => {
        const { data: normalPermissions } = await selectRolePermissions({ role: 'Normal' });
        const { data: groupManagerPermissions } = await selectRolePermissions({ role: 'GroupManager' });
        const { data: termManagerPermissions } = await selectRolePermissions({ role: 'TermManager' });
        const normalPermissionCode = normalPermissions.map((item) => item.permission_code);
        const groupManagerPermissionCode = groupManagerPermissions.map((item) => item.permission_code);
        const termManagerPermissionCode = termManagerPermissions.map((item) => item.permission_code);
        setPermissionObj({
            Normal: normalPermissionCode,
            GroupManager: groupManagerPermissionCode,
            TermManager: termManagerPermissionCode,
        })
    }

    const tableData = [
        {
            name: '管理员',
            code: 'GroupManager',
            permissions: permissionsObj.GroupManager,
        },
        {
            name: '团队长',
            code: 'TermManager',
            permissions: permissionsObj.TermManager,
        },
        {
            name: '普通用户',
            code: 'Normal',
            permissions: permissionsObj.Normal,
        },
    ]

    const columns = [
        {
            title: '角色名称',
            key: 'name',
            dataIndex: 'name',
            editable: false,
            align: 'center',
        },
        {
            title: '角色编码',
            dataIndex: 'code',
            key: 'code',
            editable: false,
            align: 'center',
        },
        {
            title: '角色权限',
            key: 'permissions',
            dataIndex: 'permissions',
            render: (permissions: string[]) => {
                if (!permissions?.length) {
                    return <span style={{ color: '#999' }}>-</span>;
                }
                return (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6,
                            textAlign: 'center',
                            lineHeight: 1.5,
                        }}
                    >
                        {permissions.map((code) => {
                            const permission = permission_code_list.find((v) => v.value === code);
                            return (
                                <div key={code} style={{ width: '100%' }}>
                                    {permission ? permission.label : code}
                                </div>
                            );
                        })}
                    </div>
                );
            },
            align: 'center',

        },
        {
            title: '操作',
            valueType: 'option',
            key: 'option',
            align: 'center',
            render: (_, record) => (
                <ModalForm<{
                    permissions_code: string[];
                }>
                    id={record.code}
                    title="设置权限"
                    trigger={
                        <Button type="link" onClick={() => {
                            form.setFieldValue('permissions_code', permissionsObj[record.code]);
                        }}>
                            设置权限
                        </Button>
                    }
                    form={form}
                    autoFocusFirstInput
                    modalProps={{
                        destroyOnClose: true,
                        onCancel: () => {
                            form.resetFields(['permissions_code']);
                        },
                    }}
                    submitTimeout={2000}
                    onFinish={async (values) => {
                        const params = {
                            role: record.code,
                            permissions_code: values.permissions_code
                        }
                        await updateRolePermissions(params);
                        selectTableData();
                        message.success('提交成功');
                        return true;
                    }}
                >
                    <ProFormCheckbox.Group
                        name="permissions_code"
                        label="设置权限"
                        options={permission_code_list}
                    />
                </ModalForm>
            ),
        },
    ]

    return (
        <PageContainer>
            <ProTable
                columns={columns}
                search={false}
                rowKey="code"
                dataSource={tableData}
            />
        </PageContainer>
    );
};

export default RoleList;
