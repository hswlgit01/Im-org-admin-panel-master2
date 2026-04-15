import { getSomeGroupMemberList } from '@/services/group';
import { getOrganizationUsers } from '@/services/group-new';
import { SearchOutlined } from '@ant-design/icons';
import { ActionType, FormInstance, ProColumns, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Input } from 'antd';
import {
  ForwardRefRenderFunction,
  Key,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import OIMAvatar from '../OIMAvatar';
import { selectMemberList } from '@/services/account';

export type SelectedRowDataItem = Record<
  number,
  {
    keys: React.Key[];
    items: API.UserManage.User[];
  }
>;

type SelectUserTableProps = {
  selectType?: 'radio' | 'checkbox';
  groupID?: string;
  defaultSelected?: React.Key[];
  disabledData?: string[];
  onSelectedChange?: (data: API.UserManage.User[], keys: React.Key[]) => void;
  onlyAdmin?: boolean;
  filterIds?: string[];
};

export type SelectUserTableHandle = {
  clearSelect: () => void;
  cancelSelect: (value: string) => void;
};

const SelectUserTable: ForwardRefRenderFunction<SelectUserTableHandle, SelectUserTableProps> = (
  props,
  ref,
) => {
  const { selectType, defaultSelected, groupID, disabledData, onSelectedChange, onlyAdmin, filterIds } = props;
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();

  const [idList, setIdList] = useState<Key[]>([]);
  const [inGroupUserList, setInGroupUserList] = useState<string[]>([]);

  useEffect(() => {
    setIdList(defaultSelected ?? []);
  }, [defaultSelected]);

  const onSelectChange = (keys: React.Key[], items: API.UserManage.User[]) => {
    setIdList(keys);
    if (onSelectedChange) {
      onSelectedChange(items, keys);
    }
  };

  const getCheckboxProps = (record: API.UserManage.User) => {
    if (groupID) {
      console.log('inGroupUserList is ', inGroupUserList);
      const disabledList = [...inGroupUserList, ...(disabledData ?? [])];
      return { disabled: disabledList?.includes(record.userID), name: record.nickname };
    }

    return { disabled: disabledData?.includes(record.userID) || disabledData?.includes(record.userImID), name: record.nickname };
  };

  const cancelSelect = (userID: string) => {
    setIdList(idList.filter((id) => id !== userID));
  };

  const clearSelect = () => {
    actionRef.current?.clearSelected!();
  };

  useImperativeHandle(ref, () => ({
    cancelSelect,
    clearSelect,
  }));

  const columns: ProColumns<API.UserManage.User>[] = useMemo(
    () => [
      {
        title: intl.formatMessage({ id: 'user.faceURL' }),
        dataIndex: 'faceURL',
        key: 'faceURL',
        hideInSearch: true,
        align: 'center',
        render: (_, record) => <OIMAvatar src={record.faceURL} text={record.nickname} />,
      },
      {
        title: intl.formatMessage({ id: 'user.nickname' }),
        key: 'nickname',
        dataIndex: 'nickname',
        hideInSearch: true,
        ellipsis: true,
        align: 'center',
      },
      {
        title: intl.formatMessage({ id: 'pages.login.account' }),
        key: 'account',
        dataIndex: 'account',
        align: 'center',
        ellipsis: true,
        hideInSearch: true,
      },
      {
        title: '',
        key: 'keyword',
        dataIndex: 'keyword',
        hideInTable: true,
        hideInSearch: false,
        renderFormItem: () => {
          return (
            <div className="mb-[-32px]">
              <div className="font-medium mb-4">{intl.formatMessage({ id: 'user.keyword' })}</div>
              <Input
                className=" w-[360px]"
                onChange={(e) => {
                  formRef.current?.setFieldValue('keyword', e.target.value);
                }}
                prefix={<SearchOutlined />}
              />
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <ProTable<API.UserManage.User>
      search={{
        optionRender: false,
      }}
      size="small"
      columns={columns}
      rowSelection={{
        columnTitle: '',
        selectedRowKeys: idList,
        type: selectType,
        onChange: onSelectChange,
        getCheckboxProps,
        preserveSelectedRowKeys: true,
      }}
      tableAlertRender={false}
      tableAlertOptionRender={false}
      actionRef={actionRef}
      formRef={formRef}
      columnsState={{
        defaultValue: {
          option: {
            fixed: 'right',
          },
        },
        persistenceKey: 'user_table_insearch',
        persistenceType: 'sessionStorage',
      }}
      request={async (params = {}) => {
        if (onlyAdmin) {
          const { data } = await selectMemberList({
            roles: ['GroupManager', 'TermManager'],
            page: params.current as number,
            pageSize: params.pageSize as number,
            keyword: params.keyword,
          })
          const tmpData = data.data.map(item => ({
            userID: item.user_id,
            userImID: item.im_server_user_id,
            password: '',
            account: item.attribute.account,
            phoneNumber: item.attribute.phone_number,
            areaCode: item.attribute.area_code,
            email: item.attribute.email,
            nickname: item.user.nickname,
            faceURL: item.user.face_url,
            gender: item.attribute.gender,
            level: item.attribute.level,
            birth: 0,
            allowAddFriend: item.attribute.allow_add_friend,
            allowBeep: item.attribute.allow_beep,
            allowVibration: item.attribute.allow_vibration,
            globalRecvMsgOpt: item.attribute.global_recv_msg_opt,
            registerType: item.attribute.register_type,
          }))

          return {
            data: tmpData,
            success: true,
            total: data?.total || 0,
          };
        }
        const { data } = await selectMemberList({
          roles: ['GroupManager', 'TermManager', 'Normal'],
          page: params.current as number,
          pageSize: params.pageSize as number,
          keyword: params.keyword,
        })
        // const { data } = await getOrganizationUsers({
        //   ...params,
        //   keyword: params.keyword,
        //   pagination: {
        //     pageNumber: params.current as number,
        //     showNumber: params.pageSize as number,
        //   },
        // });
        let tmpData = data.data.map(item => ({
          userID: item.user_id,
          userImID: item.im_server_user_id,
          password: '',
          account: item.attribute.account,
          phoneNumber: item.attribute.phone_number,
          areaCode: item.attribute.area_code,
          email: item.attribute.email,
          nickname: item.user.nickname,
          faceURL: item.user.face_url,
          gender: item.attribute.gender,
          level: item.attribute.level,
          birth: 0,
          allowAddFriend: item.attribute.allow_add_friend,
          allowBeep: item.attribute.allow_beep,
          allowVibration: item.attribute.allow_vibration,
          globalRecvMsgOpt: item.attribute.global_recv_msg_opt,
          registerType: item.attribute.register_type,
        }))
        if (groupID) {
          const { data: groupData } = await getSomeGroupMemberList({
            groupID,
            userIDs: tmpData.map((item: API.UserManage.User) => item.userImID),
          });
          setInGroupUserList(
            ((groupData.members as API.UserManage.User[]) || []).map((user) => tmpData.find(v => v.userImID === user.userID).userID),
          );
        }
        if (filterIds && filterIds.length) {
          console.log('tmpData', tmpData);
          console.log('filterIds', filterIds);

          tmpData = tmpData.filter(v => !filterIds.includes(v.userID))
        }

        return {
          data: tmpData,
          success: true,
          total: data?.total || 0,
        };
      }}
      rowKey="userID"
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: false,
      }}
      toolbar={{
        actions: [],
        settings: [],
      }}
    />
  );
};

export default forwardRef(SelectUserTable);
