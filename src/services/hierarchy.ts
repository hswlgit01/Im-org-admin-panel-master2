import { CHAT_URL } from '@/config';
import { request } from '@umijs/max';
import { v4 as uuidv4 } from 'uuid';
import { getStoredOrganizationId } from '@/utils/organization';

const getHierarchyAuth = () => {
  const orgId = getStoredOrganizationId();
  const token = localStorage.getItem('IMAccountToken');

  if (!orgId) {
    throw new Error('组织ID无效或缺失，请重新登录');
  }

  return { orgId, token };
};

const hierarchyHeaders = (token: string | null) => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  operationID: uuidv4(),
  isAccount: 'true',
  token: token || '',
});

const flattenKeys = (obj: Record<string, any>, prefix = ''): string[] => {
  let keys: string[] = [];
  Object.keys(obj).forEach((key) => {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    keys.push(fullPath);
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      keys = keys.concat(flattenKeys(obj[key], fullPath));
    }
  });
  return keys;
};

// 获取层级树结构
export async function getHierarchyTree(params: API.Hierarchy.GetHierarchyTreeParams) {
  const { orgId, token } = getHierarchyAuth();

  // 调试认证信息
  console.log('【全面调试】getHierarchyTree 认证信息:', {
    orgId: orgId,
    tokenExists: !!token,
    tokenPrefix: token ? token.substring(0, 10) + '...' : '无',
    paramKeys: params ? Object.keys(params) : [],
  });

  // 准备发送请求
  const url = `/third_admin/hierarchy/tree_root`;

  // 统一使用third_admin前缀
  // 注意: 这里不对返回格式做假设，使用any允许更灵活处理
  return request<any>(url, {
    method: 'GET',
    params: {
      ...(params || {}),  // 确保params不为空
      organization_id: orgId,
    },
    headers: hierarchyHeaders(token),
    baseURL: CHAT_URL,
  });
}

// 获取用户直接下级
export async function getHierarchyChildren(params: API.Hierarchy.GetHierarchyChildrenParams) {
  const { orgId, token } = getHierarchyAuth();

  if (!token) {
    console.error('【严重错误】没有找到token，请重新登录！');
    return Promise.reject('没有找到token，请重新登录');
  } else {
    console.log(`【认证】当前token: ${token.substring(0, 10)}...${token.substring(token.length - 10)}`);
  }

  // 获取完整的用户ID（防止前端传空）
  const userId = params?.user_id || '';

  // 检查是否是虚拟根节点（增加更多日志）
  const isVirtualRootNode = userId.startsWith('ORG_ROOT_');
  console.log(`【全面调试】getHierarchyChildren - 用户ID: ${userId}, 是否虚拟根节点: ${isVirtualRootNode}, 组织ID: ${orgId}`);

  // 准备发送请求
  console.log('【全面调试】getHierarchyChildren 原始参数:', params);

  // 后端 Gin 分页读取 query: page / page_size（paginationUtils.QueryToDepPagination）
  const pageNum = params?.page ?? params?.page_number ?? 1;
  const pageSz = params?.page_size ?? params?.show_number ?? 50;

  const requestParams: Record<string, unknown> = {
    parent_user_id: userId,
    organization_id: orgId,
    page: pageNum,
    page_size: pageSz,
  };

  if (isVirtualRootNode && userId.includes('_') && userId.split('_').length >= 3) {
    const orgIdFromUser = userId.split('_')[2];
    if (orgIdFromUser !== orgId) {
      console.warn(`【警告】虚拟根节点ID中的组织ID(${orgIdFromUser})与当前上下文组织ID(${orgId})不匹配`);
    }
  }

  if (isVirtualRootNode && typeof requestParams.parent_user_id === 'string' &&
    !requestParams.parent_user_id.startsWith('ORG_ROOT_')) {
    requestParams.parent_user_id = `ORG_ROOT_${orgId}`;
  }

  console.log('【全面调试】getHierarchyChildren 调整后的请求参数:', requestParams);

  // 统一使用标准调用
  return request<any>(`/third_admin/hierarchy/children`, {
    method: 'GET',
    params: requestParams,
    headers: hierarchyHeaders(token),
    baseURL: CHAT_URL,
  }).then(response => {
    console.log(`【全面调试】getHierarchyChildren API响应:`, response);

    // 超级详细的响应结构分析
    const responseAnalysis = {
      responseType: typeof response,
      isNull: response === null,
      isUndefined: response === undefined,
      hasData: !!response?.data,
      hasResult: !!response?.result,
      hasChildren: !!response?.children,
      hasUsers: !!response?.users,
    };

    if (response) {
      // 添加更多详细信息
      if (response.data) {
        responseAnalysis['dataType'] = typeof response.data;
        responseAnalysis['dataIsArray'] = Array.isArray(response.data);
        responseAnalysis['dataKeys'] = Object.keys(response.data);

        if (response.data.children) {
          responseAnalysis['dataChildrenType'] = typeof response.data.children;
          responseAnalysis['dataChildrenIsArray'] = Array.isArray(response.data.children);
          responseAnalysis['dataChildrenLength'] = Array.isArray(response.data.children) ? response.data.children.length : 'not array';
        }

        if (response.data.Children) {
          responseAnalysis['dataChildrenPascalType'] = typeof response.data.Children;
          responseAnalysis['dataChildrenPascalIsArray'] = Array.isArray(response.data.Children);
          responseAnalysis['dataChildrenPascalLength'] = Array.isArray(response.data.Children) ? response.data.Children.length : 'not array';
        }

        if (response.data.result) {
          responseAnalysis['dataResultType'] = typeof response.data.result;
          responseAnalysis['dataResultIsArray'] = Array.isArray(response.data.result);
          responseAnalysis['dataResultKeys'] = typeof response.data.result === 'object' && response.data.result !== null ?
            Object.keys(response.data.result) : 'not object';

          if (response.data.result && typeof response.data.result === 'object' && response.data.result.children) {
            responseAnalysis['dataResultChildrenType'] = typeof response.data.result.children;
            responseAnalysis['dataResultChildrenIsArray'] = Array.isArray(response.data.result.children);
            responseAnalysis['dataResultChildrenLength'] = Array.isArray(response.data.result.children) ?
              response.data.result.children.length : 'not array';
          }
        }
      }

      // 直接检查是否存在特殊字段格式（驼峰与大写首字母）
      responseAnalysis['directKeysFound'] = Object.keys(response);
      if (response.data && typeof response.data === 'object') {
        responseAnalysis['allDataKeys'] = flattenKeys(response.data);
      }
    }

    console.log(`【超级详细】响应结构分析:`, responseAnalysis);

    // 记录完整的响应数据 - 只在开发模式使用，生产环境可以移除
    if (isVirtualRootNode) {
      console.log(`【完整数据】虚拟根节点查询响应原始JSON:`, JSON.stringify(response, null, 2));
    }

    // 特别处理空数据情况
    if (!response ||
      (response.data && (!response.data.children || response.data.children.length === 0)) ||
      (response.result && (!response.result.children || response.result.children.length === 0))) {
      console.warn(`【全面调试】获取用户 ${userId} 的直接下级返回空结果`);
    }

    return response;
  });
}

// 获取用户层级详情
export async function getHierarchyDetail(params: API.Hierarchy.GetHierarchyDetailParams) {
  const { orgId, token } = getHierarchyAuth();

  // 准备发送请求

  // 统一使用third_admin前缀
  return request<any>(`/third_admin/hierarchy/detail`, {
    method: 'GET',
    params: {
      ...(params || {}),  // 确保params不为空
      organization_id: orgId,
    },
    headers: hierarchyHeaders(token),
    baseURL: CHAT_URL,
  });
}

// 搜索层级用户
export async function searchHierarchy(params: API.Hierarchy.SearchHierarchyParams) {
  const { orgId, token } = getHierarchyAuth();

  // 如果keyword为空，则返回空结果
  if (!params.keyword || params.keyword.trim() === '') {
    console.log('【搜索】关键字为空，返回空结果');
    return Promise.resolve({ data: { users: [], total: 0 } });
  }

  console.log(`【搜索】执行搜索，关键字: "${params.keyword}"`);
  console.log('【搜索】认证信息:', {
    tokenExists: !!token,
    tokenPrefix: token ? token.substring(0, 10) + '...' : '无',
    orgId
  });

  // 准备发送请求 - 确保搜索参数正确并明确设置页码和每页大小
  // 根据后端DTO的字段名，使用正确的大小写
  // 根据DTO的JSON标签，使用正确的字段名
  const searchParams = {
    keyword: params.keyword.trim(),
    organization_id: orgId,
    include_org_nodes: true,
    // DTO中的字段使用JSON标签映射，所以这里要用JSON字段名
    level: 0,           // 不限制层级
    ancestor_id: '',    // 不限制上级
    sort_by_field: 'created_at',  // 按创建时间排序
    sort_order: 'asc'   // 升序排序（早注册的在上方）
  };

  console.log('【搜索】发送搜索请求，参数:', searchParams);

  // 统一使用third_admin前缀，注意这里是POST请求
  return request<any>(`/third_admin/hierarchy/search_panel`, {
    method: 'POST',
    data: searchParams,
    headers: hierarchyHeaders(token),
    baseURL: CHAT_URL,
  })
    .then(response => {
      console.log('【搜索】API返回原始数据类型:', typeof response);
      console.log('【搜索】API返回原始数据:', response);

      if (!response) {
        console.warn('【搜索】响应为空');
        return { data: { users: [] } };
      }

      const normalizedResponse: any = Array.isArray(response)
        ? { data: { users: response } }
        : response;
      if (Array.isArray(response)) {
        console.log('【搜索】响应本身是数组，作为users');
      }

      // 检查响应格式
      const responseAnalysis = {
        hasData: !!normalizedResponse.data,
        hasUsers: !!normalizedResponse.users,
        hasResult: !!normalizedResponse.result,
        topLevelKeys: Object.keys(normalizedResponse),
      };

      if (normalizedResponse.data) {
        responseAnalysis['dataKeys'] = Object.keys(normalizedResponse.data);
        responseAnalysis['dataHasUsers'] = !!normalizedResponse.data.users;
        responseAnalysis['dataHasResult'] = !!normalizedResponse.data.result;

        if (normalizedResponse.data.users) {
          responseAnalysis['usersIsArray'] = Array.isArray(normalizedResponse.data.users);
          responseAnalysis['usersLength'] = Array.isArray(normalizedResponse.data.users) ? normalizedResponse.data.users.length : 'not array';
        }
      }

      console.log('【搜索】响应结构分析:', responseAnalysis);

      // 标准化响应格式，确保有users数组
      // 处理各种可能的响应格式
      if (normalizedResponse.data) {
        // 直接在data中，最常见的情况
        if (!normalizedResponse.data.users) {
          // 检查其他可能的字段名称
          if (normalizedResponse.data.result) {
            console.log('【搜索】使用data.result作为users');
            normalizedResponse.data.users = normalizedResponse.data.result;
          } else if (normalizedResponse.data.list) {
            console.log('【搜索】使用data.list作为users');
            normalizedResponse.data.users = normalizedResponse.data.list;
          } else if (Array.isArray(normalizedResponse.data)) {
            console.log('【搜索】使用data数组作为users');
            normalizedResponse.data = { users: normalizedResponse.data };
          }
        } else {
          console.log('【搜索】使用标准格式data.users');
        }
      } else if (normalizedResponse.result) {
        // 直接在result中
        console.log('【搜索】使用顶层result作为users');
        normalizedResponse.data = { users: normalizedResponse.result };
      } else if (normalizedResponse.users) {
        // 直接在users中
        console.log('【搜索】使用顶层users');
        normalizedResponse.data = { users: normalizedResponse.users };
      } else {
        // 创建空结果
        console.warn('【搜索】无法识别的响应格式，创建空结果');
        normalizedResponse.data = { users: [] };
      }

      // 确保users数组存在
      if (!normalizedResponse.data || !normalizedResponse.data.users) {
        console.warn('【搜索】创建默认的users数组');
        normalizedResponse.data = { users: [] };
      }

      // 确保users是数组
      if (!Array.isArray(normalizedResponse.data.users)) {
        console.warn('【搜索】users不是数组，转换为空数组');
        normalizedResponse.data.users = [];
      }

      console.log(`【搜索】处理后的响应包含 ${normalizedResponse.data.users.length} 个结果`);

      // 如果数组为空但有关键词，输出警告
      if (normalizedResponse.data.users.length === 0 && params.keyword) {
        console.warn(`【搜索】未找到匹配关键词 "${params.keyword}" 的结果`);
      }

      normalizedResponse.data.total = normalizedResponse.data.users.length;

      return normalizedResponse;
    })
    .catch(error => {
      console.error('【搜索】搜索请求失败:', error);
      console.error('【搜索】错误详情:', error.message || error.toString());

      return { data: { users: [], total: 0 } };
    });
}

// dawn 2026-06-14 默认群所属业务员选择：仅搜索 level=2 的组织用户。
export async function searchLevel2Salespeople(keyword: string) {
  const kw = keyword.trim();
  if (!kw) {
    return Promise.resolve({ data: { users: [], total: 0 } });
  }

  const { orgId, token } = getHierarchyAuth();
  return request<any>(`/third_admin/hierarchy/search_panel`, {
    method: 'POST',
    data: {
      keyword: kw,
      organization_id: orgId,
      include_org_nodes: false,
      level: 2,
      ancestor_id: '',
      sort_by_field: 'created_at',
      sort_order: 'asc',
    },
    headers: hierarchyHeaders(token),
    baseURL: CHAT_URL,
  }).then((response: any) => {
    const users = response?.data?.users || response?.users || [];
    return {
      data: {
        users: Array.isArray(users) ? users : [],
        total: response?.data?.total || 0,
      },
    };
  });
}

// repairHierarchy 已被移除，使用 getHierarchyTree 获取最新数据代替
// 此处保留注释，便于后续了解历史变更
