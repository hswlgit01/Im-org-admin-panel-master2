import { DeleteOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Checkbox, Col, Divider, Modal, Row, Space } from 'antd';
import { useEffect, useRef, useState } from 'react';
import OIMAvatar from '../OIMAvatar';
import SelectGroupTable, { SelectGroupTableHandle } from './SelectGroupTable';

type SelectGroupModalProps = {
  isModalOpen: boolean;
  selectType?: 'radio' | 'checkbox';
  defaultSelected?: string[];
  disabledData?: string[];
  onCancel: () => void;
  onOk: (groups: API.GroupManage.GroupInfo[]) => void;
};

const SelectGroupModal = (props: SelectGroupModalProps) => {
  const { isModalOpen, selectType = 'checkbox', defaultSelected, disabledData, onCancel, onOk } = props;
  const intl = useIntl();
  const tableRef = useRef<SelectGroupTableHandle>(null);
  const [selectedGroups, setSelectedGroups] = useState<API.GroupManage.GroupInfo[]>([]);

  useEffect(() => {
    if (!isModalOpen) {
      setSelectedGroups([]);
    }
  }, [isModalOpen]);

  const onSelectedChange = (groups: API.GroupManage.GroupInfo[]) => {
    setSelectedGroups(groups);
  };

  const updateSelectedGroup = (groupID: string, checked: boolean) => {
    if (!checked) {
      setSelectedGroups(selectedGroups.filter((group) => group.groupID !== groupID));
      tableRef.current?.cancelSelect(groupID);
    }
  };

  const delSelectedGroup = (groupID: string) => {
    setSelectedGroups(selectedGroups.filter((group) => group.groupID !== groupID));
    tableRef.current?.cancelSelect(groupID);
  };

  const cancelHandler = () => {
    onCancel();
    tableRef.current?.clearSelect();
  };

  const okHandler = () => {
    onOk(selectedGroups);
    tableRef.current?.clearSelect();
  };

  return (
    <Modal
      title={intl.formatMessage({ id: 'group.select' })}
      destroyOnClose
      width={880}
      open={isModalOpen}
      onOk={okHandler}
      onCancel={cancelHandler}
      bodyStyle={{
        maxHeight: '60vh',
        padding: 0,
      }}
    >
      <Row style={{ height: '60vh' }}>
        <Col span={14} style={{ height: '100%', overflowY: 'auto', padding: 16 }}>
          <SelectGroupTable
            ref={tableRef}
            selectType={selectType}
            defaultSelected={defaultSelected}
            disabledData={disabledData}
            onSelectedChange={onSelectedChange}
          />
        </Col>
        <Col span={10} style={{ height: '100%' }}>
          <div
            style={{
              padding: 16,
              borderLeft: '1px solid rgba(5, 5, 5, 0.06)',
              height: '100%',
            }}
          >
            <div className="mb-3 text-base">
              {intl.formatMessage({ id: 'selectedMembers' })}
              {selectedGroups.length}
            </div>
            <Divider style={{ margin: 0 }} />
            <div style={{ marginTop: 16, overflowY: 'auto', maxHeight: 'calc(100% - 60px)' }}>
              {selectedGroups.map((group) => (
                <div
                  key={group.groupID}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <Space>
                    {selectType === 'checkbox' && (
                      <Checkbox
                        checked
                        onChange={(e) => updateSelectedGroup(group.groupID, e.target.checked)}
                      />
                    )}
                    {/* dawn 2026-06-15 修复默认群组选择弹窗群头像破图：已选群列表同样使用默认群图标兜底。 */}
                    <OIMAvatar src={group.faceURL} text={group.groupName} isgroup />
                    <div>
                      <div className="text-sm">{group.groupName}</div>
                      <div className="text-xs text-gray-400">{group.groupID}</div>
                    </div>
                  </Space>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => delSelectedGroup(group.groupID)}
                  />
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>
    </Modal>
  );
};

export default SelectGroupModal;
