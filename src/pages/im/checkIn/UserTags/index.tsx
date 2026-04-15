import { deleteUserTag, insertUserTag, selectUserTagsList, updateUserTag } from '@/services/checkin';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { history, useIntl } from '@umijs/max';
import { useMemo, useRef, useState } from 'react';
import { formatUTCTimeToBeijing } from '@/utils/common';
import { Button, Form, Popconfirm, Space, message } from 'antd';

export type DrawerOptions = {
  visible: boolean;
  selectUser: API.UserManage.User | undefined;
};


const UserList = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const [drawerOptions, setDrawerOptions] = useState<DrawerOptions>({
    visible: false,
    selectUser: undefined,
  });



  const [selectedUserID, setSelectUserID] = useState('');
  const toRelationListHandler = (userId: string) => {
    history.push('/im/user/relation_list?userID=' + userId);
  };

  const modifyUserRole = async (user_id: string, role: string) => {
    await updateUserRole({ user_id, role: role === 'GroupManager' ? 'Normal' : 'GroupManager' });
    message.success('操作成功');
    actionRef.current?.reload();
  };

  const columns: ProColumns<API.UserManage.User>[] = useMemo(
    () => [
      {
        key: 'index',
        dataIndex: 'index',
        valueType: 'indexBorder',
      },
      {
        title: '标签名称',
        key: 'tag_name',
        dataIndex: 'tag_name',
        align: 'center',
      },

      {
        title: '描述',
        key: 'description',
        dataIndex: 'description',
        align: 'center',
        hideInSearch: true,
      },
      {
        title: '创建时间',
        key: 'created_at',
        dataIndex: 'created_at',
        align: 'center',
        hideInSearch: true,
        render: (created_at) => formatUTCTimeToBeijing(created_at),
      },
      {
        title: '操作',
        key: 'action',
        align: 'center',
        hideInSearch: true,
        render: (_: any, record: any) => (
          <Space size="middle">
            <ModifyModel initData={record} />
            {/* <Popconfirm
              title="确定要删除此标签吗?"
              onConfirm={async () => {
                modifyUserRole(record.user_id, record.role);
                await deleteUserTag({
                  im_user_server_id: record.a,
                  tag_ids: [record.]
                })
              }}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger>
                删除
              </Button>
            </Popconfirm> */}
          </Space>
        ),
      },
    ],
    [],
  );

  const ModifyModel = (modalProps) => {
    const { initData } = modalProps;
    const [form] = Form.useForm();
    return (
      <ModalForm
        title="新增标签"
        trigger={
          <Button
            type={initData ? 'link' : 'primary'}
            onClick={() => {
              if (initData) {
                form.setFieldsValue(initData);
              }
            }}
          >
            {initData ? '编辑' : '新增标签'}
          </Button>
        }
        form={form}
        autoFocusFirstInput
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            form.resetFields();
          },
        }}
        submitTimeout={2000}
        onFinish={async (values) => {
          if (initData) {
            await updateUserTag({
              ...values,
              tag_id: initData.id,
            });
          } else {
            await insertUserTag(values);
          }
          message.success('提交成功');
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText name="tag_name" label="标签名称" />
        <ProFormTextArea name="description" label="描述" />
      </ModalForm>
    );
  };

  return (
    <PageContainer>
      <ProTable<API.UserManage.User>
        columns={columns}
        actionRef={actionRef}
        request={async (params = {}) => {
          const { data } = await selectUserTagsList({
            page: params.current,
            pageSize: params.pageSize,
            tag_name: params.tag_name,
          });
          const res = data.data || [];
          // await attachInfo(tmpData);
          return {
            data: res,
            success: true,
            total: data.total,
          };
        }}
        search={{
          labelWidth: 'auto',
        }}
        toolBarRender={() => <ModifyModel />}
        pagination={{
          defaultPageSize: 10,
          showQuickJumper: true,
        }}
      />
    </PageContainer>
  );
};

export default UserList;
