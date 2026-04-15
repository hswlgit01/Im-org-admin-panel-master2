import { insertRewardConfig, selectLotteryList } from '@/services/checkin';
import { getWalletBalance } from '@/services/wallet';
import type { ActionType } from '@ant-design/pro-components';
import { Form, InputNumber, Modal, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';

interface ModifyConfigModalProps {
  visible: boolean;
  onCancel: () => void;
  actionRef: React.MutableRefObject<ActionType>;
  initData?: any;
}
const ModifyConfigModal: React.FC<ModifyConfigModalProps> = (props) => {
  const { visible, onCancel, actionRef, initData } = props;
  let initValue = initData;
  const [form] = Form.useForm();
  const [currencies, setCurrencies] = useState([]);
  const [rewardType, setRewardType] = useState('lottery');
  const [lotteryList, setLotteryList] = useState([]);
  const [currentCurrency, setCurrentCurrency] = useState<any>(null);
  useEffect(() => {
    getBalance();
    getLotteryList();
  }, []);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setRewardType('lottery');
    }
    if (visible && initValue) {
      console.log('initValue ', initValue);
      form.setFieldsValue(initValue);
      setRewardType(initValue.reward_type);
      initValue = null;
    }
  }, [visible]);

  const getBalance = async () => {
    const { data } = await getWalletBalance();
    if (data.wallet_balance && data.wallet_balance.length > 0) {
      const currenciesData = data.wallet_balance.map((item: any) => ({
        key: item.wallet_currency.id,
        label: item.wallet_currency.name,
        value: item.wallet_currency.id,
        decimals: item.wallet_currency.decimals,
      }));
      setCurrencies(currenciesData);
    }
  };

  const getLotteryList = async () => {
    const { data } = await selectLotteryList({
      page: 1,
      pageSize: 1000,
    });
    const tmpData = data.data || [];
    setLotteryList(
      tmpData.map((v) => ({
        label: v.name,
        value: v.id,
      })),
    );
  };

  const onOk = () => {
    form.submit();
  };
  const onFinish = async (values: any) => {
    await insertRewardConfig(values);
    message.success('操作成功');
    onCancel();
    form.resetFields();
    actionRef.current?.reload();
  };
  return (
    <Modal
      open={visible}
      title="修改配置"
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={onOk}
      destroyOnHidden={true}
    >
      <Form
        form={form}
        name="basic"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={{
          reward_type: 'lottery',
          auto: true,
        }}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item label="连续天数" name="streak" rules={[{ required: true }]}>
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="是否自动发放" name="auto" rules={[{ required: true }]}>
          <Select
            options={[
              {
                label: '是',
                value: true,
              },
              {
                label: '否',
                value: false,
              },
            ]}
          />
        </Form.Item>

        <Form.Item label="奖励类型" name="reward_type" rules={[{ required: true }]}>
          <Select
            options={[
              {
                label: '余额',
                value: 'cash',
              },
              {
                label: '抽奖券',
                value: 'lottery',
              },
              {
                label: '积分',
                value: 'integral',
              },
            ]}
            onChange={setRewardType}
          />
        </Form.Item>
        {rewardType === 'cash' && (
          <Form.Item label="币种" name="reward_id" rules={[{ required: true }]}>
            <Select
              options={currencies}
              onChange={(_, option) => {
                setCurrentCurrency(option);
              }}
            />
          </Form.Item>
        )}

        {rewardType === 'lottery' && (
          <Form.Item label="奖券类型" name="reward_id" rules={[{ required: true }]}>
            <Select options={lotteryList} />
          </Form.Item>
        )}

        {rewardType === 'cash' ? (
          <Form.Item label="金额" name="reward_amount" rules={[{ required: true }]}>
            <InputNumber
              precision={currentCurrency?.decimals || 2}
              min={0}
              style={{ width: '100%' }}
              addonAfter={currentCurrency?.label}
            />
          </Form.Item>
        ) : (
          <Form.Item label="数量" name="reward_amount" rules={[{ required: true }]}>
            <InputNumber
              min={1}
              precision={rewardType === 'lottery' ? 0 : 2}
              style={{ width: '100%' }}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default ModifyConfigModal;
