declare namespace API {
  type Pagination = {
    pageNumber: number;
    showNumber: number;
  };

  declare namespace AccountManage {
    type Account = {
      organization: {
        email: string;
        owner_id: string;
        contacts: string;
        created_at: string;
        description: string;
        id: string;
        invitation_code: string;
        name: string;
        phone: string;
        status: string;
        type: string;
        updated_at: string;
      };
      adminAccount: string;
      adminToken: string;
      adminUserID: string;
      faceURL: string;
      imToken: string;
      imUserID: string;
      level: number;
      nickname: string;
      user_id: string;
      dep_admin_token: string;
      im_token: string;
    };

    type AccountInfo = {
      account: string;
      createTime: number;
      faceURL: string;
      level: number;
      nickname: string;
      password: string;
      userID: string;
    };

    type AdminLoginParams = {
      email: string;
      password: string;
      phone_number: string;
      platform: number;
      device_id: string;
      area_code: string;
    };

    type UpdateAdminInfoParams = {
      nickname?: string;
      faceURL?: string;
      password?: string;
      userID: string;
    };

    type ChangeAdminPwdParams = {
      userID: string;
      newPassword: string;
      currentPassword: string;
    };
  }

  declare namespace UserManage {
    type User = {
      userChatID?: string;
      account: string;
      allowAddFriend: number;
      allowBeep: number;
      allowVibration: number;
      areaCode: string;
      birth: number;
      email: string;
      faceURL: string;
      gender: number;
      globalRecvMsgOpt: GlobalRecvMsgOpt;
      level: number;
      nickname: string;
      password: string;
      phoneNumber: string;
      registerType: number;
      userID: string;
      onlineStr?: string;
      inGroup?: boolean;
      isRealNameVerified: boolean;  // 是否已实名认证
      realName?: string;             // 真实姓名
    };

    type Member = {
      nickname: string;
      faceURL: string;
      birth: number;
      gender: number;
      account: string;
      password: string;
      user_id: string;
      role: string;
    };

    type WalletSnapshotItem = {
      user_id: string;
      wallet_balances?: { currency_id?: string; currency_name?: string; available_balance?: string }[];
      compensation_balance?: string;
    };

    enum Platform {
      iOS = 1,
      Android = 2,
      Windows = 3,
      MacOSX = 4,
      Web = 5,
      Linux = 7,
      AndroidPad = 8,
      iPad = 9,
    }

    type GetUserParams = {
      keyword?: string;
      pagination: Pagination;
    };

    type GetUserForIMParams = {
      userName?: string;
      userID?: string;
      pagination: Pagination;
    };

    type GetUserResult = {
      users: User[];
      total: number;
    };

    type GetFriendsParams = {
      userID?: string;
      pagination: Pagination;
    };

    type FriendUser = {
      appMangerLevel: number;
      createTime: number;
      ex: string;
      faceURL: string;
      globalRecvMsgOpt: number;
      nickname: string;
      userID: string;
    };

    type FriendsInfo = {
      addSource: number;
      createTime: number;
      ex: string;
      friendUser: FriendUser;
      isPinned: false;
      operatorUserID: string;
      ownerUserID: string;
      remark: string;
    };

    type GetFriendsResult = {
      friendsInfo: FriendsInfo[];
      total: number;
    };

    type GetUsersOnlineStatusParams = {
      userIDs: string[];
    };

    type UserPlatformInfo = {
      platformID: Platform;
      token: string[];
      total: number;
    };

    type GetUsersOnlineStatusResult = {
      singlePlatformToken: UserPlatformInfo[];
      status: string;
      userID: string;
    };

    type UpdateUserInfoParams = {
      userID: string;
    } & Partial<User>;

    type RegisterUserInfo = {
      areaCode: string;
      birth?: number;
      faceURL?: string;
      gender?: number;
      nickname: string;
      password: string;
      phoneNumber: string;
      registerType?: number;
    };

    type RegisterUserParams = {
      user: RegisterUserInfo;
    };

    type ResetUserPasswordParams = {
      userID: string;
      newPassword: string;
    };

    type UpdateBlockParams = {
      userID: string;
      reason?: string;
    };

    type DeleteBlockParams = {
      userIDs: string[];
    };

    type DeleteFriendParams = {
      ownerUserID: string;
      friendUserID: string;
    };

    type KickUserParams = {
      userID: string;
      platformID: number;
    };

    // Identity Verification Types
    type IdentityVerification = {
      userID: string;
      status: number; // 0-待认证 1-审核中 2-已认证 3-已拒绝
      realName: string;
      idCardNumber: string;
      idCardFront: string;
      idCardBack: string;
      rejectReason?: string;
      applyTime: number;
      verifyTime?: number;
      verifyAdmin?: string;
      nickname?: string;
      account?: string;
    };

    type GetIdentityListParams = {
      status?: number;
      keyword?: string;
      pagination: Pagination;
      // 排序参数
      orderKey?: string;
      orderDirection?: 'asc' | 'desc';
      // 时间范围参数
      applyStartTime?: string;  // 提交开始时间
      applyEndTime?: string;    // 提交结束时间
      verifyStartTime?: string; // 审核开始时间
      verifyEndTime?: string;   // 审核结束时间
      // 其他参数
      [key: string]: any;      // 允许传递额外的参数
    };

    type GetIdentityListResult = {
      list: IdentityVerification[];
      total: number;
    };

    type IdentityApproveBatchFailure = {
      userID: string;
      errMsg: string;
    };

    type IdentityApproveBatchResult = {
      success: number;
      failed: IdentityApproveBatchFailure[];
    };
  }

  declare namespace WalletManage {
    type TransferFundsParams = {
      receiverID: string;
      currency: string;
      amount: number;
      note?: string;
      payPassword: string;
    };

    type WalletBalance = {
      available_balance: number;
      frozen_balance: number;
      total_balance: number;
      wallet_currency: {
        id: string;
        name: string;
        fullName: string;
        icon: string;
        exchange_rate: number;
        min_available_amount: number;
      };
    };
  }

  declare namespace DefaultManage {
    type GetDefaultFriendsParams = {
      keyword: string;
      pagination: Pagination;
    };

    type DefaultFriends = {
      userID: string;
      user: AccountManage.AccountInfo;
      createTime: number;
    };

    type GetDefaultFriendsResult = {
      users: DefaultFriends[];
      total: number;
    };

    type GetDefaultGroupParams = {
      pagination: Pagination;
    };

    type GetDefaultGroupResult = {
      groups: GroupManage.GroupInfo[];
      total: number;
    };
  }

  declare namespace GroupManage {
    type GetGroupParams = {
      groupName?: string;
      groupID?: string;
      pagination: {
        pageNumber: number;
        showNumber: number;
      };
    };

    type Groups = {
      groupInfo: GroupInfo;
      groupOwnerUserID: string;
      groupOwnerUserName: string;
    };

    type GetGroupResult = {
      groups: Groups[];
      total: number;
    };

    type CreateGroupParams = {
      memberUserIDs: string[];
      adminUserIDs: string[];
      ownerUserID: string;
      groupInfo: Partial<GroupInfo>;
    };

    type GroupInfo = {
      applyMemberFriend: number;
      createTime: number;
      creatorUserID: string;
      ex: string;
      faceURL: string;
      groupID: string;
      groupName: string;
      groupType: number;
      introduction: string;
      lookMemberInfo: number;
      memberCount: number;
      needVerification: number;
      notification: string;
      notificationUpdateTime: number;
      notificationUserID: string;
      ownerUserID: string;
      status: number;
    };

    type UpdateGroupParams = {
      groupInfoForSet: Partial<GroupInfo>;
    };

    type GroupMember = {
      appMangerLevel: number;
      ex: string;
      faceURL: string;
      groupID: string;
      inviterUserID: string;
      joinSource: number;
      joinTime: number;
      muteEndTime: number;
      nickname: string;
      operatorUserID: string;
      roleLevel: number;
      userID: string;
    };

    type GetGroupMembersParams = {
      keyword?: string;
      groupID: string;
      pagination: {
        pageNumber: number;
        showNumber: number;
      };
    };

    type GetGroupMembersResult = {
      members: GroupMember[];
      total: number;
    };

    type GetSomeGroupMembersParams = {
      groupID: string;
      userIDs: string[];
    };

    type MuteGroupMemebrParams = {
      mutedSeconds: number;
      userID: string;
      groupID: string;
    };

    type KickGroupMemebrParams = {
      groupID: string;
      kickedUserIDs: string[];
      reason: '';
    };

    type InviteGroupMemebrParams = {
      groupID: string;
      invitedUserIDs: string[];
      reason: '';
    };

    type UpdateGroupMemebrParams = {
      members: [
        {
          ex?: string;
          groupID: string;
          nickname?: string;
          roleLevel?: number;
          userGroupFaceUrl?: string;
          userID: string;
        },
      ];
    };

    type TransferGroupParams = {
      newOwnerUserID: string;
      oldOwnerUserID: string;
      groupID: string;
    };
  }

  declare namespace ChatLog {
    type GetChatLogParams = {
      sendID?: string;
      recvID?: string;
      contentType: number;
      sendTime?: string;
      sessionType: number;
      pagination: {
        pageNumber: number;
        showNumber: number;
      };
    };

    type ChatLog = {
      clientMsgID: string;
      content: string;
      contentType: number;
      createTime: number;
      ex: string;
      groupFaceURL: string;
      groupID: string;
      groupMemberCount: number;
      groupName: string;
      groupOwner: string;
      groupType: number;
      msgFrom: number;
      recvID: string;
      recvNickname: string;
      sendID: string;
      sendTime: number;
      senderFaceURL: string;
      senderNickname: string;
      senderPlatformID: number;
      seq: number;
      serverMsgID: string;
      sessionType: number;
      status: number;
    };

    type ChatLogs = {
      chatLog: ChatLog;
      isRevoked: boolean;
    };

    type GetChatLogResult = {
      chatLogs: ChatLogs[];
      chatLogsNum: number;
    };

    type RevokeMessageParams = {
      conversationID: string;
      seq: number;
      userID: string;
    };

    type OfflinePushInfo = {
      desc: string;
      ex: string;
      iOSBadgeCount: boolean;
      iOSPushSound: string;
      title: string;
    };

    type NotifyPicture = {
      uuid: string;
      type: string;
      size: number;
      width: number;
      height: number;
      url: string;
    };
    type BatchSendParams = {
      NotificationName: string;
      NotificationType: number;
      sender_id: string;
      send_to_all: boolean;
      recv_ids: string[];
      elem: {
        image_url: string;
        title: string;
        description?: string;
        externalUrl: string;
      };
    };

    type PicBaseInfo = {
      uuid: string;
      type: string;
      size: number;
      width: number;
      height: number;
      url: string;
    };
  }

  declare namespace NotificationManage {
    type Account = {
      userID: string;
      nickName: string;
      faceURL: string;
    };

    type QueryNotificationAccountParams = {
      keyword?: string;
      pagination: {
        pageNumber: number;
        showNumber: number;
      };
      appManagerLevel?: number;
    };

    type QueryNotificationAccountResult = {
      notificationAccounts: Account[];
      total: number;
    };

    type UpdateNotificationAccountParams = {
      userID: string;
      appMangerLevel: number;
      nickName?: string;
      faceURL?: string;
    };
  }

  declare namespace LogManage {
    type SearchLogs = {
      keyword?: string;
      startTime?: number;
      endTime?: number;
      pagination: {
        pageNumber: number;
        showNumber: number;
      };
    };

    type LogItem = {
      filename: string;
      nickname: string;
      userID: string;
      platform: number;
      createTime: number;
      url: string;
      logID: string;
      systemType: string;
      version: string;
      ex: string;
    };
  }

  declare namespace Hierarchy {
    // 层级树节点
    type HierarchyTreeNode = {
      user_id: string;
      account?: string;
      nickname: string;
      face_url: string;
      level: number;
      team_size: number;
      direct_downline_count: number;
      children?: HierarchyTreeNode[];
      has_more_children: boolean;
      user_type?: string;
    };

    // 祖先信息，表示祖先节点的账号和昵称信息
    type AncestorInfo = {
      user_id: string;
      account: string;
      nickname: string;
      level: number;
    };

    // 用户层级详细信息
    type UserHierarchyInfo = {
      user_id: string;
      account?: string;
      nickname: string;
      face_url: string;
      level: number;
      invitation_code: string;
      team_size: number;
      direct_downline_count: number;
      ancestor_path: string[];
      created_at: string;
      user_type?: string;
      ancestor_info_list?: AncestorInfo[];
    };

    // 获取层级树参数
    type GetHierarchyTreeParams = {
      root_user_id?: string;
      max_depth?: number;
    };

    // 获取用户直接下级参数
    type GetHierarchyChildrenParams = {
      user_id: string;
      page_number?: number;
      show_number?: number;
      page?: number;
      page_size?: number;
    };

    // 获取用户直接下级结果
    type GetHierarchyChildrenResult = {
      children: UserHierarchyInfo[];
      total: number;
    };

    // 获取用户层级详情参数
    type GetHierarchyDetailParams = {
      user_id: string;
    };

    type SearchHierarchyParams = {
      keyword: string;
    };

    // 搜索层级用户结果
    type SearchHierarchyResult = {
      users: UserHierarchyInfo[];
      total: number;
    };
  }

  declare namespace SplitUpload {
    interface CommonOptions {
      operationID: string;
      token: string;
    }
    interface UploadParams {
      hash: string;
      size: number;
      partSize: number;
      maxParts: number;
      cause: string;
      name: string;
      contentType: string;
    }
    interface ConfirmData {
      uploadID: string;
      parts: string[];
      cause: string;
      name: string;
      contentType: string;
    }
    interface UploadData {
      url: string;
      upload: Upload;
    }
    interface Upload {
      uploadID: string;
      partSize: number;
      sign: Sign;
    }
    interface Sign {
      url: string;
      query?: KeyForValueList[];
      header?: KeyForValueList[];
      parts: Part[];
    }
    interface Part {
      partNumber: number;
      url: string;
      query?: KeyForValueList[];
      header?: KeyForValueList[];
    }
    interface KeyForValueList {
      key: string;
      values: string[];
    }
  }
}
