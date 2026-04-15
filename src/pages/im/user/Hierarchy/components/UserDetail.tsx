import { Descriptions, Avatar, Tag, Typography, Tooltip } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { formatDate } from '@/utils/date';
import { useIntl } from '@umijs/max';

const { Text } = Typography;

interface UserDetailProps {
  user: API.Hierarchy.UserHierarchyInfo;
}

const UserDetail: React.FC<UserDetailProps> = ({ user }) => {
  const intl = useIntl();

  // 检查是否是组织根节点
  const isOrgNode = user.user_type === 'ORGANIZATION' ||
                   (user.user_id && typeof user.user_id === 'string' &&
                    user.user_id.startsWith('ORG_ROOT_'));

  // Format user level with different colors based on level
  const getLevelTag = (level: number) => {
    if (isOrgNode) {
      return <Tag color="purple">组织根节点</Tag>;
    }

    const colors = ['', 'gold', 'blue', 'green', 'purple', 'red'];
    const color = level > 0 && level < colors.length ? colors[level] : 'default';
    return <Tag color={color}>Lv{level}</Tag>;
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
          {user.ancestor_path && user.ancestor_path.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* 使用AncestorInfoList显示上级路径，顶层在最上方 */}
              {user.ancestor_info_list ? (
                // 使用新的API返回的祖先信息列表
                // 后端已排序，直接使用API返回的顺序
                user.ancestor_info_list.map((ancestorInfo, index) => {
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
                  const isDirectParent = index === user.ancestor_info_list.length - 1; // 最后一个是直接上级
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
                [...user.ancestor_path].reverse().map((ancestorId, index) => {
                  // 实际层级 = 总层级 - 当前索引
                  // 如果用户层级为5，有3个祖先，第一个显示的祖先(index=0)应该是最顶层，层级 = 5 - 3 = 2
                  // 第二个显示的祖先(index=1)层级 = 5 - 2 = 3
                  // 第三个显示的祖先(index=2)层级 = 5 - 1 = 4
                  const actualLevel = user.level - (user.ancestor_path.length - index);

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
                  const isDirectParent = index === user.ancestor_path.length - 1; // 最后一个是直接上级
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