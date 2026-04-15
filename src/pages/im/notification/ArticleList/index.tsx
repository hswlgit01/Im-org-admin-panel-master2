import { formatUTCTimeToBeijing } from '@/utils/common';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl, history } from '@umijs/max';
import { useMemo, useRef } from 'react';
import { selectArticleList, updateArticle } from '@/services/notification';
import { Button, message, Popconfirm, Space, Tag } from 'antd';

const status_map = {
  draft: '草稿',
  published: '已发布',
  offline: '已下架',
}
const status_color_map = {
  draft: 'blue',
  published: 'green',
  offline: 'orange',
}

const ArticleList = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();


  const columns: ProColumns<API.UserManage.User>[] = useMemo(
    () => [
      {
        key: 'index',
        dataIndex: 'index',
        valueType: 'indexBorder',
      },
      {
        title: '标题',
        key: 'title',
        dataIndex: 'title',
        align: 'center',
        hideInSearch: true,
      },
      {
        title: '状态',
        key: 'status',
        dataIndex: 'status',
        align: 'center',
        valueType: 'select',
        valueEnum: status_map,
        render: (_, record) => <Tag color={status_color_map[record.status]}>{status_map[record.status]}</Tag>
      },
      {
        title: '创建日期',
        key: 'created_at',
        dataIndex: 'created_at',
        align: 'center',
        hideInSearch: true,
        render: (_, record) => formatUTCTimeToBeijing(record.created_at),
      },
      {
        title: '更新日期',
        key: 'updated_at',
        dataIndex: 'updated_at',
        valueType: 'dateRange',
        align: 'center',
        render: (_, record) => formatUTCTimeToBeijing(record.created_at),
        fieldProps: {
          allowEmpty: [true, true],
        },
      },
      {
        title: '',
        key: 'action',
        hideInSearch: true,
        align: 'center',
        render: (_: any, record: any) => (
          <Space size="middle">
            <Button type='link' onClick={()=>toArticle(record.id)}>编辑</Button>
            {
              record.status !== 'published' &&  <Popconfirm
                title="确定要发布该文章吗?"
                onConfirm={async () => {
                  const params = {
                    id: record.id,
                    status: 'published'
                  }
                  await updateArticle(params);
                  message.success('操作成功');
                  actionRef.current?.reload();
                }}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link">
                  发布
                </Button>
              </Popconfirm>
            }
            {
              record.status === 'published' &&  <Popconfirm
                title="确定要下架该文章吗?"
                onConfirm={async () => {
                  const params = {
                    id: record.id,
                    status: 'offline'
                  }
                  await updateArticle(params);
                  message.success('操作成功');
                  actionRef.current?.reload();
                }}
                okText="确定"
                cancelText="取消"
              >
                <Button danger type="link">
                  下架
                </Button>
              </Popconfirm>
            }
          </Space>
        ),
      },
    ],
    [],
  );

  const toArticle = (id: string) => {
    history.push('/im/notification/article_list/article_detail', {
      id: id,
    });
  };

  return (
    <PageContainer>
      <ProTable<API.UserManage.User>
        columns={columns}
        actionRef={actionRef}
        request={async (params = {}) => {
          console.log(params, 'params');

          const searchParams = {
            pagination: {
              page: params.current,
              page_size: params.pageSize,
            },
            status: params.status,
          };
          if (params.updated_at) {
            if (params.updated_at[0]) {
              searchParams.start_time = new Date(params.updated_at[0]).getTime() / 1000;
            }
            if (params.updated_at[1]) {
              searchParams.end_time = new Date(params.updated_at[1]).getTime() / 1000;
            }
          }
          const { data } = await selectArticleList(searchParams);

          const tmpData = data.list || [];

          return {
            data: tmpData,
            success: true,
            total: data.total,
          };
        }}
        search={{
          labelWidth: 'auto',
        }}
        toolbar={{
          actions: [
            <Button key="key" type="primary" onClick={() => toArticle('0')}>
              创建文章
            </Button>,
          ],
        }}
        pagination={{
          defaultPageSize: 10,
          showQuickJumper: true,
        }}
      />
    </PageContainer>
  );
};

export default ArticleList;
