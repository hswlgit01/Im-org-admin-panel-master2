import { forceLogout, getUsersOnlineStatus } from '@/services/user';
import { Button, Checkbox, Drawer, message } from 'antd';
import { FC, useEffect, useState } from 'react';
import { DrawerOptions } from '.';
import { CheckboxValueType } from 'antd/es/checkbox/Group';
import { Platform } from '@/constants/platform';
import { useIntl } from '@umijs/max';
import OIMAvatar from '@/components/OIMAvatar';

type ForcedOfflineDrawerProps = {
  drawerOptions: DrawerOptions;
  reload: () => void;
  setDrawerOptions: (params: DrawerOptions) => void;
};

type Option = {
  label: string;
  value: string;
  disabled?: boolean;
};

const ForcedOfflineDrawer: FC<ForcedOfflineDrawerProps> = ({
  setDrawerOptions,
  reload,
  drawerOptions,
}) => {
  const intl = useIntl();
  const [platformList, setPlatformList] = useState<Option[]>([]);
  const [checkedValue, setCheckedValue] = useState<CheckboxValueType[]>([]);

  const closeDrawer = () => {
    setDrawerOptions({
      visible: false,
      selectUser: undefined,
    });
  };

  const kickOut = () => {
    const promiseList = checkedValue.map((value) => {
      return forceLogout({ userID: drawerOptions.selectUser!.userID, platformID: +value });
    });
    Promise.all(promiseList).then(() => {
      message.success(intl.formatMessage({ id: 'api.success' }));
      reload();
      closeDrawer();
    });
  };

  const getUserOnline = async () => {
    if (!drawerOptions.selectUser) return;
    try {
      const { data } = await getUsersOnlineStatus({
        userIDs: [drawerOptions.selectUser.userID],
      });
      setPlatformList(
        data[0].singlePlatformToken.map((item) => ({
          label: Platform[item.platformID],
          value: item.platformID + '',
        })),
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (drawerOptions.visible) {
      getUserOnline();
      return;
    }
    setCheckedValue([]);
  }, [drawerOptions.visible]);

  return (
    <Drawer
      title={intl.formatMessage({ id: 'user.forcedUserOffline' })}
      placement="right"
      closable={false}
      onClose={closeDrawer}
      open={drawerOptions.visible}
    >
      <div className="px-3">
        <div className="flex border-b items-center pb-5">
          <OIMAvatar
            size={55}
            src={drawerOptions.selectUser?.faceURL}
            text={drawerOptions.selectUser?.nickname}
          />
          <div className="flex flex-col justify-evenly ml-3 h-[55px]">
            <div className="truncate max-w-[200px]">{drawerOptions.selectUser?.nickname}</div>
            <div>{drawerOptions.selectUser?.userID}</div>
          </div>
        </div>
        <div className="pt-5">
          <Checkbox.Group
            className="flex flex-col kick_check"
            value={checkedValue}
            options={platformList}
            onChange={setCheckedValue}
          />
        </div>
        <div className="w-full text-right">
          <Button type="primary" onClick={kickOut} disabled={checkedValue.length === 0}>
            {intl.formatMessage({ id: 'user.forcedOffline' })}
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default ForcedOfflineDrawer;
