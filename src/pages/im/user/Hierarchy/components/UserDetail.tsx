import { Descriptions, Avatar, Tag, Typography, Tooltip, Button, Popconfirm, message } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { formatDate } from '@/utils/date';
import { useIntl, request } from '@umijs/max';
import { CHAT_URL } from '@/config';
import { v4 as uuidv4 } from 'uuid';

const { Text } = Typography;

// dawn 2026-07-03 异地登录限制：后台清除组织用户的登录城市绑定，清除后其下次登录以新城市重新绑定。
async function clearLoginCity(userId: string) {
  return request<any>('/third_admin/organization_user/clear_login_city', {
    method: 'POST',
    data: { user_id: userId },
    headers: { isAccount: true, operationID: uuidv4() },
    baseURL: CHAT_URL,
  });
}

interface UserDetailProps {
  user: API.Hierarchy.UserHierarchyInfo;
}

const UserDetail: React.FC<UserDetailProps> = ({ user }) => {
  const intl = useIntl();

  // 检查是否是组织根节点
  const isOrgNode = user.user_type === 'ORGANIZATION' ||
                   (user.user_id && typeof user.user_id === 'string' &&
                    user.user_id.startsWith('ORG_ROOT_'));
  const ancestorInfoList = user.ancestor_info_list || [];
  const ancestorPath = user.ancestor_path || [];
  const hasAncestors = ancestorInfoList.length > 0 || ancestorPath.length > 0;

  // Format user level with different colors based on level
  const getLevelTag = (level: number) => {
    if (isOrgNode) {
      return <Tag color="purple">组织根节点</Tag>;
    }

    const colors = ['', 'gold', 'blue', 'green', 'purple', 'red'];
    const color = level > 0 && level < colors.length ? colors[level] : 'default';
    return <Tag color={color}>Lv{level}</Tag>;
  };

  const handleClearLoginCity = async () => {
    try {
      await clearLoginCity(user.user_id as string);
      message.success('已清除登录城市，该用户下次登录将以新城市重新绑定');
    } catch (e: any) {
      message.error(e?.message || '清除失败');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <Avatar
          src={isOrgNode ? undefined : user.face_url}
          icon={<TeamOutlined />}
          size={64}
          style={{ marginRight: '16px', backgroundColor: isOrgNode ? '#722ed1' : undefined }}
        />
        <div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: isOrgNode ? '#722ed1' : undefined }}>
            {isOrgNode ? user.nickname : (user.account || user.user_id)}
            {isOrgNode && <Tag color="purple" style={{ marginLeft: '8px' }}>虚拟根节点</Tag>}
          </div>
          {!isOrgNode && user.nickname && user.nickname !== user.account && (
            <Text type="secondary">{user.nickname}</Text>
          )}
        </div>
        {/* dawn 2026-07-03 异地登录限制：清除该用户登录城市绑定 */}
        {!isOrgNode && user.user_id && (
          <Popconfirm
            title="清除登录城市绑定？"
            description="清除后该用户下次登录将以新城市重新绑定（用于本人异地换地方登录）。"
            okText="确认清除"
            cancelText="取消"
            onConfirm={handleClearLoginCity}
          >
            <Button danger size="small" style={{ marginLeft: 'auto' }}>
              清除登录城市
            </Button>
          </Popconfirm>
        )}
      </div>

      <Descriptions
        bordered
        size="small"
        column={2}
      >
        <Descriptions.Item
          label={intl.formatMessage({
            id: 'pages.hierarchyManagement.userDetail.level',
            defaultMessage: '层级等级'
          })}
        >
          {getLevelTag(user.level)}
        </Descriptions.Item>

        <Descriptions.Item
          label={intl.formatMessage({
            id: 'pages.hierarchyManagement.userDetail.teamSize',
            defaultMessage: '团队规模'
          })}
        >
          <Tag color="blue">{user.team_size}</Tag>
        </Descriptions.Item>

        <Descriptions.Item
          label={intl.formatMessage({
            id: 'pages.hierarchyManagement.userDetail.directDownlines',
            defaultMessage: '直接下级数'
          })}
        >
          <Tag color="green">{user.direct_downline_count}</Tag>
        </Descriptions.Item>

        <Descriptions.Item
          label={intl.formatMessage({
            id: 'pages.hierarchyManagement.userDetail.created',
            defaultMessage: '创建时间'
          })}
        >
          {formatDate(user.created_at)}
        </Descriptions.Item>

        <Descriptions.Item
          label={intl.formatMessage({
            id: 'pages.hierarchyManagement.userDetail.invitationCode',
            defaultMessage: '邀请码'
          })}
          span={2}
        >
          <Tooltip title={intl.formatMessage({
            id: 'pages.hierarchyManagement.userDetail.invitationCodeTooltip',
            defaultMessage: '用于邀请新用户加入'
          })}>
            <Tag color="purple">{user.invitation_code}</Tag>
          </Tooltip>
        </Descriptions.Item>

        <Descriptions.Item
          label={intl.formatMessage({
            id: 'pages.hierarchyManagement.userDetail.ancestors',
            defaultMessage: '上级路径'
          })}
          span={2}
        >
          {hasAncestors ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* 使用AncestorInfoList显示上级路径，顶层在最上方 */}
              {ancestorInfoList.length > 0 ? (
                // 使用新的API返回的祖先信息列表
                // 后端已排序，直接使用API返回的顺序
                ancestorInfoList.map((ancestorInfo, index) => {
                  // 构建显示名称
                  let displayName;
                  const { account, nickname, level, user_id: ancestorId } = ancestorInfo;

                  // 处理显示名称
                  if (account && nickname && nickname !== account) {
                    displayName = `${account} (${nickname})`;
                  } else if (account) {
                    displayName = account;
                  } else if (nickname) {
                    displayName = nickname;
                  } else {
                    // 如果没有账号和昵称，显示ID的简短版本
                    displayName = typeof ancestorId === 'string' && ancestorId.length > 8
                      ? `${ancestorId.substring(0, 4)}...${ancestorId.substring(ancestorId.length - 4)}`
                      : ancestorId;
                  }

                  // 设置层级标签颜色：顶层使用gold，一级使用blue，其他使用green
                  // index=0是顶层，而不是根据level值判断（防止层级值不准确）
                  const isTopLevel = index === 0;
                  const isDirectParent = index === ancestorInfoList.length - 1; // 最后一个是直接上级
                  const tagColor = isTopLevel ? 'gold' : isDirectParent ? 'blue' : 'green';

                  return (
                    <div key={ancestorId} style={{ display: 'flex', alignItems: 'center' }}>
                      <Tag color={tagColor}>
                        Lv{level}
                      </Tag>
                      <span style={{ marginLeft: '8px' }}>{displayName}</span>
                    </div>
                  );
                })
              ) : (
                // 向后兼容 - 当API尚未更新时使用旧的显示方式
                // 注意：此处需要反转数组以确保顶层祖先在最上方
                [...ancestorPath].reverse().map((ancestorId, index) => {
                  // 实际层级 = 总层级 - 当前索引
                  // 如果用户层级为5，有3个祖先，第一个显示的祖先(index=0)应该是最顶层，层级 = 5 - 3 = 2
                  // 第二个显示的祖先(index=1)层级 = 5 - 2 = 3
                  // 第三个显示的祖先(index=2)层级 = 5 - 1 = 4
                  const actualLevel = user.level - (ancestorPath.length - index);

                  // 尝试获取用户信息（可能不存在）
                  const ancestorInfo = user[`ancestor_info_${index}`] || {};
                  const account = ancestorInfo.account || '';
                  const nickname = ancestorInfo.nickname || '';

                  // 构建显示名称
                  let displayName;
                  if (account && nickname && nickname !== account) {
                    displayName = `${account} (${nickname})`;
                  } else if (account) {
                    displayName = account;
                  } else if (nickname) {
                    displayName = nickname;
                  } else {
                    // 如果没有账号和昵称，显示ID的简短版本
                    displayName = typeof ancestorId === 'string' && ancestorId.length > 8
                      ? `${ancestorId.substring(0, 4)}...${ancestorId.substring(ancestorId.length - 4)}`
                      : ancestorId;
                  }

                  // 设置层级标签颜色：顶层使用gold，一级使用blue，其他使用green
                  // 基于索引而不是层级值设置颜色（防止层级计算不准确）
                  const isTopLevel = index === 0; // 第一个元素是顶层
                  const isDirectParent = index === ancestorPath.length - 1; // 最后一个是直接上级
                  const tagColor = isTopLevel ? 'gold' : isDirectParent ? 'blue' : 'green';

                  return (
                    <div key={ancestorId} style={{ display: 'flex', alignItems: 'center' }}>
                      <Tag color={tagColor}>
                        Lv{actualLevel}
                      </Tag>
                      <span style={{ marginLeft: '8px' }}>{displayName}</span>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <Text type="secondary">
              {intl.formatMessage({
                id: 'pages.hierarchyManagement.userDetail.noAncestors',
                defaultMessage: '无上级'
              })}
            </Text>
          )}
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
};

export default UserDetail;
