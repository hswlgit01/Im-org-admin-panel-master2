import { useState, useEffect, useRef } from 'react';
import { Tree, Typography, Avatar, Spin, message, Button, Pagination } from 'antd';
import { DownOutlined, TeamOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRequest } from '@umijs/max';
import { getHierarchyTree, getHierarchyChildren } from '@/services/hierarchy';

const { Text } = Typography;

/** 与后端层级子节点接口默认分页一致 */
const HIERARCHY_PAGE_SIZE = 50;

const extractChildrenTotal = (res: any): number => {
  const raw = res?.data?.total ?? res?.data?.Total ?? res?.total ?? res?.Total;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

interface HierarchyTreeProps {
  treeData?: API.Hierarchy.HierarchyTreeNode;
  onUserSelect: (userId: string) => void;
  selectedUserId: string | null;
  treeError?: any;      // 错误信息
  treeLoading?: boolean; // 加载状态
}

/**
 * 将API层级数据转换为Ant Design Tree组件数据格式
 * @param node 要转换的节点数据
 * @returns 转换后的树节点数组
 */
const convertToTreeData = (node?: any) => {
  // 节点为空或非对象，返回空数组
  if (!node || typeof node !== 'object' || node === null) {
    return [];
  }

  // 确保节点有必要的属性
  if (!node.user_id) {
    node.user_id = 'node-' + Math.random().toString(36).substr(2, 9);
  }

  // 确保节点有children属性（后端omitempty标签可能会省略空数组）
  if (!node.hasOwnProperty('children')) {
    node.children = [];
  } else if (!Array.isArray(node.children)) {
    node.children = [];
  }

  // 提取并设置默认值
  const userId = node.user_id || "未知ID";
  const nickname = node.nickname || "未知用户";
  const account = node.account || "";
  const faceUrl = node.face_url || "";
  const teamSize = node.team_size || 0;
  const directDownlineCount = node.direct_downline_count || 0;

  // 判断是否为组织节点
  const isOrgNode = node.user_type === 'ORGANIZATION' ||
                    (node.user_id && typeof node.user_id === 'string' &&
                     node.user_id.startsWith('ORG_ROOT_'));

  // 根据节点类型创建标题组件
  let title;
  if (isOrgNode) {
    // 组织根节点的显示样式
    title = (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Avatar
          icon={<TeamOutlined />}
          size="small"
          style={{ marginRight: '8px', backgroundColor: '#722ed1' }}
        />
        <Text strong style={{ marginRight: '8px', color: '#722ed1' }}>{nickname}</Text>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          (组织根节点, 团队: {teamSize}, 直接下级: {directDownlineCount})
        </Text>
      </div>
    );
  } else {
    // 普通用户的显示样式
    title = (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Avatar
          src={faceUrl}
          icon={<TeamOutlined />}
          size="small"
          style={{ marginRight: '8px' }}
        />
        <Text style={{ marginRight: '8px' }}>{account || userId}</Text>
        {nickname && nickname !== account && (
          <Text type="secondary" style={{ marginRight: '8px' }}>{nickname}</Text>
        )}
        <Text type="secondary" style={{ fontSize: '12px' }}>
          (团队: {teamSize}, 直接下级: {directDownlineCount})
        </Text>
      </div>
    );
  }

  // 判断节点类型和可展开性
  const isRootNode = isOrgNode && userId.startsWith('ORG_ROOT_');
  const hasDownlines = directDownlineCount > 0 || teamSize > 0;

  // 创建树节点对象
  const treeNode: any = {
    key: userId,
    title,
    children: [],
    // 计算叶子节点状态:
    // 1. 组织根节点永远可展开
    // 2. 其他组织节点根据直接下级数量判断
    // 3. 普通节点根据是否有下级或子节点判断
    isLeaf: isRootNode
      ? false
      : isOrgNode
        ? (directDownlineCount === 0)
        : !hasDownlines && (!node.has_more_children && (!node.children || node.children.length === 0)),
    // 保存原始数据用于后续更新和动态计算
    _orgData: {
      isOrgNode,
      isRootNode,
      teamSize,
      directDownlineCount,
      hasDownlines,
      shouldForceExpandable: isRootNode // 根节点强制可展开
    }
  };

  // 处理子节点
  if (node.children && Array.isArray(node.children)) {
    // 预处理子节点，确保数据完整性
    node.children.forEach(child => {
      if (child && typeof child === 'object') {
        if (!child.hasOwnProperty('children')) {
          child.children = [];
        }
      }
    });

    // 转换子节点
    try {
      treeNode.children = node.children
        .filter(child => child && typeof child === 'object')
        .map(child => {
          const childNodes = convertToTreeData(child);
          return childNodes && childNodes.length > 0 ? childNodes[0] : null;
        })
        .filter(child => child !== null);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("处理子节点时出错:", error);
      }
      treeNode.children = [];
    }
  }

  return [treeNode];
};

/**
 * 层级树组件
 * 显示用户层级关系，支持异步加载子节点和节点选择
 */
const HierarchyTree: React.FC<HierarchyTreeProps> = ({
  treeData,
  onUserSelect,
  selectedUserId,
  treeError,
  treeLoading
}) => {
  // 开发环境验证数据完整性
  if (process.env.NODE_ENV === 'development') {
    if (!treeData) {
      console.warn("HierarchyTree组件接收到空树数据");
    } else if (!treeData.user_id) {
      console.warn("treeData缺少user_id字段");
    } else if (!Array.isArray(treeData.children)) {
      console.warn("treeData.children不是数组");
    }
  }
  // 组件状态
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [refreshLoading, setRefreshLoading] = useState(false);

  // 关键状态：将树节点数据提升为状态，确保UI能响应数据变化
  const [treeNodes, setTreeNodes] = useState<any[]>([]);
  /** 当前在层级树中分页展示的父节点（直接下级超过一页时） */
  const [childrenListPagination, setChildrenListPagination] = useState<{
    parentKey: string;
    page: number;
    total: number;
  } | null>(null);
  const [treePagerLoading, setTreePagerLoading] = useState(false);

  /**
   * 刷新层级树数据
   * 从服务器获取最新的层级结构，并更新树的显示
   */
  const handleRefreshHierarchy = async () => {
    logTreeState('刷新开始');
    setRefreshLoading(true);

    try {
      // 获取最新的层级树数据
      const res = await getHierarchyTree({});

      // 尝试获取根节点数据，适配不同API响应格式
      let rootData = null;
      if (res?.root?.user_id) {
        rootData = res.root;
      } else if (res?.data?.root?.user_id) {
        rootData = res.data.root;
      } else if (res?.errCode === 0 && res?.data?.root?.user_id) {
        rootData = res.data.root;
      } else if (res?.user_id && (
        res?.user_type === 'ORGANIZATION' ||
        (typeof res.user_id === 'string' && res.user_id.startsWith('ORG_ROOT_'))
      )) {
        rootData = res;
      }

      // 如果找到了有效的根节点数据
      if (rootData) {
        // 确保根节点有children属性
        if (!rootData.hasOwnProperty('children')) {
          rootData.children = [];
        }

        // 保存当前状态和根节点ID
        const rootNodeId = rootData.user_id;
        const wasRootExpanded = expandedKeys.includes(rootNodeId);

        // 清空展开键
        setExpandedKeys([]);

        // 处理数据并更新树节点
        const newTreeNodes = convertToTreeData(rootData);
        setTreeNodes(newTreeNodes);

        // 如果根节点有子节点或之前是展开的，则重新设置展开状态
        if ((rootData.children && rootData.children.length > 0) || wasRootExpanded) {
          // 延时确保节点状态正确更新
          setTimeout(() => {
            setExpandedKeys([rootNodeId]);
          }, 100);
        }

        // 重置父级自动展开属性
        setAutoExpandParent(false);
        message.success('层级树已刷新');
      } else {
        message.warning('获取层级数据失败，请稍后再试');
      }
    } catch (error) {
      console.error('刷新层级树失败:', error);
      message.error('刷新层级树失败: ' + (error?.message || '未知错误'));
    } finally {
      setRefreshLoading(false);
      logTreeState('刷新结束');
    }
  };

  // 辅助函数，记录关键树状态（仅在开发环境或需要时使用）
  const logTreeState = (message: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`【树状态】${message}:`, {
        expandedKeys: expandedKeys.length,
        selectedKeys: selectedKeys.length,
        treeNodesCount: treeNodes.length,
        rootNodeId: treeNodes.length > 0 ? treeNodes[0].key : 'none',
        refreshLoading
      });
    }
  };

  /**
   * 预加载组织根节点的子节点并更新统计数据
   * 当获取到根节点但根节点没有子节点数据时调用
   * @param rootId 根节点ID (以 ORG_ROOT_ 开头)
   */
  const preloadRootNodeChildren = async (rootId: string) => {
    if (process.env.NODE_ENV === 'development') {
      logTreeState(`准备预加载节点 ${rootId} 的子节点`);
    }

    // 只处理组织根节点
    if (!rootId || !rootId.startsWith('ORG_ROOT_')) {
      return;
    }

    try {
      const res = await getHierarchyChildren({
        user_id: rootId,
        page: 1,
        page_size: HIERARCHY_PAGE_SIZE,
      });

      let childrenData = extractChildrenData(res);
      const apiTotal = extractChildrenTotal(res);

      // 找到对应的根节点
      if (treeNodes && treeNodes.length > 0 && treeNodes[0].key === rootId) {
        const rootNode = treeNodes[0];

        if (childrenData.length > 0) {
          const directDownlineCount = apiTotal > 0 ? apiTotal : childrenData.length;
          let teamSize = 0;

          // 计算整个团队规模 (子节点team_size总和 + 直接下级人数)
          childrenData.forEach(child => {
            teamSize += (child.team_size || 0);
          });
          teamSize += directDownlineCount;

          // 更新原始数据
          if (rootNode._orgData) {
            rootNode._orgData.teamSize = teamSize;
            rootNode._orgData.directDownlineCount = directDownlineCount;
          }

          // 标准化子节点数据，确保字段名称统一
          childrenData = childrenData.map(standardizeUserData);

          // 将子节点数据转换为树节点
          const newChildren = childrenData
            .filter(child => child && typeof child === 'object')
            .map(child => {
              const childNodes = convertToTreeData(child);
              return childNodes && childNodes.length > 0 ? childNodes[0] : null;
            })
            .filter(node => node !== null);

          // 过滤掉与根节点相同的节点（避免循环引用）
          const filteredChildren = newChildren.filter(child =>
            child.key !== rootNode.key &&
            !(typeof child.key === 'string' &&
              typeof rootNode.key === 'string' &&
              child.key.startsWith('ORG_ROOT_') &&
              rootNode.key.startsWith('ORG_ROOT_'))
          );

          // 更新根节点子节点和属性
          rootNode.children = filteredChildren;
          rootNode.isLeaf = false; // 确保根节点不是叶子节点

          // 强制整个树重新渲染
          if (treeNodes && treeNodes.length > 0 && treeNodes[0].key === rootId) {
            treeNodes[0].children = filteredChildren;

            // 设置为当前激活节点
            setSelectedKeys([rootId]);

            // 强制刷新UI
            setAutoExpandParent(true);
            setTimeout(() => {
              setAutoExpandParent(false);
            }, 100);

            // 设置展开状态
            if (!expandedKeys.includes(rootId)) {
              setExpandedKeys([...expandedKeys, rootId]);
            }
          }

          // 更新根节点的显示内容
          const avatarBackground = { backgroundColor: '#722ed1' };
          rootNode.title = (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                icon={<TeamOutlined />}
                size="small"
                style={{ marginRight: '8px', ...avatarBackground }}
              />
              <Text strong style={{ marginRight: '8px', color: '#722ed1' }}>
                {treeData?.nickname || "组织根节点"}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                (组织根节点, 团队: {teamSize}, 直接下级: {directDownlineCount})
              </Text>
            </div>
          );

          // 强制更新UI
          setExpandedKeys([...expandedKeys]);

          if (apiTotal > HIERARCHY_PAGE_SIZE) {
            setChildrenListPagination({ parentKey: rootId, page: 1, total: apiTotal });
          } else {
            setChildrenListPagination((prev) => (prev?.parentKey === rootId ? null : prev));
          }
        }
      }
    } catch (error) {
      console.error('预加载虚拟根节点子节点失败:', error);
    }
  };

  /**
   * 标准化用户数据，统一字段名称
   * 支持不同格式的API响应，统一转换为snake_case格式
   */
  const standardizeUserData = (item: any) => {
    if (!item || typeof item !== 'object') return item;

    // 创建标准化对象
    const standardItem: any = {...item};

    // 处理不同命名约定的字段
    if (!standardItem.user_id && standardItem.userId) standardItem.user_id = standardItem.userId;
    if (!standardItem.user_id && standardItem.UserId) standardItem.user_id = standardItem.UserId;
    if (!standardItem.user_id && standardItem.UserID) standardItem.user_id = standardItem.UserID;

    if (!standardItem.nickname && standardItem.nickName) standardItem.nickname = standardItem.nickName;
    if (!standardItem.nickname && standardItem.Nickname) standardItem.nickname = standardItem.Nickname;
    if (!standardItem.nickname && standardItem.NickName) standardItem.nickname = standardItem.NickName;

    if (!standardItem.level && standardItem.Level) standardItem.level = standardItem.Level;

    if (!standardItem.team_size && standardItem.teamSize) standardItem.team_size = standardItem.teamSize;
    if (!standardItem.team_size && standardItem.TeamSize) standardItem.team_size = standardItem.TeamSize;

    // 对于可能缺失的字段提供默认值
    if (!standardItem.user_id) standardItem.user_id = `user-${Math.random().toString(36).substr(2, 9)}`;
    if (!standardItem.nickname) standardItem.nickname = '未知用户';
    if (!standardItem.level && standardItem.level !== 0) standardItem.level = 1;
    if (!standardItem.team_size) standardItem.team_size = 0;

    return standardItem;
  };

  /**
   * 从API响应中提取子节点数据
   * 支持多种不同的响应格式和嵌套结构
   */
  const extractChildrenData = (res: any) => {
    if (!res) return [];

    // 尝试从常见路径获取子节点数组
    let childrenData =
      // camelCase格式
      res?.data?.result?.children ||
      res?.data?.children ||
      res?.result?.children ||
      res?.children ||
      // PascalCase格式
      res?.data?.Result?.Children ||
      res?.data?.Children ||
      res?.Result?.Children ||
      res?.Children ||
      // 混合格式
      res?.data?.result?.Children ||
      res?.data?.Result?.children ||
      // 其他常见格式
      res?.data?.list ||
      res?.data?.List ||
      res?.list ||
      res?.List ||
      [];

    // 如果常规路径未找到数据，使用深度搜索
    if (!childrenData || childrenData.length === 0) {
      const findArrayData = (obj) => {
        if (!obj || typeof obj !== 'object') return null;

        // 首先检查已知名称的数组
        const knownArrayNames = ['children', 'Children', 'users', 'Users', 'items', 'Items', 'list', 'List'];
        for (const name of knownArrayNames) {
          if (Array.isArray(obj[name]) && obj[name].length > 0) {
            return obj[name];
          }
        }

        // 检查任何数组类型属性
        for (const key in obj) {
          if (Array.isArray(obj[key]) && obj[key].length > 0) {
            return obj[key];
          }
        }

        // 递归检查所有嵌套对象
        for (const key in obj) {
          if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            const result = findArrayData(obj[key]);
            if (result) return result;
          }
        }

        return null;
      };

      const foundArray = findArrayData(res);
      if (foundArray) {
        childrenData = foundArray;
      }
    }

    return childrenData;
  };

  const treeNodesRef = useRef<any[]>([]);
  treeNodesRef.current = treeNodes;

  const updateNodeInTree = (nodes: any[], targetKey: React.Key, newChildren: any[]): boolean => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].key === targetKey) {
        nodes[i].children = newChildren;
        nodes[i].isLeaf = false;
        return true;
      }
      if (nodes[i].children && nodes[i].children.length > 0) {
        if (updateNodeInTree(nodes[i].children, targetKey, newChildren)) {
          return true;
        }
      }
    }
    return false;
  };

  const loadChildrenForNode = async (
    treeNode: any,
    page: number,
    options?: { force?: boolean },
  ): Promise<void> => {
    const force = options?.force === true;
    if (treeNode._loading) {
      return;
    }

    const isRootNode =
      treeNode._orgData?.isRootNode ||
      (treeNode.key &&
        typeof treeNode.key === 'string' &&
        treeNode.key.toString().startsWith('ORG_ROOT_'));

    if (
      treeNode._orgData?.hasDownlines ||
      treeNode._orgData?.directDownlineCount > 0 ||
      treeNode._orgData?.teamSize > 0
    ) {
      treeNode.isLeaf = false;
    }

    const hasExistingChildren = treeNode.children && treeNode.children.length > 0;
    if (!force) {
      if (hasExistingChildren && !isRootNode) {
        return;
      }
      if (hasExistingChildren && isRootNode) {
        return;
      }
    }

    treeNode._loading = true;
    try {
      const res = await getHierarchyChildren({
        user_id: String(treeNode.key),
        page,
        page_size: HIERARCHY_PAGE_SIZE,
      });
      let childrenData = extractChildrenData(res);
      const apiTotal = extractChildrenTotal(res);
      const total = apiTotal > 0 ? apiTotal : childrenData.length;

      if (total > HIERARCHY_PAGE_SIZE) {
        setChildrenListPagination({ parentKey: String(treeNode.key), page, total });
      } else {
        setChildrenListPagination((prev) =>
          prev?.parentKey === String(treeNode.key) ? null : prev,
        );
      }

      if (childrenData.length > 0) {
        childrenData = childrenData.map(standardizeUserData);
        const newChildren = childrenData
          .filter((child) => child && typeof child === 'object')
          .map((child) => {
            const childNodes = convertToTreeData(child);
            return childNodes && childNodes.length > 0 ? childNodes[0] : null;
          })
          .filter((node) => node !== null);

        const filteredChildren = newChildren.filter(
          (child) =>
            child.key !== treeNode.key &&
            !(
              typeof child.key === 'string' &&
              typeof treeNode.key === 'string' &&
              child.key.startsWith('ORG_ROOT_') &&
              String(treeNode.key).startsWith('ORG_ROOT_')
            ),
        );

        treeNode.children = filteredChildren;
        treeNode.isLeaf = false;

        setTreeNodes((prev) => {
          const updatedTree = [...prev];
          if (isRootNode && updatedTree.length > 0 && updatedTree[0].key === treeNode.key) {
            updatedTree[0] = { ...updatedTree[0], children: filteredChildren };
          } else {
            updateNodeInTree(updatedTree, treeNode.key, filteredChildren);
          }
          return updatedTree;
        });

        if (isRootNode) {
          setExpandedKeys((ek) => (ek.includes(treeNode.key) ? ek : [...ek, treeNode.key]));
          setAutoExpandParent(true);
          setTimeout(() => setAutoExpandParent(false), 100);
        }
      } else {
        const hasDownlines =
          treeNode._orgData?.directDownlineCount > 0 || treeNode._orgData?.teamSize > 0;
        treeNode.isLeaf = !hasDownlines;
      }
    } catch (error) {
      console.error('加载子节点失败:', error);
      throw error;
    } finally {
      treeNode._loading = false;
    }
  };

  const handleTreeChildrenPageChange = async (page: number) => {
    if (!childrenListPagination) return;
    const parentKey = childrenListPagination.parentKey;
    const findNodeByKey = (nodes: any[], key: React.Key): any => {
      for (const node of nodes) {
        if (node.key === key) return node;
        if (node.children?.length) {
          const f = findNodeByKey(node.children, key);
          if (f) return f;
        }
      }
      return null;
    };
    const parentNode = findNodeByKey(treeNodesRef.current, parentKey);
    if (!parentNode) {
      message.warning('未找到对应节点，请重新展开层级树');
      return;
    }
    setTreePagerLoading(true);
    try {
      await loadChildrenForNode(parentNode, page, { force: true });
    } finally {
      setTreePagerLoading(false);
    }
  };

  // 当层级树数据加载完成后，自动展开根节点并选择根用户
  useEffect(() => {
    if (treeData && treeData.user_id) {
      console.log(`【HierarchyTree】初始化树结构，根节点ID: ${treeData.user_id}, 子节点数: ${treeData.children?.length || 0}, 直接下级数: ${treeData.direct_downline_count || 0}`);

      // 设置展开的节点，包含根节点
      setExpandedKeys([treeData.user_id]);

      // 如果没有选中的用户，自动选择根用户
      if (!selectedUserId) {
        onUserSelect(treeData.user_id);
      }

      // 检查是否是组织根节点
      const isOrgNode = treeData.user_type === 'ORGANIZATION' ||
                       (treeData.user_id && typeof treeData.user_id === 'string' &&
                        treeData.user_id.startsWith('ORG_ROOT_'));

      if (isOrgNode) {
        console.log(`【关键情况】根节点数据：
          - ID: ${treeData.user_id}
          - 类型: ${treeData.user_type || '未知'}
          - 团队规模: ${treeData.team_size || 0}
          - 直接下级: ${treeData.direct_downline_count || 0}
          - 有子节点数组: ${treeData.hasOwnProperty('children')}
          - 子节点数组长度: ${treeData.children?.length || 0}
        `);

        // 处理组织根节点 - 无论如何都预加载子节点，因为根节点的children字段通常是空的
        if (!treeData.children || treeData.children.length === 0) {
          console.log('【根节点预处理】发现组织根节点的子节点为空，执行预加载...');
          preloadRootNodeChildren(treeData.user_id);

          // 如果直接下级显示为0但团队规模大于0，执行修复操作
          if (treeData.direct_downline_count === 0 && treeData.team_size > 0) {
            console.log('【数据修复】直接下级为0但团队规模大于0，执行数据修复...');
            handleRepairHierarchy();
          }
        } else if (treeData.children.length > 0) {
          console.log(`【根节点预处理】组织根节点已有${treeData.children.length}个直接子节点，无需预加载`);
        }

        // 强制展开根节点
        setTimeout(() => {
          if (!expandedKeys.includes(treeData.user_id)) {
            console.log(`【HierarchyTree】强制展开根节点 ${treeData.user_id}`);
            setExpandedKeys([...expandedKeys, treeData.user_id]);
          }
        }, 500); // 延迟500ms确保树已经渲染
      }
    }
  }, [treeData]); // 移除selectedUserId依赖，避免选择用户时触发重新加载

  /**
   * 处理节点展开事件
   * 当用户点击展开节点图标时触发
   * @param expandedKeysValue 当前所有展开节点的key数组
   */
  const onExpand = (expandedKeysValue: React.Key[]) => {
    if (process.env.NODE_ENV === 'development') {
      logTreeState('节点展开事件');
    }

    // 找出新展开的节点（当前展开的节点中，之前未展开的）
    const newExpandedKeys = expandedKeysValue.filter(key => !expandedKeys.includes(key));

    // 对新展开的节点，检查是否需要加载子节点
    if (newExpandedKeys.length > 0) {
      // 递归查找指定key的节点
      const findNode = (nodes, key) => {
        for (const node of nodes) {
          if (node.key === key) {
            return node;
          }
          if (node.children && node.children.length > 0) {
            const found = findNode(node.children, key);
            if (found) {
              return found;
            }
          }
        }
        return null;
      };

      // 处理每个新展开的节点
      newExpandedKeys.forEach(key => {
        const node = findNode(treeNodes, key);
        if (node) {
          // 判断是否需要加载子节点：
          // 1. 节点没有子节点数据
          // 2. 节点统计数据表明应该有下级
          const hasChildrenData = node.children && node.children.length > 0;
          const hasDownlineIndicators = node._orgData && (
            node._orgData.hasDownlines ||
            node._orgData.directDownlineCount > 0 ||
            node._orgData.teamSize > 0
          );

          if (!hasChildrenData && hasDownlineIndicators) {
            // 异步加载子节点，避免阻塞UI
            setTimeout(() => {
              onLoadData(node);
            }, 10);
          }
        }
      });
    }

    // 更新展开状态
    setExpandedKeys(expandedKeysValue);
    setAutoExpandParent(false);
  };

  /**
   * 处理节点异步加载数据（首屏每父节点仅拉一页，翻页用底部 Pagination）
   */
  const onLoadData = async (treeNode: any) => {
    if (process.env.NODE_ENV === 'development') {
      logTreeState(`开始加载节点 ${treeNode.key} 数据`);
    }
    await loadChildrenForNode(treeNode, 1, { force: false });
  };

  /**
   * 处理节点选择事件
   * 当用户点击树节点时触发
   * @param newSelectedKeys 新的选择节点key数组
   */
  const onSelect = (newSelectedKeys: React.Key[]) => {
    // 更新内部选择状态
    setSelectedKeys(newSelectedKeys);

    // 有选中节点时通知父组件
    if (newSelectedKeys.length > 0) {
      const selectedId = newSelectedKeys[0] as string;

      // 自动展开非叶子节点
      if (!expandedKeys.includes(selectedId)) {
        // 递归检查节点是否为叶子节点
        const findIsLeafNode = (nodes, targetKey) => {
          for (const node of nodes) {
            if (node.key === targetKey) {
              return node.isLeaf;
            }
            if (node.children && node.children.length > 0) {
              const result = findIsLeafNode(node.children, targetKey);
              if (result !== undefined) {
                return result;
              }
            }
          }
          return undefined;
        };

        // 检查选中的节点是否为叶子节点
        const isLeafNode = findIsLeafNode(treeNodes, selectedId);

        // 非叶子节点自动展开
        if (isLeafNode === false) {
          setExpandedKeys(prevKeys => [...prevKeys, selectedId]);
        }
      }

      // 确保根节点保持展开状态
      if (treeNodes && treeNodes.length > 0) {
        const rootNodeKey = treeNodes[0].key;
        if (!expandedKeys.includes(rootNodeKey)) {
          setExpandedKeys(prevKeys => [...prevKeys, rootNodeKey]);
        }
      }

      // 通知父组件选择变化
      onUserSelect(selectedId);
    }
  };

  /**
   * 监听treeData变化，转换为Tree组件可用的数据格式
   */
  useEffect(() => {
    let newTreeNodes: any[] = [];
    try {
      if (treeData && typeof treeData === 'object') {
        newTreeNodes = convertToTreeData(treeData);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("转换数据时出错:", error);
      }
    }

    // 更新树节点状态，触发UI重新渲染
    setTreeNodes(newTreeNodes);
  }, [treeData]); // 仅当treeData变化时执行

  return (
    <div>
        {/* 树组件渲染 */}
        {treeData && treeNodes && treeNodes.length > 0 ? (
          <>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'green', fontWeight: 'bold' }}>
                层级树已加载
              </div>
              <Button
                icon={<ReloadOutlined />}
                type="text"
                size="small"
                loading={refreshLoading}
                onClick={handleRefreshHierarchy}
                title="刷新层级树"
              >
                刷新
              </Button>
            </div>
            <Tree
              showLine={{ showLeafIcon: false }}
              switcherIcon={<DownOutlined />}
              onExpand={onExpand}
              expandedKeys={expandedKeys}
              autoExpandParent={autoExpandParent}
              defaultExpandAll={false} // 修改为false，由我们自己控制展开
              defaultExpandParent={true}
              treeData={treeNodes}
              loadData={onLoadData}
              onSelect={onSelect}
              selectedKeys={selectedKeys.length > 0 ? selectedKeys : (selectedUserId ? [selectedUserId] : [])}
              blockNode={true} // 确保节点占据整行
              motion={{}} // 禁用动画以优化渲染性能
              // 添加额外的标志，强制更新
              key={`tree-${treeNodes.length}-${expandedKeys.length}`}
            />
            {childrenListPagination &&
              childrenListPagination.total > HIERARCHY_PAGE_SIZE && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8, fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>
                    当前父节点直接下级共 {childrenListPagination.total} 人，每页 {HIERARCHY_PAGE_SIZE} 条
                  </div>
                  <Spin spinning={treePagerLoading}>
                    <Pagination
                      current={childrenListPagination.page}
                      pageSize={HIERARCHY_PAGE_SIZE}
                      total={childrenListPagination.total}
                      onChange={handleTreeChildrenPageChange}
                      showSizeChanger={false}
                      size="small"
                    />
                  </Spin>
                </div>
              )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed #ccc', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>暂无层级数据</div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {treeLoading ? "正在加载..." :
                treeError ? `加载出错: ${String(treeError)}` :
                !treeData ? "未获取到有效的层级数据" :
                !treeNodes || treeNodes.length === 0 ? "暂无层级关系数据" : "未知错误"}
            </div>
          </div>
        )}
    </div>
  );
};

export default HierarchyTree;
