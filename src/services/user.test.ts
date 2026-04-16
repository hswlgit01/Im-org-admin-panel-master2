import { request } from '@umijs/max';
import { resetUserPassword, updateUserInfo } from './user';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

jest.mock('@/config', () => ({
  ACCOUNT_URL: 'ACCOUNT_URL',
  API_URL: 'API_URL',
  CHAT_URL: 'CHAT_URL',
}));

const mockedRequest = request as jest.MockedFunction<typeof request>;

describe('user services', () => {
  beforeEach(() => {
    mockedRequest.mockResolvedValue({} as never);
    mockedRequest.mockClear();
  });

  it('resets organization users through the organization-admin token endpoint', async () => {
    await resetUserPassword({ userID: 'user-1', newPassword: 'pwd-md5' });

    expect(mockedRequest).toHaveBeenCalledWith('/third_admin/organization_user/reset_password', {
      method: 'POST',
      data: {
        userID: 'user-1',
        newPassword: 'pwd-md5',
      },
      headers: {
        isAccount: true,
      },
      baseURL: 'CHAT_URL',
    });
  });

  it('updates nickname through the registered third user update route', async () => {
    await updateUserInfo({ userID: 'user-1', nickname: 'new-name' });

    expect(mockedRequest).toHaveBeenCalledWith('/third/user/update_info', {
      method: 'POST',
      data: {
        userID: 'user-1',
        nickname: 'new-name',
      },
      headers: {
        isAccount: true,
      },
      baseURL: 'CHAT_URL',
    });
  });
});
