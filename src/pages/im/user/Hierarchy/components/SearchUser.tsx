import { useState } from 'react';
import { Input, List, Avatar, Spin, Empty, message, Button, Space } from 'antd';
import { UserOutlined, SearchOutlined } from '@ant-design/icons';
import { useIntl, useRequest } from '@umijs/max';
import { searchHierarchy } from '@/services/hierarchy';

interface SearchUserProps {
  onUserSelect: (user: API.Hierarchy.UserHierarchyInfo) => void;
}

const SearchUser: React.FC<SearchUserProps> = ({ onUserSelect }) => {
  const intl = useIntl();
  /** 输入框当前内容（不触发请求） */
  const [inputValue, setInputValue] = useState('');
  /** 最近一次点击查询使用的关键词（用于空状态文案等） */
  const [searchValue, setSearchValue] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<API.Hierarchy.UserHierarchyInfo[]>([]);

  const { loading, run } = useRequest(
    (keyword: string) => searchHierarchy({ keyword }),
    {
      manual: true,
      onSuccess: (response) => {
        // 处理各种响应格式（含仅返回业务 data 或 axios 已解包的情况）
        let users: API.Hierarchy.UserHierarchyInfo[] = [];

        if (response?.data?.users) {
          users = response.data.users;
        } else if (Array.isArray(response?.users)) {
          users = response.users;
        } else if (response?.data?.result) {
          users = response.data.result;
        } else if (response?.result) {
          users = response.result;
        } else if (Array.isArray(response?.data)) {
          users = response.data;
        } else if (Array.isArray(response)) {
          users = response;
        }

        // 标准化用户数据，确保关键字段统一
        const standardizedUsers = users.map(user => ({
          ...user,
          user_id: user.user_id || user.userId || user.userID || '',
          nickname: user.nickname || user.nickName || user.userName || '未知用户',
          invitation_code: user.invitation_code || user.invitationCode || '',
          level: user.level || 0,
          team_size: user.team_size || user.teamSize || 0,
          direct_downline_count: user.direct_downline_count || user.directDownlineCount || 0
        }));

        setSearchResults(standardizedUsers);
        setShowResults(true);
      },
      onError: (error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('搜索用户失败:', error);
        }
        message.error('搜索用户失败，请重试');
        setSearchResults([]);
        setShowResults(true);
      }
    }
  );

  const handleSearch = () => {
    const value = inputValue.trim();
    if (value === '') {
      message.warning(
        intl.formatMessage({
          id: 'pages.hierarchyManagement.search.emptyKeyword',
          defaultMessage: '请输入关键词后再查询',
        }),
      );
      setShowResults(false);
      setSearchResults([]);
      setSearchValue('');
      return;
    }
    setSearchValue(value);
    setShowResults(true);
    run(value);
  };

  /**
   * 处理用户选择
   * 当点击搜索结果中的用户时调用
   * @param user 选中的用户信息
   */
  const handleUserClick = (user: API.Hierarchy.UserHierarchyInfo) => {
    onUserSelect(user);
    setShowResults(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          style={{ flex: 1 }}
          placeholder={intl.formatMessage({
            id: 'pages.hierarchyManagement.search.placeholder',
            defaultMessage: '前缀匹配：账号、昵称（attribute）与 IM 昵称（user）以关键词开头',
          })}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (e.target.value === '') {
              setShowResults(false);
              setSearchResults([]);
              setSearchValue('');
            }
          }}
          onPressEnter={handleSearch}
          onFocus={() => {
            if (searchResults.length > 0 && searchValue) {
              setShowResults(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => {
              setShowResults(false);
            }, 300);
          }}
          allowClear
        />
        <Button
          type="primary"
          icon={<SearchOutlined />}
          loading={loading}
          onClick={handleSearch}
          onMouseDown={(e) => e.preventDefault()}
        >
          查询
        </Button>
      </Space.Compact>

      {showResults && (
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: 0,
            width: '100%',
            background: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
          }}
        >
          <Spin spinning={loading}>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {searchResults.length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={searchResults}
                  renderItem={(user) => (
                    <List.Item
                      onClick={() => handleUserClick(user)}
                      style={{ cursor: 'pointer', padding: '8px 12px' }}
                      className="search-user-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                    >
                      <List.Item.Meta
                        avatar={<Avatar src={user.face_url} icon={<UserOutlined />} />}
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{user.account || user.user_id}</span>
                            {user.invitation_code && (
                              <span style={{ color: '#722ed1', fontSize: '12px' }}>
                                邀请码: {user.invitation_code}
                              </span>
                            )}
                          </div>
                        }
                        description={
                          <div>
                            <div style={{ fontSize: '12px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{user.nickname || '未设置昵称'}</span>
                              <span>层级: {user.level || 1}</span>
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                  style={{ padding: '0' }}
                />
              ) : (
                !loading &&
                searchValue.trim() !== '' && (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={intl.formatMessage({
                      id: 'pages.hierarchyManagement.search.noResults',
                      defaultMessage: '未找到匹配的用户',
                    })}
                    style={{ padding: '20px 0' }}
                  />
                )
              )}
            </div>
          </Spin>
        </div>
      )}
    </div>
  );
};

export default SearchUser;
