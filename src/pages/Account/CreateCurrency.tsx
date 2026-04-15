import { splitUpload } from '@/services/upload';
import { createCurrency } from '@/services/wallet';
import { aesEncrypt } from '@/utils/crypto';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, message, Modal, Space, Spin, Upload } from 'antd';
import { UploadRequestOption } from 'rc-upload/lib/interface';
import { useState } from 'react';
import { useIntl } from '@umijs/max';

export const CreateCurrencyForm = ({
  isModalVisible,
  onCancel,
  onSuccess,
}: {
  isModalVisible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploadState, setUploadState] = useState({
    url: undefined as string | undefined,
    loading: false,
  });
  const [fileList, setFileList] = useState<any[]>([]);

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
    if (!uploadState.url) {
      message.error(intl.formatMessage({ id: 'uploadCurrencyLogo' }));
      return;
    }

    setLoading(true);
    try {
      const params = {
        name: values.name,
        icon: uploadState.url,
        exchange_rate: values.exchange_rate,
        min_available_amount: values.min_available_amount,
        decimals: values.decimals,
        max_total_supply: values.max_total_supply,
        max_red_packet_amount: values.max_red_packet_amount,
      };

      const encryptParams = await aesEncrypt(JSON.stringify(params));
      const finalParams = {
        need_rsa_verify: false,
        encrypted_data: encryptParams,
      };

      const { errCode } = await createCurrency(params);

      if (errCode === 0) {
        message.success(intl.formatMessage({ id: 'operationSuccess' }));
        onCancel();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        message.error(intl.formatMessage({ id: 'operationFailed' }));
      }
    } catch (error) {
      console.error('创建货币失败:', error);
      message.error(intl.formatMessage({ id: 'operationFailed' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={intl.formatMessage({ id: 'issueCurrency' })}
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
        <Form.Item
          label={intl.formatMessage({ id: 'currencyName' })}
          name="name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="货币Logo" name="icon" rules={[{ required: false }]}>
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
          name="min_available_amount"
          rules={[{ required: true, message: '请输入最小可用金额' }]}
        >
          <Input placeholder="请输入最小可用金额" />
        </Form.Item>

        <Form.Item
          label="单次红包限额"
          name="max_red_packet_amount"
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
          name="max_total_supply"
          rules={[{ required: true, message: '请输入最大供应量' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入最大供应量" />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>取消</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              发行
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
