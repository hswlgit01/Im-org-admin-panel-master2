import default_cover from '@/assets/images/notification_cover.jpg';
import { SelectedListItem } from '@/components/SelectUserModal';
import SelectUserTable, {
  SelectUserTableHandle,
} from '@/components/SelectUserModal/SelectUserTable';
import {
  batchSendNotification,
  selectArticleList,
  selectNotificationAccountsList,
} from '@/services/notification';
import { splitUpload } from '@/services/upload';
import { UploadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Checkbox, Col, Input, message, Row, Select, Tag, Upload, UploadFile } from 'antd';
import { UploadRequestOption } from 'rc-upload/lib/interface';
import { useEffect, useRef, useState } from 'react';

const PublishNotification = () => {
  const intl = useIntl();
  const [allSend, setAllSend] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [accounts, setAccounts] = useState<API.NotificationManage.Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>();
  const [sending, setSending] = useState(false);
  const [articleList, setArticleList] = useState([]);
  const [fileList, setFileList] = useState<UploadFile[]>([
    {
      uid: '-11',
      name: 'default_notification_cover.jpg',
      status: 'done',
      url: default_cover,
    },
  ]);

  const selectTableRef = useRef<SelectUserTableHandle>(null);
  const [selectedList, setSelectedList] = useState<SelectedListItem>({
    data: [],
    keys: [],
  });

  useEffect(() => {
    selectArticleList({
      pagination: {
        page: 1,
        page_size: 1000,
      },
      status: 'published',
    }).then((res) => {
      console.log('res: ', res);
      const tmp = res.data.list.map((v) => {
        return {
          label: v.title,
          value: v.id,
        };
      });
      setArticleList(tmp);
    });
  }, []);

  const onSelectedChange = (data: API.UserManage.User[], keys: React.Key[]) => {
    setSelectedList({ data, keys });
  };

  const cancelSelect = (user_id: string) => {
    selectTableRef.current?.cancelSelect(user_id);
    setSelectedList({
      data: selectedList.data.filter((user) => user.user_id !== user_id),
      keys: selectedList.keys.filter((id) => id !== user_id),
    });
  };

  const getAccounts = async () => {
    try {
      const { data } = await selectNotificationAccountsList({
        pagination: {
          page: 1,
          page_size: 1000,
        },
      });
      setAccounts(data.list ?? []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAccounts();
  }, []);

  const customUpload = async (data: UploadRequestOption) => {
    console.log('customUpload: ', data);
    try {
      const { url: iconUrl } = await splitUpload(data.file as File);
      console.log('iconUrl', iconUrl);
      if (iconUrl) {
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
      // message.error('上传失败');
      console.log(error);
    }
  };

  const send2User = async () => {
    if (!selectedAccount) {
      message.warning(intl.formatMessage({ id: 'notification.account.tips' }));
      return;
    }
    if (!selectedList.data.length && !allSend) {
      message.warning('请选择接收通知的用户');
      return;
    }
    if (!title) {
      message.warning('请输入通知标题');
      return;
    }
    if (!fileList) {
      message.warning('请上传通知封面');
      return;
    }
    let img_url;
    if (fileList[0].uid === '-11') {
      const response = await fetch(default_cover);
      const blob = await response.blob();

      // 2. 将Blob转为File对象（需指定文件名）
      const file = new File([blob], 'default_notification_cover.jpg', { type: blob.type });
      // await customUpload({ file: file });
      const { url: iconUrl } = await splitUpload(file);
      img_url = iconUrl;
    } else {
      img_url = fileList[0].url;
    }


    setSending(true);
    let params: API.ChatLog.BatchSendParams = {
      sender_id: selectedAccount,
      send_to_all: allSend,
      recv_ids: selectedList.data.map((item) => item.userImID),
      elem: {
        image_url: img_url,
        title: title,
        article_id: externalUrl,
        description: content,
      },
    };
    console.log('params', params);
    try {
      await batchSendNotification(params);
      selectTableRef.current?.clearSelect();
      setSelectedList({ data: [], keys: [] });
      setContent('');
      setTitle('');
      setExternalUrl('');
      setFileList([
        {
          uid: '-11',
          name: 'default_notification_cover.jpg',
          status: 'done',
          url: default_cover,
        },
      ]);
      message.success(intl.formatMessage({ id: 'api.success' }));
    } catch (error) {
      console.log(error);
    }
    setSending(false);
  };
  const onPreview = async (file: UploadFile) => {
    let src = file.url as string;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as FileType);
        reader.onload = () => resolve(reader.result as string);
      });
    }
    const image = new Image();
    image.src = src;
    const imgWindow = window.open(src);
    imgWindow?.document.write(image.outerHTML);
  };

  const handleIconChange = ({ fileList }: { fileList: any[] }) => {
    console.log('handleIconChange', fileList);
    setFileList(fileList);
  };

  return (
    <PageContainer>
      <Row>
        <Col span={13} xxl={15}>
          <div className="pb-3">
            <div className="font-medium mb-2">
              {intl.formatMessage({ id: 'notification.account' })}
            </div>
            <Select
              value={selectedAccount}
              onSelect={(str) => setSelectedAccount(str)}
              className="w-[360px]"
              placeholder={intl.formatMessage({ id: 'notification.account.tips' })}
            >
              {accounts.map((account) => (
                <Select.Option key={account.user_id} value={account.user_id}>
                  {account.nickname}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className="font-medium">{intl.formatMessage({ id: 'notification.recvUser' })}</div>
          <div className="w-full bg-white h-[120px] mt-3 mb-4 p-2 rounded-lg overflow-auto custom_scrollbar">
            {selectedList.data.map((user) => (
              <Tag key={user.user_id} closable onClose={() => cancelSelect(user.user_id)}>
                {user.nickname}
              </Tag>
            ))}
          </div>

          <div className="font-medium">封面</div>
          <div className="w-full mt-3 mb-4">
            <Upload
              listType="picture-card"
              fileList={fileList}
              customRequest={customUpload}
              onPreview={onPreview}
              // onChange={handleIconChange}
              onRemove={()=>setFileList([])}
            >
              {fileList.length === 0 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>{intl.formatMessage({ id: 'api.upload' })}</div>
                </div>
              )}
            </Upload>
          </div>

          <div className="font-medium">
            {/*{intl.formatMessage({ id: 'notification.externalUrl' })}*/}
            文章
          </div>
          <div className="w-full mt-3 mb-4">
            {/*<Input*/}
            {/*  placeholder={intl.formatMessage({ id: 'notification.externalUrl.tips' })}*/}
            {/*  value={externalUrl}*/}
            {/*  onChange={(e) => setExternalUrl(e.target.value)}*/}
            {/*/>*/}
            <Select
              style={{ width: 600 }}
              options={articleList}
              allowClear
              onChange={(value) => {
                setExternalUrl(value);
              }}
            />
          </div>

          <div>
            <div className="font-medium">标题</div>
            <div className="w-full mt-3 mb-4">
              <Input
                placeholder={intl.formatMessage({ id: 'notification.content.title' })}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                showCount
                maxLength={50}
              />
            </div>
            <div className="font-medium">{intl.formatMessage({ id: 'notification.content' })}</div>
            <div className="w-full bg-white h-[350px] mt-3 py-1 rounded-lg relative px-3">
              <Input.TextArea
                placeholder={intl.formatMessage({ id: 'notification.content.tips' })}
                variant="borderless"
                autoSize={{ maxRows: 8, minRows: 8 }}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                showCount
                maxLength={500}
              />
              <Button
                loading={sending}
                onClick={send2User}
                className="!absolute right-5 bottom-8 px-6"
                type="primary"
              >
                {intl.formatMessage({ id: 'confirm' })}
              </Button>
            </div>
            <Checkbox
              checked={allSend}
              onChange={(e) => setAllSend(e.target.checked)}
              className="mt-4"
            >
              {intl.formatMessage({ id: 'notification.allSend' })}
            </Checkbox>
          </div>
        </Col>
        <Col className="bg-white rounded-md" offset={1} span={10} xxl={8}>
          <SelectUserTable ref={selectTableRef} onSelectedChange={onSelectedChange} />
        </Col>
      </Row>
    </PageContainer>
  );
};

export default PublishNotification;
