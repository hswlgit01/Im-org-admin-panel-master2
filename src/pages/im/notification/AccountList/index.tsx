import OIMAvatar from '@/components/OIMAvatar';
import {
  insertNotificationAccount,
  selectNotificationAccountsList,
  updateNotificationAccount,
} from '@/services/notification';
import { splitUpload } from '@/services/upload';
import { formatUTCTimeToBeijing } from '@/utils/common';
import { UploadOutlined } from '@ant-design/icons';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Form, Input, Modal, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { UploadRequestOption } from 'rc-upload/lib/interface';
import { useRef, useState } from 'react';

const customUpload = async (
  user_id: string,
  data: UploadRequestOption,
  reload?: (resetPageIndex?: boolean | undefined) => Promise<void>,
) => {
  try {
    const { url } = await splitUpload(data.file as File);
    if (url) {
      await updateNotificationAccount({
        user_id,
        face_url: url,
        appMangerLevel: 3,
      });
      reload?.();
    }
  } catch (error) {
    console.log(error);
  }
};

const normFile = (e: any) => {
  if (Array.isArray(e)) {
    return e;
  }
  e?.fileList?.forEach((file: UploadFile) => {
    file.status = 'done';
  });
  return e?.fileList;
};

const AccountList = () => {
  const intl = useIntl();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const actionRef = useRef<ActionType>();

  const columns: ProColumns<API.NotificationManage.Account>[] = [
    {
      key: 'index',
      dataIndex: 'index',
      valueType: 'indexBorder',
    },
    {
      title: intl.formatMessage({ id: 'user.keyword' }),
      key: 'keyword',
      dataIndex: 'keyword',
      editable: false,
      hideInTable: true,
      align: 'center',
    },
    {
      title: intl.formatMessage({ id: 'user.faceURL' }),
      dataIndex: 'face_url',
      key: 'face_url',
      hideInSearch: true,
      editable: false,
      align: 'center',
      render(_, record, __, action) {
        return (
          <Upload
            accept="image/*"
            customRequest={(option) => customUpload(record.user_id, option, action?.reload)}
            showUploadList={false}
            className="cursor-pointer"
            disabled={!isEditing}
          >
            <OIMAvatar preview={!isEditing} src={record.face_url} text={record.nickname} />
          </Upload>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'user.nickname' }),
      key: 'nickname',
      dataIndex: 'nickname',
      hideInSearch: true,
      align: 'center',
    },
    {
      title: intl.formatMessage({ id: 'user.userID' }),
      key: 'user_id',
      dataIndex: 'user_id',
      editable: false,
      hideInSearch: true,
      align: 'center',
    },
    {
      title: '创建时间',
      key: 'created_at',
      dataIndex: 'created_at',
      align: 'center',
      render: (created_at) => formatUTCTimeToBeijing(new Date(created_at * 1000).toISOString()),
      editable: false,
      hideInSearch: true,
    },
    {
      title: '',
      valueType: 'option',
      key: 'option',
      align: 'center',
      render: (_, record, __, action) => {
        return (
          <a
            key="editable"
            onClick={() => {
              action?.startEditable?.(record.user_id);
              setIsEditing(true);
            }}
          >
            {intl.formatMessage({ id: 'edit' })}
          </a>
        );
      },
    },
  ];

  const confirmAdd = async ({
    nickname,
    avatar,
  }: {
    nickname: string;
    avatar: UploadFile[];
  }) => {
    setAdding(true);
    try {
      const { url } = await splitUpload(avatar[0].originFileObj as File);
      if (!url) {
        throw Error('splitUpload error');
      }
      await insertNotificationAccount({ nickname: nickname.trim(), face_url: url });
      actionRef.current?.reload();
    } catch (error) {
      console.log(error);
    }
    setAdding(false);
    setAddModalVisible(false);
  };

  return (
    <PageContainer>
      <Modal
        title={intl.formatMessage({ id: 'add' })}
        width={400}
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
        }}
        centered
        destroyOnClose
        footer={null}
      >
        <Form onFinish={confirmAdd} labelCol={{ span: 6 }}>
          <Form.Item
            name="avatar"
            label={intl.formatMessage({ id: 'user.faceURL' })}
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[{ required: true, message: intl.formatMessage({ id: 'user.faceURL.tips' }) }]}
          >
            <Upload
              name="avatar"
              accept="image/*"
              customRequest={() => { }}
              listType="picture"
              maxCount={1}
              multiple={false}
            >
              <Button icon={<UploadOutlined />}>{intl.formatMessage({ id: 'api.upload' })}</Button>
            </Upload>
          </Form.Item>
          <Form.Item
            name="nickname"
            label={intl.formatMessage({ id: 'user.nickname' })}
            rules={[{ required: true, message: intl.formatMessage({ id: 'user.nickname.tips' }) }]}
          >
            <Input placeholder={intl.formatMessage({ id: 'user.nickname.tips' })} />
          </Form.Item>

          {/* <Form.Item
            name="user_id"
            label={intl.formatMessage({ id: 'user.user_id' })}
            rules={[{ required: true, message: intl.formatMessage({ id: 'user.user_id.tips' }) }]}
          >
            <Input placeholder={intl.formatMessage({ id: 'user.user_id.tips' })} />
          </Form.Item> */}

          <div className="ml-[20%]">
            <Button type="primary" htmlType="submit" loading={adding}>
              {intl.formatMessage({ id: 'confirm' })}
            </Button>
          </div>
        </Form>
      </Modal>
      <ProTable<API.NotificationManage.Account>
        columns={columns}
        actionRef={actionRef}
        toolbar={{
          actions: [
            <Button
              key={'add'}
              type="primary"
              onClick={() => {
                setAddModalVisible(true);
              }}
            >
              {intl.formatMessage({ id: 'add' })}
            </Button>,
          ],
          settings: [],
        }}
        request={async (params = {}) => {
          const { data } = await selectNotificationAccountsList({
            keyword: params.keyword,
            pagination: {
              page: params.current as number,
              page_size: params.pageSize as number,
            },
          });

          return {
            data: data.list ?? [],
            success: true,
            total: data.total,
          };
        }}
        editable={{
          type: 'multiple',
          actionRender: (_, __, doms) => {
            return [doms.save, doms.cancel];
          },
          onSave: (_, record) => {
            setIsEditing(false);
            return updateNotificationAccount({
              user_id: record.user_id,
              nickname: record.nickname,
              face_url: record.face_url,
            });
          },
        }}
        rowKey="user_id"
        pagination={{
          defaultPageSize: 10,
          showQuickJumper: true,
        }}
        search={{
          labelWidth: 'auto',
        }}
        scroll={{ x: 'max-content' }}
      />
    </PageContainer>
  );
};

export default AccountList;
