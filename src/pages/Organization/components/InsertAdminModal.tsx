import OIMAvatar from '@/components/OIMAvatar';
import SelectUserModal, {
  SelectedListItem,
  SelectModalOptions,
} from '@/components/SelectUserModal';
import { createTransfer } from '@/services/wallet';
import { aesEncrypt } from '@/utils/crypto';
import { SafetyOutlined, SwapOutlined, UserOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import {
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Typography,
} from 'antd';
import { FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const { Title, Text } = Typography;

type TransferModalProps = {
  isModalVisible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
  currencies: any[];
  balance: number;
};

const TransferModal: FC<TransferModalProps> = ({
                                                 isModalVisible,
                                                 onCancel,
                                                 onSuccess,
                                                 currencies,
                                                 balance,
                                               }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentCurrency, setCurrentCurrency] = useState<any>(null);
  const [selectUserModalOptions, setSelectUserModalOptions] = useState<SelectModalOptions>({
    open: false,
    selectType: 'owner',
  });
  const [selectedUser, setSelectedUser] = useState<API.UserManage.User | null>(null);
  const [isPayPasswordVisible, setIsPayPasswordVisible] = useState(false);
  const [transferStep, setTransferStep] = useState(1); // 1: 选择用户和金额, 2: 输入支付密码

  useEffect(() => {
    if (isModalVisible) {
      if (currencies.length > 0) {
        console.log(currencies, 'currencies');
        setCurrentCurrency(currencies[0]);
        form.setFieldsValue({
          currency: currencies[0].name,
        });
      }
      setTransferStep(1);
    } else {
      setTimeout(() => {
        if (!isModalVisible) {
          form.resetFields();
          setSelectedUser(null);
          setIsPayPasswordVisible(false);
          setTransferStep(1);
        }
      }, 300);
    }
  }, [isModalVisible, currencies]);

  const handleCurrencyChange = (value: string) => {
    const currency = currencies.find((c) => c.name === value);
    setCurrentCurrency(currency);
  };

  const openSelectUserModal = () => {
    setSelectUserModalOptions({
      ...selectUserModalOptions,
      open: true,
      selectType: 'owner',
    });
  };

  const closeSelectUserModal = () => {
    setSelectUserModalOptions({
      ...selectUserModalOptions,
      open: false,
    });
  };

  const handleUserSelected = (selectedList: SelectedListItem, type: any) => {
    console.log(selectedList, 'selectedList');
    if (selectedList.data.length > 0) {
      setSelectedUser(selectedList.data[0]);
    }
  };

  const proceedToPassword = () => {
    form
      .validateFields(['amount', 'currency', 'note'])
      .then(() => {
        if (!selectedUser) {
          message.error('请选择转账用户');
          return;
        }
        setTransferStep(2);
      })
      .catch(() => {
        // 验证失败，不做处理
      });
  };

  const handleTransfer = async () => {
    try {
      await form.validateFields();
      console.log(selectedUser, 'selectedUser');
      if (!selectedUser) {
        message.error('请选择转账用户');
        return;
      }

      setLoading(true);

      const transParams = {
        transaction_type: 4,
        total_amount: form.getFieldValue('amount') + '',
        total_count: 1,
        target_id: selectedUser.userID,
        greeting: form.getFieldValue('note'),
        currency_id: currentCurrency?.key,
        pay_password: form.getFieldValue('payPassword'),
        wallet_info_owner_type: 'organization',
      };
      console.log(transParams, 'transParams');

      const encryptodata = await aesEncrypt(JSON.stringify(transParams));
      const encryptoParams = {
        need_rsa_verify: false,
        encrypted_data: encryptodata,
        user_req_type: 'organization',
      };
      try {
        const {
          errCode,
          data: { transaction_id },
        } = await createTransfer(encryptoParams);

        message.success('转账成功');
        setLoading(false);
        onSuccess?.();
        onCancel();
      } catch (error: any) {
        setLoading(false);
        message.error(error?.message || '转账失败，请稍后再试');
      }
    } catch (error) {
      // 表单验证错误
    }
  };

  const handleCancel = () => {
    setSelectUserModalOptions({
      ...selectUserModalOptions,
      open: false,
    });
    onCancel();
  };

  const renderStep1 = () => {
    return (
      <>
        <Form.Item label="转账对象" required help="选择您要转账的用户">
          {selectedUser ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                backgroundColor: '#fafafa',
              }}
            >
              <OIMAvatar src={selectedUser.faceURL} text={selectedUser.nickname} size={40} />
              <div style={{ marginLeft: '16px', flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{selectedUser.nickname}</div>
                <div style={{ color: '#999', fontSize: '12px' }}>{selectedUser.userID}</div>
              </div>
              <Button type="link" onClick={openSelectUserModal}>
                更改
              </Button>
            </div>
          ) : (
            <Button
              onClick={openSelectUserModal}
              icon={<UserOutlined />}
              style={{ width: '100%', height: '40px' }}
            >
              选择用户
            </Button>
          )}
        </Form.Item>

        <Form.Item name="currency" label="币种" rules={[{ required: true, message: '请选择币种' }]}>
          <Select
            onChange={handleCurrencyChange}
            suffixIcon={<SwapOutlined />}
            optionLabelProp="label"
          >
            {currencies.map((currency) => (
              <Select.Option key={currency.name} value={currency.name} label={currency.name}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img
                    src={currency.icon}
                    alt={currency.name}
                    style={{ width: 20, height: 20, marginRight: 8 }}
                  />
                  <span>
                    {currency.name} - {currency.fullName}
                  </span>
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="amount"
          label="金额"
          rules={[
            { required: true, message: '请输入转账金额' },
            {
              type: 'number',
              min: 0.01,
              message: '金额必须大于0',
            },
            {
              type: 'number',
              max: currentCurrency?.available || 0,
              message: `余额不足，当前可用余额: ${currentCurrency?.available || 0}`,
            },
          ]}
          help={
            currentCurrency
              ? `可用余额: ${currentCurrency.available} ${currentCurrency.name}`
              : undefined
          }
        >
          <InputNumber
            style={{ width: '100%' }}
            precision={2}
            placeholder="请输入转账金额"
            addonAfter={currentCurrency?.name}
          />
        </Form.Item>

        <Form.Item name="note" label="备注">
          <Input.TextArea placeholder="请输入转账备注" maxLength={100} showCount rows={3} />
        </Form.Item>
      </>
    );
  };

  const renderStep2 = () => {
    if (!selectedUser || !currentCurrency) return null;

    const amount = form.getFieldValue('amount');
    const currency = form.getFieldValue('currency');

    return (
      <>
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <Title level={4}>转账确认</Title>
          <Text type="secondary">请确认转账信息并输入支付密码</Text>
        </div>

        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <Text type="secondary">转账给</Text>
            <Text strong>{selectedUser.nickname}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <Text type="secondary">金额</Text>
            <Text strong>
              {amount} {currency}
            </Text>
          </div>
          {form.getFieldValue('note') && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">备注</Text>
              <Text>{form.getFieldValue('note')}</Text>
            </div>
          )}
        </div>

        <Form.Item
          name="payPassword"
          label="支付密码"
          rules={[{ required: true, message: '6位数字', pattern: /^\d{6}$/ }]}
        >
          <Input.Password placeholder="请输入支付密码" prefix={<SafetyOutlined />} />
        </Form.Item>
      </>
    );
  };

  return (
    <>
      <Modal
        title={
          <div style={{ textAlign: 'center' }}>{transferStep === 1 ? '转账' : '确认支付'}</div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        width={480}
        bodyStyle={{ padding: '24px 32px' }}
        maskClosable={false}
        zIndex={1000}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            currency: currencies.length > 0 ? currencies[0].name : '',
            amount: '',
            note: '',
          }}
        >
          {transferStep === 1 ? renderStep1() : renderStep2()}

          <Divider style={{ margin: '24px 0 16px' }} />

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            {transferStep === 1 ? (
              <>
                <Button onClick={handleCancel}>取消</Button>
                <Button type="primary" onClick={proceedToPassword}>
                  下一步
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setTransferStep(1)}>上一步</Button>
                <Button type="primary" onClick={handleTransfer} loading={loading}>
                  确认转账
                </Button>
              </>
            )}
          </div>
        </Form>
      </Modal>

      {createPortal(
        <SelectUserModal
          selectModalOptions={{
            ...selectUserModalOptions,
            open: selectUserModalOptions.open,
          }}
          closeSelectModal={closeSelectUserModal}
          selectedCallBack={handleUserSelected}
        />,
        document.body,
      )}
    </>
  );
};

export default TransferModal;
