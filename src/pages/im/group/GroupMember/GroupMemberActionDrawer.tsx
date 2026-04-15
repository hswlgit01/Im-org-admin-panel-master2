import { GroupRole } from '@/constants/enum';
import { muteGroupMember, transferGroup, updateGroupMemebr } from '@/services/group';
import { useIntl } from '@umijs/max';
import { Button, Drawer, Input, message, Radio, RadioChangeEvent, Space } from 'antd';
import { FC, useState } from 'react';

export type DrawerOptions = {
  opType: 'mute' | 'role';
  opMember?: API.GroupManage.GroupMember;
  opGroup?: API.GroupManage.GroupInfo;
  open: boolean;
};

type GroupMemberActionProps = {
  drawerOptions: DrawerOptions;
  closeDrawer: () => void;
  reload: () => void;
  changeGroupOwnerCallBack: (newID: string) => void;
};

const MuteMemberPage: FC<GroupMemberActionProps> = ({ drawerOptions, closeDrawer, reload }) => {
  const intl = useIntl();
  const [value, setValue] = useState<number>();
  const [customSec, setCustomSec] = useState<number>();

  const onChange = (e: RadioChangeEvent) => {
    setValue(e.target.value);
  };

  const comfirmMute = async () => {
    const sec = customSec ?? value;
    if ((sec ?? 0) < 60) {
      message.error(intl.formatMessage({ id: 'group.mute.custom.length.tips' }));
      return;
    }
    try {
      await muteGroupMember({
        mutedSeconds: sec!,
        userID: drawerOptions.opMember!.userID,
        groupID: drawerOptions.opMember!.groupID,
      });
      message.success(intl.formatMessage({ id: 'api.success' }));
      reload();
      closeDrawer();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <div>
        <Radio.Group onChange={onChange} value={value}>
          <Space direction="vertical">
            <Radio value={600}>{intl.formatMessage({ id: 'group.mute.10minute' })}</Radio>
            <Radio value={3600}>{intl.formatMessage({ id: 'group.mute.1hour' })}</Radio>
            <Radio value={43200}>{intl.formatMessage({ id: 'group.mute.12hour' })}</Radio>
            <Radio value={86400}>{intl.formatMessage({ id: 'group.mute.1day' })}</Radio>
          </Space>
        </Radio.Group>
      </div>
      <div>
        <div className="my-6 font-semibold">{intl.formatMessage({ id: 'group.mute.custom' })}</div>
        <Input
          type="number"
          placeholder={intl.formatMessage({ id: 'group.mute.custom.tips' })}
          value={customSec}
          onChange={(e) => setCustomSec(Number(e.target.value))}
        />
      </div>
      <div className="w-full text-right mt-6">
        <Button onClick={comfirmMute} type="primary" className="w-[82px]">
          {intl.formatMessage({ id: 'confirm' })}
        </Button>
      </div>
    </div>
  );
};

const SetMemberRolePage: FC<GroupMemberActionProps> = ({
  drawerOptions,
  closeDrawer,
  reload,
  changeGroupOwnerCallBack,
}) => {
  const intl = useIntl();
  const [value, setValue] = useState<GroupRole>(drawerOptions.opMember!.roleLevel);

  const onChange = (e: RadioChangeEvent) => {
    setValue(e.target.value);
  };

  const comfirmRole = async () => {
    console.log('drawerOptions ', drawerOptions);
    if (value === GroupRole.Owner) {

    }
    const func =
      value === GroupRole.Owner
        ? transferGroup({
            oldOwnerUserID: drawerOptions.opGroup!.ownerUserID,
            newOwnerUserID: drawerOptions.opMember!.userID,
            groupID: drawerOptions.opGroup!.groupID,
          })
        :
        updateGroupMemebr({ members: [{ ...drawerOptions.opMember!, roleLevel: value }] });

    try {
      await func;
      message.success(intl.formatMessage({ id: 'api.success' }));
      if (value === GroupRole.Owner) {
        changeGroupOwnerCallBack(drawerOptions.opMember!.userID);
      }
      reload();
      closeDrawer();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <Radio.Group onChange={onChange} value={value}>
        <Space direction="vertical" size="middle">
          <Radio value={GroupRole.Nomal}>
            {intl.formatMessage({ id: 'group.roleLevel.nomal' })}
          </Radio>
          <Radio value={GroupRole.Admin}>
            {intl.formatMessage({ id: 'group.roleLevel.admin' })}
          </Radio>
          <Radio value={GroupRole.Owner}>
            {intl.formatMessage({ id: 'group.roleLevel.owner' })}
          </Radio>
        </Space>
      </Radio.Group>
      {value !== drawerOptions.opMember?.roleLevel && (
        <div className="w-full text-right mt-6">
          <Button onClick={comfirmRole} type="primary" className="w-[82px]">
            {intl.formatMessage({ id: 'confirm' })}
          </Button>
        </div>
      )}
    </div>
  );
};

const GroupMemberActionDrawer: FC<GroupMemberActionProps> = (props) => {
  const intl = useIntl();
  const { drawerOptions, closeDrawer } = props;
  const title =
    drawerOptions.opType === 'mute'
      ? intl.formatMessage({ id: 'group.mute' })
      : intl.formatMessage({ id: 'group.roleLevel.seeting' });

  return (
    <Drawer
      placement="right"
      closable={false}
      onClose={closeDrawer}
      open={drawerOptions.open}
      title={title}
    >
      {drawerOptions.opType === 'mute' && <MuteMemberPage {...props} />}
      {drawerOptions.opType === 'role' && <SetMemberRolePage {...props} />}
    </Drawer>
  );
};

export default GroupMemberActionDrawer;
