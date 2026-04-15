import { useState } from 'react';
import { Table, Avatar, Tag, Button, Space, message } from 'antd';
import { TeamOutlined, UserOutlined, ReloadOutlined, ToolOutlined } from '@ant-design/icons';
import { useIntl, useRequest } from '@umijs/max';
import { getHierarchyChildren } from '@/services/hierarchy';
import { formatDate } from '@/utils/date';

interface DirectDownlineProps {
  userId: string;
}

const DirectDownline: React.FC<DirectDownlineProps> = ({ userId }) => {
  const intl = useIntl();
  const [pageNumber, setPageNumber] = useState(1);
  // 为虚拟根节点使用更大的默认分页大小
  const [pageSize, setPageSize] = useState(() => {
    // 检测是否是虚拟根节点，如果是则使用更大的默认分页大小
    if (userId && userId.startsWith('ORG_ROOT_')) {
      return 50; // 虚拟根节点使用更大的分页大小
    }
    return 10; // 普通节点使用标准分页大小
  });

  // 是否是虚拟根节点
  const isRootNode = userId && userId.startsWith('ORG_ROOT_');

  // Fetch direct downline users
  const { data, loading, refresh } = useRequest(
    () => {
      // 对于虚拟根节点，始终使用较大的分页大小
      const effectivePageSize = isRootNode ? Math.max(pageSize, 50) : pageSize;


      return getHierarchyChildren({
        user_id: userId,
        page_number: pageNumber,
        show_number: effectivePageSize,
      }).then(res => {
        console.log(`【DirectDownline】获取用户 ${userId} 的直接下级响应:`, res);
        // 额外记录响应格式，以便调试
        const responseStructure = {
          hasData: !!res?.data,
          hasDataChildren: !!res?.data?.children,
          dataChildrenLength: res?.data?.children?.length,
          hasDataResult: !!res?.data?.result,
          hasDataUsers: !!res?.data?.users,
          hasChildren: !!res?.children,
          childrenLength: res?.children?.length,
          hasUsers: !!res?.users,
          usersLength: res?.users?.length,
          hasResult: !!res?.result
        };
        console.log(`【DirectDownline】响应结构分析:`, responseStructure);
        return res;
      }).catch(err => {
        console.error(`【DirectDownline】获取用户 ${userId} 的直接下级出错:`, err);
        throw err;
      });
    },
    {
      refreshDeps: [userId, pageNumber, pageSize],
    }
  );

  // Table columns definition
  const columns = [
    {
      title: intl.formatMessage({
        id: 'pages.hierarchyManagement.directDownline.user',
        defaultMessage: '用户',
      }),
      key: 'user',
      render: (_, record: API.Hierarchy.UserHierarchyInfo) => {
        // 检查是否是组织节点
        const isOrgNode = record.user_type === 'ORGANIZATION' ||
                         (record.user_id && typeof record.user_id === 'string' &&
                          record.user_id.startsWith('ORG_ROOT_'));

        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={isOrgNode ? undefined : record.face_url}
              icon={isOrgNode ? <TeamOutlined /> : <UserOutlined />}
              size="small"
              style={{
                marginRight: '8px',
                backgroundColor: isOrgNode ? '#722ed1' : undefined
              }}
            />
            <div>
              <div style={{ color: isOrgNode ? '#722ed1' : undefined }}>
                {record.nickname}
                {isOrgNode && <Tag color="purple" style={{ marginLeft: '8px' }}>组织</Tag>}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                {record.account || '未设置账号'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.hierarchyManagement.directDownline.level',
        defaultMessage: '层级',
      }),
      dataIndex: 'level',
      key: 'level',
      render: (level: number, record: API.Hierarchy.UserHierarchyInfo) => {
        // 检查是否是组织节点
        const isOrgNode = record.user_type === 'ORGANIZATION' ||
                         (record.user_id && typeof record.user_id === 'string' &&
                          record.user_id.startsWith('ORG_ROOT_'));

        if (isOrgNode) {
          return <Tag color="purple">组织根节点</Tag>;
        }

        return <Tag color="blue">Lv{level}</Tag>;
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.hierarchyManagement.directDownline.teamSize',
        defaultMessage: '团队规模',
      }),
      dataIndex: 'team_size',
      key: 'team_size',
      render: (teamSize: number) => <Tag color="green">{teamSize}</Tag>,
    },
    {
      title: intl.formatMessage({
        id: 'pages.hierarchyManagement.directDownline.directDownline',
        defaultMessage: '直接下级',
      }),
      dataIndex: 'direct_downline_count',
      key: 'direct_downline_count',
      render: (count: number) => <Tag>{count}</Tag>,
    },
    {
      title: intl.formatMessage({
        id: 'pages.hierarchyManagement.directDownline.invitationCode',
        defaultMessage: '邀请码',
      }),
      dataIndex: 'invitation_code',
      key: 'invitation_code',
      render: (code: string) => <Tag color="purple">{code}</Tag>,
    },
    {
      title: intl.formatMessage({
        id: 'pages.hierarchyManagement.directDownline.createTime',
        defaultMessage: '创建时间',
      }),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDate(date, 'YYYY-MM-DD'),
    },
  ];

  // 提取表格数据
  const getTableDataSource = () => {
    // 记录获取到的原始数据
    console.log(`【DirectDownline】处理数据源，原始数据:`, data);

    if (!data) {
      console.warn(`【DirectDownline】无响应数据`);
      return [];
    }

    // 检查是否为虚拟根节点查询
    console.log(`【DirectDownline】节点类型: ${isRootNode ? '虚拟根节点' : '普通节点'}`);

    // 系统检测响应格式 - 包括PascalCase（首字母大写）字段
    const responseFormat = {
      // 小写字段（camelCase）
      hasDataChildren: !!data?.data?.children,
      hasDataResult: !!data?.data?.result,
      hasDataUsers: !!data?.data?.users,
      // 大写字段（PascalCase）
      hasDataChildrenPascal: !!data?.data?.Children,
      hasDataResultPascal: !!data?.data?.Result,
      hasDataUsersPascal: !!data?.data?.Users,
      // 数组检测
      isDataResultArray: Array.isArray(data?.data?.result),
      isDataResultArrayPascal: Array.isArray(data?.data?.Result),
      isDataArray: Array.isArray(data?.data),
      isResultArray: Array.isArray(data?.result),
      isResultArrayPascal: Array.isArray(data?.Result),
      isUsersArray: Array.isArray(data?.users),
      isUsersArrayPascal: Array.isArray(data?.Users)
    };

    console.log(`【DirectDownline】响应格式检测:`, responseFormat);

    // 处理多种可能的API响应格式 - 同时支持camelCase和PascalCase（首字母大小写）
    let childrenData =
      // camelCase（小写）字段格式
      data?.data?.result?.children || // 结构 {data: {result: {children: [...]}}}
      data?.data?.children ||         // 结构 {data: {children: [...]}}
      data?.result?.children ||       // 结构 {result: {children: [...]}}
      data?.children ||               // 结构 {children: [...]}
      // PascalCase（大写）字段格式
      data?.data?.Result?.Children || // 结构 {data: {Result: {Children: [...]}}}
      data?.data?.Children ||         // 结构 {data: {Children: [...]}}
      data?.Result?.Children ||       // 结构 {Result: {Children: [...]}}
      data?.Children ||               // 结构 {Children: [...]}
      // 混合格式（部分大写部分小写）
      data?.data?.result?.Children || // 结构 {data: {result: {Children: [...]}}}
      data?.data?.Result?.children || // 结构 {data: {Result: {children: [...]}}}
      data?.Result?.children ||       // 结构 {Result: {children: [...]}}
      data?.result?.Children ||       // 结构 {result: {Children: [...]}}
      [];                             // 默认空数组

    // 如果没有找到children结构，检查是否有users或result数组格式
    if (!childrenData || childrenData.length === 0) {
      // 全面调试 - 打印原始响应数据的完整结构
      console.log(`【DirectDownline】完整API响应数据 (${userId}):`, JSON.stringify(data, null, 2));

      // 分析响应根级别所有键
      let allKeys = [];
      if (data && typeof data === 'object') {
        const extractKeys = (obj, prefix = '') => {
          Object.keys(obj).forEach(key => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            allKeys.push(fullKey);
            if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
              extractKeys(obj[key], fullKey);
            }
            // 检查是否为数组，如果是则记录长度
            if (Array.isArray(obj[key])) {
              allKeys.push(`${fullKey} (数组长度: ${obj[key].length})`);
            }
          });
        };
        extractKeys(data);
      }
      console.log(`【DirectDownline】响应中的所有键路径:`, allKeys);

      // 特别检查是否有data.list字段 - 后端可能使用的另一种常见格式
      if (Array.isArray(data?.data?.list)) {
        childrenData = data.data.list;
        console.log(`【DirectDownline】使用 data.data.list 数组格式，长度: ${childrenData.length}`);
      }
      // 特别检查是否有data.List字段
      else if (Array.isArray(data?.data?.List)) {
        childrenData = data.data.List;
        console.log(`【DirectDownline】使用 data.data.List 数组格式，长度: ${childrenData.length}`);
      }
      // 标准结构检查
      // camelCase格式
      else if (Array.isArray(data?.data?.result)) {
        childrenData = data.data.result;
        console.log(`【DirectDownline】使用 data.data.result 数组格式，长度: ${childrenData.length}`);
      } else if (Array.isArray(data?.data?.users)) {
        childrenData = data.data.users;
        console.log(`【DirectDownline】使用 data.data.users 数组格式，长度: ${childrenData.length}`);
      } else if (Array.isArray(data?.data)) {
        childrenData = data.data;
        console.log(`【DirectDownline】使用 data.data 数组格式，长度: ${childrenData.length}`);
      } else if (Array.isArray(data?.result)) {
        childrenData = data.result;
        console.log(`【DirectDownline】使用 data.result 数组格式，长度: ${childrenData.length}`);
      } else if (Array.isArray(data?.users)) {
        childrenData = data.users;
        console.log(`【DirectDownline】使用 data.users 数组格式，长度: ${childrenData.length}`);
      } else if (Array.isArray(data)) {
        childrenData = data;
        console.log(`【DirectDownline】使用 data 数组格式，长度: ${childrenData.length}`);
      }
      // PascalCase格式
      else if (Array.isArray(data?.data?.Result)) {
        childrenData = data.data.Result;
        console.log(`【DirectDownline】使用 data.data.Result 数组格式，长度: ${childrenData.length}`);
      } else if (Array.isArray(data?.data?.Users)) {
        childrenData = data.data.Users;
        console.log(`【DirectDownline】使用 data.data.Users 数组格式，长度: ${childrenData.length}`);
      } else if (Array.isArray(data?.Result)) {
        childrenData = data.Result;
        console.log(`【DirectDownline】使用 data.Result 数组格式，长度: ${childrenData.length}`);
      } else if (Array.isArray(data?.Users)) {
        childrenData = data.Users;
        console.log(`【DirectDownline】使用 data.Users 数组格式，长度: ${childrenData.length}`);
      }

      // 如果仍然没有找到数组数据，尝试遍历整个对象寻找任何数组
      if (!childrenData || childrenData.length === 0) {
        console.log(`【DirectDownline】常规路径未找到数据，尝试深度搜索数组...`);

        // 深度搜索函数 - 递归查找任何数组类型的属性
        const findFirstArray = (obj, path = '') => {
          if (!obj || typeof obj !== 'object') return null;

          // 优先检查已知名称的数组
          const knownArrayNames = ['children', 'Children', 'users', 'Users', 'result', 'Result', 'list', 'List', 'items', 'Items'];
          for (const name of knownArrayNames) {
            if (Array.isArray(obj[name]) && obj[name].length > 0) {
              console.log(`【DirectDownline】在路径 ${path}.${name} 找到已知名称数组，长度: ${obj[name].length}`);
              return obj[name];
            }
          }

          // 检查任何数组属性
          for (const key in obj) {
            if (Array.isArray(obj[key]) && obj[key].length > 0) {
              console.log(`【DirectDownline】在路径 ${path}.${key} 找到数组，长度: ${obj[key].length}`);
              return obj[key];
            }
          }

          // 递归检查嵌套对象
          for (const key in obj) {
            if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
              const result = findFirstArray(obj[key], path ? `${path}.${key}` : key);
              if (result) return result;
            }
          }

          return null;
        };

        const foundArray = findFirstArray(data);
        if (foundArray) {
          childrenData = foundArray;
          console.log(`【DirectDownline】深度搜索找到数组数据，长度: ${childrenData.length}`);
        } else {
          console.warn(`【DirectDownline】在整个响应中未找到任何数组数据`);
        }
      }
    }

    // 检查每个数据项是否有必要的字段（用户ID、昵称等）
    if (childrenData && childrenData.length > 0) {
      // 检查第一项的结构
      const firstItem = childrenData[0];
      console.log(`【DirectDownline】数据项检查: 第一项有这些字段:`, Object.keys(firstItem));

      // 尝试验证必要字段是否存在
      const hasUserId = !!firstItem?.user_id;
      const hasNickname = !!firstItem?.nickname;

      console.log(`【DirectDownline】数据验证: 有user_id=${hasUserId}, 有nickname=${hasNickname}`);

      if (!hasUserId) {
        console.warn(`【DirectDownline】数据不完整：缺少user_id字段`);
      }
    }

    // 对于虚拟根节点的特殊处理
    if (isRootNode && (!childrenData || childrenData.length === 0)) {
      console.warn(`【DirectDownline】虚拟根节点 ${userId} 没有直接下级数据，尝试修复层级关系`);
    }

    // 记录提取的数据
    console.log(`【DirectDownline】提取的子节点数据(${childrenData.length}):`,
      childrenData.length > 0 ?
        childrenData.slice(0, Math.min(3, childrenData.length)).map(item => ({
          user_id: item.user_id,
          nickname: item.nickname,
          level: item.level
        })) :
        '无数据');

    // 数据标准化处理 - 确保所有项目都有必要的字段
    if (childrenData && childrenData.length > 0) {
      console.log(`【DirectDownline】开始标准化 ${childrenData.length} 条数据`);

      // 标准化数据，确保字段名称统一（支持PascalCase或camelCase）
      childrenData = childrenData.map(item => {
        // 创建一个标准化的记录对象
        const standardItem: any = {};

        // 遍历所有键，创建标准化的小写版本
        Object.keys(item).forEach(key => {
          // 存储原始大小写的值
          standardItem[key] = item[key];

          // 同时创建小写版本的字段（如果尚不存在）
          const lowerKey = key.charAt(0).toLowerCase() + key.slice(1);
          if (!(lowerKey in standardItem)) {
            standardItem[lowerKey] = item[key];
          }
        });

        // 确保关键字段存在，即使它们使用不同大小写
        if (!standardItem.user_id && standardItem.userId) standardItem.user_id = standardItem.userId;
        if (!standardItem.user_id && standardItem.UserId) standardItem.user_id = standardItem.UserId;
        if (!standardItem.user_id && standardItem.UserID) standardItem.user_id = standardItem.UserID;

        if (!standardItem.nickname && standardItem.nickName) standardItem.nickname = standardItem.nickName;
        if (!standardItem.nickname && standardItem.Nickname) standardItem.nickname = standardItem.Nickname;
        if (!standardItem.nickname && standardItem.NickName) standardItem.nickname = standardItem.NickName;

        if (!standardItem.level && standardItem.Level) standardItem.level = standardItem.Level;

        if (!standardItem.team_size && standardItem.teamSize) standardItem.team_size = standardItem.teamSize;
        if (!standardItem.team_size && standardItem.TeamSize) standardItem.team_size = standardItem.TeamSize;

        if (!standardItem.direct_downline_count && standardItem.directDownlineCount)
          standardItem.direct_downline_count = standardItem.directDownlineCount;
        if (!standardItem.direct_downline_count && standardItem.DirectDownlineCount)
          standardItem.direct_downline_count = standardItem.DirectDownlineCount;

        // 对于可能缺失的字段，提供默认值
        if (!standardItem.user_id) standardItem.user_id = `user-${Math.random().toString(36).substr(2, 9)}`;
        if (!standardItem.nickname) standardItem.nickname = '未知用户';
        if (!standardItem.level) standardItem.level = 1;
        if (!standardItem.team_size) standardItem.team_size = 0;
        if (!standardItem.direct_downline_count) standardItem.direct_downline_count = 0;
        if (!standardItem.invitation_code) standardItem.invitation_code = '-';
        if (!standardItem.created_at) standardItem.created_at = new Date().toISOString();

        return standardItem;
      });

      // 记录标准化后的数据
      console.log(`【DirectDownline】数据标准化完成，样本:`,
        childrenData.slice(0, Math.min(2, childrenData.length)).map(item => ({
          user_id: item.user_id,
          nickname: item.nickname,
          level: item.level,
          team_size: item.team_size,
          direct_downline_count: item.direct_downline_count
        }))
      );
    }

    // 当childrenData为空但isRootNode为true时，显示警告并提供修复选项
    if (childrenData.length === 0 && isRootNode) {
      console.warn(`【DirectDownline】警告: 虚拟根节点没有子节点数据，但API返回了结果。完整响应:`, data);
    }

    return childrenData;
  };

  // 提取总数
  const getTotal = () => {
    // 获取表格数据长度
    const tableDataLength = getTableDataSource().length;

    // 从响应中提取总数 - 支持camelCase和PascalCase字段
    const responseTotal =
      // camelCase格式
      data?.data?.result?.total ||
      data?.data?.total ||
      data?.result?.total ||
      data?.data?.users?.length ||
      data?.users?.length ||
      data?.total ||
      // PascalCase格式
      data?.data?.Result?.Total ||
      data?.data?.Total ||
      data?.Result?.Total ||
      data?.data?.Users?.length ||
      data?.Users?.length ||
      data?.Total ||
      0;

    // 对比两种方式获取的数量
    console.log(`【DirectDownline】总数对比: 响应中的total=${responseTotal}, 实际数据项数量=${tableDataLength}`);

    // 返回较大的那个值，确保分页正确
    return Math.max(responseTotal, tableDataLength);
  };

  // 刷新层级树功能
  const [repairing, setRepairing] = useState(false);

  // 刷新数据函数，不再调用 repairHierarchy
  const handleRefreshData = async () => {
    setRepairing(true);
    try {
      // 直接刷新数据
      await refresh();
      message.success('数据已刷新');
    } catch (error) {
      console.error('刷新数据失败:', error);
      message.error('刷新数据失败');
    } finally {
      setRepairing(false);
    }
  };

  // 获取表格数据
  const tableDataSource = getTableDataSource();

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {tableDataSource.length > 0 ? (
            <span>共找到 <strong>{getTotal()}</strong> 个直接下级</span>
          ) : loading ? (
            <span>加载中...</span>
          ) : (
            <span>
              {isRootNode ? (
                <strong style={{ color: '#ff4d4f' }}>虚拟根节点没有直接下级数据，请尝试刷新</strong>
              ) : (
                <span>暂无直接下级数据</span>
              )}
            </span>
          )}
        </div>
        <Space>
          {isRootNode && tableDataSource.length === 0 && (
            <Button
              type="default"
              danger
              icon={<ToolOutlined />}
              loading={repairing}
              onClick={handleRefreshData}
            >
              刷新数据
            </Button>
          )}
          <Button
            onClick={refresh}
            type="primary"
            ghost
            icon={<ReloadOutlined />}
          >
            {intl.formatMessage({
              id: 'pages.hierarchyManagement.directDownline.refresh',
              defaultMessage: '刷新',
            })}
          </Button>
        </Space>
      </div>

      <Table
        dataSource={tableDataSource}
        columns={columns}
        rowKey="user_id"
        loading={loading}
        locale={{
          emptyText: userId && userId.startsWith('ORG_ROOT_')
            ? '暂无直接下级数据，请点击刷新按钮尝试获取最新数据'
            : '暂无直接下级数据'
        }}
        pagination={{
          current: pageNumber,
          pageSize: pageSize,
          total: getTotal(),
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: isRootNode
            ? ['10', '20', '50', '100', '200', '500'] // 虚拟根节点提供更大的分页选项
            : ['10', '20', '50', '100'], // 普通节点使用标准分页选项
          onChange: (page, size) => {
            console.log(`【DirectDownline】分页变更: 页码=${page}, 每页数量=${size}`);
            setPageNumber(page);
            if (size !== pageSize) {
              setPageSize(size);
            }
          },
        }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default DirectDownline;
