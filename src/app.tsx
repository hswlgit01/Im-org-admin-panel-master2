import { AvatarDropdown, AvatarName, Footer, SelectLang } from '@/components';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import defaultSettings from '../config/defaultSettings';
import VideoPlayer from './components/VideoPlayer';
import { errorConfig } from './requestErrorConfig';
import { userInfo } from './services/account';

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/login';

const clearAuthStorage = () => {
  localStorage.removeItem('IMAccountToken');
  localStorage.removeItem('IMAdminToken');
  localStorage.removeItem('IMAdminUserID');
  localStorage.removeItem('IMUserID');
  localStorage.removeItem('OrganizationID');
  localStorage.removeItem('walletExist');
  localStorage.removeItem('rsaPrivateKey');
  localStorage.removeItem('AES_KEY');
};

export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.AccountManage.AccountInfo;
  videoUrl?: string;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.AccountManage.AccountInfo | undefined>;
}> {
  const fetchUserInfo = async () => {
    const token = localStorage.getItem('IMAccountToken');
    const userID = localStorage.getItem('IMUserID');

    if (!token || !userID) {
      clearAuthStorage();
      return undefined;
    }

    try {
      const { data } = await userInfo({
        userIDs: [userID],
      });

      if (data?.users?.length) {
        return data.users[0];
      }

      clearAuthStorage();
    } catch (error) {
      clearAuthStorage();
      history.push(loginPath);
    }

    return undefined;
  };

  const { location } = history;
  if (location.pathname !== loginPath) {
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }

  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  return {
    actionsRender: () => [<VideoPlayer key="video" />, <SelectLang key="SelectLang" />],
    avatarProps: {
      src: initialState?.currentUser?.faceURL,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    waterMarkProps: {
      content: initialState?.currentUser?.nickname,
    },
    footerRender: () => {
      const { location } = history;
      if (location.pathname === '/dashboard') {
        return false;
      }
      return <Footer />;
    },
    onPageChange: () => {
      const { location } = history;
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    bgLayoutImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    links: [],
    menuHeaderRender: undefined,
    childrenRender: (children) => {
      return (
        <>
          {children}
          {isDev && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
    ...initialState?.settings,
  };
};

export const request = {
  ...errorConfig,
};
