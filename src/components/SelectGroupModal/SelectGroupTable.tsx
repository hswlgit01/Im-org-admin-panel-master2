import { getGroupList } from '@/services/group-new';
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

export type SelectedRowDataItem = Record<
  number,
  {
    keys: React.Key[];
    items: API.GroupManage.GroupInfo[];
  }
>;

type SelectGroupTableProps = {
  selectType?: 'radio' | 'checkbox';
  defaultSelected?: React.Key[];
  disabledData?: string[];
  onSelectedChange?: (data: API.GroupManage.GroupInfo[], keys: React.Key[]) => void;
};

export type SelectGroupTableHandle = {
  clearSelect: () => void;
  cancelSelect: (value: string) => void;
};

const SelectGroupTable: ForwardRefRenderFunction<SelectGroupTableHandle, SelectGroupTableProps> = (
  props,
  ref,
) => {
  const { selectType, defaultSelected, disabledData, onSelectedChange } = props;
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();

  const [idList, setIdList] = useState<Key[]>([]);

  useEffect(() => {
    setIdList(defaultSelected ?? []);
  }, [defaultSelected]);

  const onSelectChange = (keys: React.Key[], items: API.GroupManage.GroupInfo[]) => {
    setIdList(keys);
    if (onSelectedChange) {
      onSelectedChange(items, keys);
    }
  };

  const getCheckboxProps = (record: API.GroupManage.GroupInfo) => {
    return {
      disabled: disabledData?.includes(record.groupID),
      name: record.groupName
    };
  };

  const cancelSelect = (groupID: string) => {
    setIdList(idList.filter((id) => id !== groupID));
  };

  const clearSelect = () => {
    actionRef.current?.clearSelected!();
  };

  useImperativeHandle(ref, () => ({
    cancelSelect,
    clearSelect,
  }));

  const columns: ProColumns<API.GroupManage.GroupInfo>[] = useMemo(
    () => [
      {
        title: intl.formatMessage({ id: 'group.faceURL' }),
        dataIndex: 'faceURL',
        key: 'faceURL',
        hideInSearch: true,
        align: 'center',
        // dawn 2026-06-15 修复默认群组选择弹窗群头像破图：群头像加载失败时使用默认群图标兜底。
        render: (_, record) => <OIMAvatar src={record.faceURL} text={record.groupName} isgroup />,
      },
      {
        title: intl.formatMessage({ id: 'group.groupName' }),
        key: 'groupName',
        dataIndex: 'groupName',
        hideInSearch: true,
        ellipsis: true,
        align: 'center',
      },
      {
        title: intl.formatMessage({ id: 'group.groupID' }),
        key: 'groupID',
        dataIndex: 'groupID',
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
                placeholder={intl.formatMessage({ id: 'group.groupID' }) + '/' + intl.formatMessage({ id: 'group.groupName' })}
              />
            </div>
          );
        },
      },
    ],
    [intl],
  );

  return (
    <ProTable<API.GroupManage.GroupInfo>
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
        persistenceKey: 'group_table_insearch',
        persistenceType: 'sessionStorage',
      }}
      request={async (params = {}) => {
        try {
          const { data } = await getGroupList({
            keyword: params.keyword || '',
            pagination: {
              pageNumber: params.current as number,
              showNumber: params.pageSize as number,
            },
          });

          console.log('Group list API response:', data);

          return {
            data: data?.data || [],
            success: true,
            total: data?.total || 0,
          };
        } catch (error) {
          console.error('Get group list error:', error);
          return {
            data: [],
            success: false,
            total: 0,
          };
        }
      }}
      rowKey="groupID"
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

export default forwardRef(SelectGroupTable);
