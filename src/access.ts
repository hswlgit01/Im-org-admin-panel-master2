/**
 * @see https://umijs.org/docs/max/access#access
 * */
export default function access(
  initialState: { currentUser?: API.AccountManage.AccountInfo } | undefined,
) {
  const { currentUser } = initialState ?? {};
  return {
    // canAdmin: currentUser && currentUser.level === 100,
    canAdmin: true,
  };
}
