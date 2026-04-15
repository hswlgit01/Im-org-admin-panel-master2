import { useIntl } from '@umijs/max';
import { Checkbox, Col, Modal, Row } from 'antd';
import React, { FC, useEffect, useRef, useState } from 'react';
import OIMAvatar from '../OIMAvatar';
import SelectUserTable, { SelectUserTableHandle } from './SelectUserTable';

export type SelectType = 'owner' | 'admin' | 'member';

type SelectUserModalProps = {
  groupID?: string;
  selectModalOptions: SelectModalOptions;
  closeSelectModal: () => void;
  selectedCallBack?: (data: SelectedListItem, type: SelectType) => void;
  onlyAdmin?: boolean;
  filterIds?: string[];
};

export type SelectedListItem = {
  data: API.UserManage.User[];
  keys: React.Key[];
};

export type SelectModalOptions = {
  open: boolean;
  selectType: SelectType;
  preSelectData?: SelectedListItem;
  disabledData?: string[];
};

const SelectUserModal: FC<SelectUserModalProps> = ({
  groupID,
  selectModalOptions,
  closeSelectModal,
  selectedCallBack,
  onlyAdmin,
  filterIds,
}) => {
  const intl = useIntl();
  const selectTableRef = useRef<SelectUserTableHandle>(null);
  const [selectedList, setSelectedList] = useState<SelectedListItem>({
    data: [],
    keys: [],
  });

  useEffect(() => {
    if (selectModalOptions.open && selectModalOptions.preSelectData) {
      let selectData = {
        data: selectModalOptions.preSelectData.data,
        keys: selectModalOptions.preSelectData.keys,
      };
      setSelectedList(selectData);
    }
  }, [selectModalOptions.open, onlyAdmin]);

  const onSelectedChange = (data: API.UserManage.User[], keys: React.Key[]) => {
    setSelectedList({
      data,
      keys,
    });
  };

  const cancelAll = () => {
    setSelectedList({
      data: [],
      keys: [],
    });
    selectTableRef.current?.clearSelect();
  };

  const closeAndRestState = () => {
    cancelAll();
    closeSelectModal();
  };

  const comfirmSelect = () => {
    selectedCallBack?.(selectedList, selectModalOptions.selectType);
    closeAndRestState();
  };

  const cancelSelect = (userID: string) => {
    selectTableRef.current?.cancelSelect(userID);
    setSelectedList({
      data: selectedList.data.filter((user) => user.userID !== userID),
      keys: selectedList.keys.filter((id) => id !== userID),
    });
  };

  return (
    <Modal
      width="80%"
      style={{ top: 50 }}
      open={selectModalOptions.open}
      onOk={comfirmSelect}
      onCancel={closeAndRestState}
      zIndex={99999}
    >
      <Row>
        <Col span={12}>
          <SelectUserTable
            groupID={groupID}
            ref={selectTableRef}
            defaultSelected={selectModalOptions.preSelectData?.keys}
            selectType={selectModalOptions.selectType === 'owner' ? 'radio' : 'checkbox'}
            onSelectedChange={onSelectedChange}
            disabledData={selectModalOptions.disabledData}
            onlyAdmin={onlyAdmin}
            filterIds={filterIds}
          />
        </Col>
        <Col span={12}>
          <div className="flex flex-col h-full max-h-[700px]">
            <div className="font-medium mt-6 mb-4 ml-8">
              {intl.formatMessage({ id: 'selectedMembers' })}
              {selectedList.data.length}
            </div>
            <div className="flex justify-between mx-8 my-4">
              <div>
                <Checkbox onChange={cancelAll} checked={selectedList.data.length !== 0} />
                <span className="ml-2">{intl.formatMessage({ id: 'user.faceURL' })}</span>
              </div>
              <div>{intl.formatMessage({ id: 'user.nickname' })}</div>
              <div>{intl.formatMessage({ id: 'pages.login.account' })}</div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {selectedList.data.map((user) => (
                <div key={user.userID} className="flex justify-between mx-8 my-3">
                  <div>
                    <Checkbox
                      checked
                      className="mr-2"
                      onChange={(e) => {
                        if (!e.target.checked) {
                          cancelSelect(user.userID);
                        }
                      }}
                    />
                    <OIMAvatar src={user.faceURL} text={user.nickname} />
                  </div>
                  <div className="max-w-[100px] truncate ml-[42px]">{user.nickname}</div>
                  <div className="max-w-[100px] truncate">{user.account}</div>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>
    </Modal>
  );
};

export default SelectUserModal;
