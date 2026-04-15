import {
  insertLottery,
  selectLotteryList,
  selectRewardList,
  updateLottery,
} from '@/services/checkin';
import { CloseCircleOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormGroup,
  ProFormList,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { useEffect, useRef, useState } from 'react';
// import DynamicInputs from './components/DynamicInputs';

import { Button, Card, Form, message, Space, Statistic } from 'antd';

export type DrawerOptions = {
  visible: boolean;
  selectUser: API.UserManage.User | undefined;
};

const UserList = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const [rewardList, setRewardList] = useState([]);

  useEffect(() => {
    selectRewardList({ page: 1, pageSize: 1000 }).then((res) => {
      const tmpData = res.data.data || [];
      setRewardList(
        tmpData.map((v) => ({
          label: v.name,
          value: v.ID,
        })),
      );
    });
  }, []);

  const columns: ProColumns<API.UserManage.User>[] = [
    {
      key: 'index',
      dataIndex: 'index',
      valueType: 'indexBorder',
    },
    {
      title: '奖券名称',
      key: 'name',
      dataIndex: 'name',
      align: 'center',
    },
    {
      title: '使用说明',
      key: 'desc',
      dataIndex: 'desc',
      hideInSearch: true,
      align: 'center',
    },
    {
      title: '有效期（天数）',
      key: 'valid_days',
      dataIndex: 'valid_days',
      hideInSearch: true,
      align: 'center',
    },
    {
      title: '奖品信息',
      key: 'lottery_config',
      dataIndex: 'lottery_config',
      hideInSearch: true,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          {record.lottery_config.map((v) => (
            <Card
              variant="borderless"
              styles={{
                body: {
                  padding: 6,
                },
              }}
            >
              <Statistic
                title={<div style={{ fontSize: 12 }}>{v?.lottery_reward_info?.name}</div>}
                value={v.right - v.left}
                valueStyle={{ fontSize: 14 }}
                suffix="%"
              />
            </Card>
          ))}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      hideInSearch: true,
      render: (_: any, record: any) => {
        console.log('record: ', record);

        return (
          <Space size="middle">
            <ModifyModel initData={record} />
          </Space>
        );
      },
    },
  ];

  const ModifyModel = (modalProps) => {
    const { initData } = modalProps;
    const [form] = Form.useForm();
    const lottery_config = Form.useWatch('lottery_config', form);
    return (
      <ModalForm
        title={initData ? '编辑' : '新增奖券'}
        trigger={
          <Button
            type={initData ? 'link' : 'primary'}
            onClick={() => {
              if (initData) {
                const tmpData = JSON.parse(JSON.stringify(initData));
                tmpData.lottery_config = initData.lottery_config.map((v) => ({
                  lottery_reward_id: v.lottery_reward_info?.id,
                  probability: v.right - v.left,
                }));
                form.setFieldsValue(tmpData);
              }
            }}
          >
            {initData ? '编辑' : '新增奖券'}
          </Button>
        }
        form={form}
        autoFocusFirstInput
        clearOnDestroy
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            form.resetFields();
          },
        }}
        submitTimeout={2000}
        onFinish={async (values) => {
          let total_probability = 0;
          values.lottery_config.forEach((v) => {
            total_probability += v.probability;
          });
          if (total_probability > 100) {
            message.info('总概率超过100%, 请重新调整概率');
            return false;
          }
          try {
            if (initData) {
              values.id = initData.id;
              await updateLottery(values);
            } else {
              await insertLottery(values);
            }
            actionRef.current?.reload();
            form.resetFields();
            message.success('提交成功');
            return true;
          } catch (error) {
            console.log('error');
            return false;
          }
        }}
      >
        <ProFormText name="name" label="奖券名称" rules={[{ required: true }]} />
        <ProFormTextArea name="desc" label="使用说明" />
        <ProFormDigit
          name="valid_days"
          label="有效期（天）"
          min={1}
          fieldProps={{
            precision: 0,
          }}
          rules={[{ required: true }]}
        />
        <ProFormList
          name="lottery_config"
          label="奖品信息"
          copyIconProps={false}
          deleteIconProps={{
            Icon: CloseCircleOutlined,
          }}
          initialValue={[
            {
              lottery_reward_id: undefined,
              probability: undefined,
            },
          ]}
          min={1}
          required
        >
          <ProFormGroup key="group">
            <ProFormSelect
              showSearch
              style={{ width: 300 }}
              name="lottery_reward_id"
              label="奖品"
              rules={[{ required: true }]}
              options={rewardList.filter((reward) => {
                const lottery_reward_ids = lottery_config?.map((v) => v.lottery_reward_id);
                if (lottery_reward_ids && lottery_reward_ids.includes(reward?.value)) {
                  return false;
                }
                return true;
              })}
              fieldProps={{
                labelRender: (labelProps) => {
                  const { value } = labelProps;
                  return rewardList.find((v) => v.value === value)?.label;
                },
              }}
            />
            <ProFormDigit
              style={{ width: 100 }}
              rules={[{ required: true }]}
              min={0}
              max={100}
              name="probability"
              label="概率"
              addonAfter="%"
            />
          </ProFormGroup>
        </ProFormList>
      </ModalForm>
    );
  };

  return (
    <PageContainer>
      <ProTable<API.UserManage.User>
        columns={columns}
        actionRef={actionRef}
        request={async (params = {}) => {
          console.log(params, 'params');

          const { data } = await selectLotteryList({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.name,
          });

          const tmpData = data.data ?? [];

          return {
            data: tmpData,
            success: true,
            total: data.total,
          };
        }}
        toolBarRender={() => <ModifyModel />}
        pagination={{
          defaultPageSize: 10,
          showQuickJumper: true,
        }}
      />
    </PageContainer>
  );
};

export default UserList;
