import SelectUserModal, {
  SelectModalOptions,
  SelectedListItem,
} from '@/components/SelectUserModal';
import { addDefaultFriends, getDefaultFriends, removeDefaultFriends, selectDefaultUserList } from '@/services/default';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Popconfirm, message } from 'antd';
import { useMemo, useRef, useState } from 'react';
import OIMAvatar from '@/components/OIMAvatar';

const DefaultFriends = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const [selectModalOptions, setSelectModalOptions] = useState<SelectModalOptions>({
    open: false,
    selectType: 'member',
    disabledData: [],
  });

  const closeSelectModal = () => {
    setSelectModalOptions({
      open: false,
      selectType: 'member',
       disabledData: [],
    });
  };

  const selectedCallBack = async (data: SelectedListItem) => {
    const userIDs = data.data.map((user) => user.userImID);
    try {
      await addDefaultFriends(userIDs);
      message.success(intl.formatMessage({ id: 'api.success' }));
      actionRef.current?.reload();
    } catch (error) {
      console.log(error);
    }
  };

  const removeDefaultFriendsHandler = async (userID: string) => {
    try {
      await removeDefaultFriends([userID]);
      message.success(intl.formatMessage({ id: 'api.success' }));
      actionRef.current?.reload();
    } catch (error) {
      console.log(error);
    }
  };

  const columns: ProColumns<API.DefaultManage.DefaultFriends>[] = useMemo(
    () => [
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
        align: 'center',
        render: (_, record) => <OIMAvatar src={record.user.face_url} text={record.nickname} />,
      },
      {
        title: intl.formatMessage({ id: 'user.userID' }),
        dataIndex: 'im_server_user_id',
        key: 'im_server_user_id',
        align: 'center',
        hideInSearch: true,
        render: (_, record) => record.organization_user.user_id
      },
      {
        title: intl.formatMessage({ id: 'user.nickname' }),
        key: 'nickname',
        hideInSearch: true,
        align: 'center',
        render: (_, record) => <span>{record.user.nickname}</span>,
      },
      {
        title: intl.formatMessage({ id: 'pages.login.account' }),
        dataIndex: 'account',
        key: 'account',
        align: 'center',
        hideInSearch: true,
        render: (_, record) => <span>{record.attribute.account}</span>,
      },
      {
        title: '',
        valueType: 'option',
        key: 'option',
        align: 'center',
        render: (_, record) => (
          <Popconfirm
            key={'remove'}
            title={intl.formatMessage({ id: 'user.removeDefaultFriends.tips' })}
            onConfirm={() => removeDefaultFriendsHandler(record.im_server_user_id)}
          >
            <a>{intl.formatMessage({ id: 'remove' })}</a>
          </Popconfirm>
        ),
      },
    ],
    [],
  );

  return (
    <PageContainer>
      <SelectUserModal
        selectModalOptions={selectModalOptions}
        selectedCallBack={selectedCallBack}
        closeSelectModal={closeSelectModal}
      />
      <ProTable<API.DefaultManage.DefaultFriends>
        columns={columns}
        actionRef={actionRef}
        request={async (params = {}) => {
          const { data } = await getDefaultFriends({
            keyword: params.keyword,
            page: params.current as number,
            page_size: params.pageSize as number,
          });
          return {
            data: data.data ?? [],
            success: true,
            total: data.total ?? 0,
          };
        }}
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          defaultPageSize: 10,
        }}
        toolbar={{
          actions: [
            <Button
              key={'add'}
              type="primary"
              onClick={async() => {
                const res = await selectDefaultUserList();
                console.log('res: ', res.data);
                
                setSelectModalOptions({
                  open: true,
                  selectType: 'member',
                   disabledData: res.data.im_user_ids,
                });
              }}
            >
              {intl.formatMessage({ id: 'add' })}
            </Button>,
          ],
          settings: [],
        }}
      />
    </PageContainer>
  );
};

export default DefaultFriends;
