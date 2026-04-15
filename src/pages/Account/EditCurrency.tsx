import { splitUpload } from '@/services/upload';
import { updateCurrency } from '@/services/wallet';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, message, Modal, Space, Spin, Upload } from 'antd';
import { UploadRequestOption } from 'rc-upload/lib/interface';
import { useEffect, useState } from 'react';

export const EditCurrencyForm = ({
  isModalVisible,
  onCancel,
  onSuccess,
  currency,
}: {
  isModalVisible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
  currency: any;
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploadState, setUploadState] = useState({
    url: undefined as string | undefined,
    loading: false,
  });
  const [fileList, setFileList] = useState<any[]>([]);

  // 当币种数据变化或Modal打开时重置表单
  useEffect(() => {
    if (currency && isModalVisible) {
      console.log(currency, 'currency');

      form.setFieldsValue({
        name: currency.name,
        exchange_rate: currency.exchangeRate,
        minAvailableAmount: currency.minAvailableAmount, // 使用默认值或从currency获取
        maxRedPacketAmount: currency.maxRedPacketAmount, // 使用默认值或从currency获取
        maxTotalSupply: currency.maxTotalSupply, // 使用默认值或从currency获取
        decimals: currency.decimals, // 使用默认值或从currency获取
      });

      // 设置图片文件
      if (currency.icon) {
        setFileList([
          {
            uid: '-1',
            name: 'current-icon.png',
            status: 'done',
            url: currency.icon,
          },
        ]);
        setUploadState({ url: currency.icon, loading: false });
      } else {
        setFileList([]);
        setUploadState({ url: undefined, loading: false });
      }
    }
  }, [currency, isModalVisible, form]);

  const handleIconChange = ({ fileList }: { fileList: any[] }) => {
    setFileList(fileList);
  };

  const beforeUpload = (file: any) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传JPG/PNG格式的图片！');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过2MB！');
    }
    return isJpgOrPng && isLt2M;
  };

  const customUpload = async (data: UploadRequestOption) => {
    setUploadState((state) => ({ ...state, loading: true }));
    try {
      const { url: iconUrl } = await splitUpload(data.file as File);
      if (iconUrl) {
        setUploadState({ url: iconUrl, loading: false });
        // 更新文件列表显示
        setFileList([
          {
            uid: '-1',
            name: (data.file as File).name,
            status: 'done',
            url: iconUrl,
          },
        ]);
      }
    } catch (error) {
      setUploadState((state) => ({ ...state, loading: false }));
      message.error('上传失败');
      console.log(error);
    }
  };

  const onFinish = async (values: any) => {
    if (!currency?.key) {
      message.error('币种ID不存在');
      return;
    }

    setLoading(true);
    try {
      const params = {
        name: values.name,
        currency_id: currency.key,
        icon: uploadState.url,
        exchange_rate: values.exchange_rate,
        min_available_amount: values.minAvailableAmount,
        decimals: values.decimals,
        max_red_packet_amount: values.maxRedPacketAmount,
        max_total_supply: values.maxTotalSupply,
      };

      const { errCode } = await updateCurrency(params);

      if (errCode === 0) {
        message.success('币种更新成功');
        onCancel();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        message.error('更新失败，请重试');
      }
    } catch (error) {
      console.error('更新币种失败:', error);
      message.error('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="编辑币种"
      open={isModalVisible}
      footer={null}
      onCancel={onCancel}
      centered
      afterClose={() => {
        form.resetFields();
        setFileList([]);
        setUploadState({
          url: undefined,
          loading: false,
        });
      }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
        <Form.Item label="币种名称" name="name">
          <Input placeholder="币种名称" />
        </Form.Item>

        <Form.Item label="币种Logo">
          <Spin spinning={uploadState.loading}>
            <Upload
              listType="picture-card"
              fileList={fileList}
              maxCount={1}
              beforeUpload={beforeUpload}
              onChange={handleIconChange}
              customRequest={customUpload}
              showUploadList={true}
            >
              {fileList.length === 0 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传图标</div>
                </div>
              )}
            </Upload>
          </Spin>
        </Form.Item>

        <Form.Item
          label="与人民币汇率"
          name="exchange_rate"
          rules={[{ required: true, message: '请输入与人民币汇率' }]}
        >
          <Input style={{ width: '100%' }} placeholder="请输入1单位该货币等于多少人民币" />
        </Form.Item>

        <Form.Item
          label="最小可用金额"
          name="minAvailableAmount"
          rules={[{ required: true, message: '请输入最小可用金额' }]}
        >
          <Input placeholder="请输入最小可用金额" />
        </Form.Item>

        <Form.Item
          label="单次红包限额"
          name="maxRedPacketAmount"
          rules={[{ required: true, message: '请输入单次红包限额' }]}
        >
          <Input placeholder="请输入单次红包限额" />
        </Form.Item>

        <Form.Item
          label="小数位数"
          name="decimals"
          rules={[{ required: true, message: '请输入小数位数' }]}
        >
          <InputNumber
            min={0}
            max={9}
            precision={0}
            style={{ width: '100%' }}
            placeholder="请输入小数位数"
          />
        </Form.Item>

        <Form.Item
          label="最大供应量"
          name="maxTotalSupply"
          rules={[{ required: true, message: '请输入最大供应量' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入最大供应量" />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>取消</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
