import OIMAvatar from '@/components/OIMAvatar';
import { API_URL, WS_URL } from '@/config';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { useLatest } from '@ant-design/pro-components';
import { Button, DatePicker, Empty, Input, Modal, Space, Spin } from 'antd';
import classNames from 'classnames';
import clsx from 'clsx';
import moment, { Moment } from 'moment';
import { CbEvents, OpenIMSDK, SessionType } from 'open-im-sdk';
import type {
  ConversationItem,
  MessageItem,
  SearchMessageResult,
} from 'open-im-sdk/lib/types/entity';
import { FC, useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Virtuoso } from 'react-virtuoso';
import HistoryMessageItem from './HistoryMessageItem';
import styles from './style.less';
import { canSearchMessageTypes } from '@/constants/enum';
import { getUserToken } from '@/services/user';
import { useIntl } from '@umijs/max';

const openIM = new OpenIMSDK();

type PreviewMessageModalProps = {
  closeModal: () => void;
  userID: string;
};

const PreviewMessageModal: FC<PreviewMessageModalProps> = ({ closeModal, userID }) => {
  const intl = useIntl();
  const [syncLoading, setSyncLoading] = useState(false);
  const [getMessageLoading, setGetMessageLoading] = useState(false);
  const [conversationSearchStr, setConversationSearchStr] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasMoreConversation, setHasMoreConversation] = useState(true);
  const [conversationList, setConversationList] = useState([] as ConversationItem[]);
  const [currentConversation, setCurrentConversation] = useState<ConversationItem>();
  const [messageList, setMessageList] = useState([] as MessageItem[]);
  const [offSetParams, setOffSetParams] = useState({
    startClientMsgID: '',
    lastMinSeq: 0,
    hasMore: true,
  });
  const latestOffsetParams = useLatest(offSetParams);
  const [searchParams, setSearchParams] = useState({
    keywords: '',
    timeRange: [] as number[],
    compRange: [],
    timeButton: '',
  });
  const latestSearchParams = useLatest(searchParams);
  const [searchOffset, setSearchOffset] = useState({
    pageIndex: 1,
    loading: false,
    hasMore: true,
  });
  const latestSearchOffset = useLatest(searchOffset);

  const loginIM = (userID: string) => {
    getUserToken(userID).then(({ data }) => {
      openIM
        .login({
          userID,
          token: data.token,
          apiAddr: API_URL,
          wsAddr: WS_URL,
          platformID: 10,
        })
        .then((res) => console.log(res))
        .catch((err) => console.log(err));
    });
  };

  const onCancel = async () => {
    openIM.logout();
    closeModal();
  };

  const syncStartHandler = () => {
    setSyncLoading(true);
  };
  const syncFinishHandler = () => {
    openIM
      .getConversationListSplit({
        offset: 0,
        count: 50,
      })
      .then(({ data }) => {
        setConversationList(data);
        setHasMoreConversation(data.length === 50);
        setSyncLoading(false);
      });
  };

  const setIMListener = () => {
    openIM.on(CbEvents.OnSyncServerStart, syncStartHandler);
    openIM.on(CbEvents.OnSyncServerFinish, syncFinishHandler);
  };

  const disposeIMListener = () => {
    openIM.off(CbEvents.OnSyncServerStart, syncStartHandler);
    openIM.off(CbEvents.OnSyncServerFinish, syncFinishHandler);
  };

  useEffect(() => {
    setIMListener();
    loginIM(userID);
    return () => {
      disposeIMListener();
    };
  }, []);

  const getMessageNomaly = async (item?: ConversationItem) => {
    setGetMessageLoading(true);
    try {
      const { data } = await openIM.getAdvancedHistoryMessageList({
        userID: '',
        groupID: '',
        count: 20,
        startClientMsgID: latestOffsetParams.current.startClientMsgID,
        conversationID: item ? item.conversationID : currentConversation?.conversationID ?? '',
        lastMinSeq: latestOffsetParams.current.lastMinSeq,
      });
      const messages: MessageItem[] = [...data.messageList];
      setMessageList((prevList) => [
        ...(latestOffsetParams.current.startClientMsgID ? prevList : []),
        ...messages.reverse(),
      ]);

      setOffSetParams({
        startClientMsgID: data.messageList[0]?.clientMsgID ?? '',
        lastMinSeq: data.lastMinSeq,
        hasMore: messages.length !== 0,
      });
    } catch (error) {}
    setGetMessageLoading(false);
  };

  const selectConversation = (item: ConversationItem) => {
    setCurrentConversation(item);
    setOffSetParams({
      startClientMsgID: '',
      lastMinSeq: 0,
      hasMore: true,
    });
    setSearchOffset({
      pageIndex: 1,
      loading: false,
      hasMore: true,
    });
    setSearchParams({
      keywords: '',
      timeButton: '',
      compRange: [],
      timeRange: [],
    });

    setTimeout(() => {
      getMessageNomaly(item);
    });
  };

  const searchMessageByTime = () => {
    const options = {
      conversationID: currentConversation!.conversationID,
      keywordList: [],
      keywordListMatchType: 0,
      senderUserIDList: [],
      messageTypeList: canSearchMessageTypes,
      searchTimePosition: latestSearchParams.current.timeRange[1],
      searchTimePeriod:
        latestSearchParams.current.timeRange[1] - latestSearchParams.current.timeRange[0],
      pageIndex: latestSearchOffset.current.pageIndex,
      count: 20,
    };

    openIM.searchLocalMessages(options).then(({ data }) => {
      const tmpData = data as unknown as SearchMessageResult;
      const messages = tmpData.searchResultItems ? tmpData.searchResultItems[0].messageList : [];
      console.log(messages);
      console.log(latestSearchOffset.current.pageIndex);

      setMessageList((prevList) => [
        ...(latestSearchOffset.current.pageIndex === 1 ? [] : prevList),
        ...messages,
      ]);

      setSearchOffset({
        loading: false,
        pageIndex: latestSearchOffset.current.pageIndex + 1,
        hasMore: messages.length === 20,
      });
    });
  };

  const datePackerChanged = (dates?: Moment[]) => {
    console.log(dates);

    if (!dates) {
      setSearchParams({
        keywords: '',
        timeButton: '',
        compRange: [],
        timeRange: [],
      });

      selectConversation({ ...currentConversation! });
      return;
    }
    setSearchParams({
      ...searchParams,
      keywords: '',
      compRange: dates as any,
      timeRange: dates.map((item) => item.unix()),
    });
    setSearchOffset({
      pageIndex: 1,
      loading: true,
      hasMore: true,
    });
    setTimeout(() => {
      searchMessageByTime();
    });
  };

  const searchMessageByKeyWords = () => {
    const options = {
      conversationID: currentConversation!.conversationID,
      keywordList: [latestSearchParams.current.keywords],
      keywordListMatchType: 0,
      senderUserIDList: [],
      messageTypeList: [],
      searchTimePosition: 0,
      searchTimePeriod: 0,
      pageIndex: latestSearchOffset.current.pageIndex,
      count: 20,
    };

    openIM.searchLocalMessages(options).then(({ data }) => {
      const tmpData = data as unknown as SearchMessageResult;
      const messages = tmpData.searchResultItems ? tmpData.searchResultItems[0].messageList : [];

      setMessageList((prevList) => [
        ...(latestSearchOffset.current.pageIndex === 1 ? [] : prevList),
        ...messages,
      ]);

      setSearchOffset({
        loading: false,
        pageIndex: latestSearchOffset.current.pageIndex + 1,
        hasMore: messages.length === 20,
      });
    });
  };

  const isSearch = searchParams.keywords || searchParams.timeRange.length > 0;
  const hasMore = isSearch ? searchOffset.hasMore : offSetParams.hasMore;

  const loadMoreMessage = () => {
    if (!isSearch) {
      getMessageNomaly();
      return;
    }

    if (latestSearchParams.current.keywords) {
      searchMessageByKeyWords();
    } else {
      searchMessageByTime();
    }
  };

  const enterSearchByKeywords = () => {
    setSearchOffset({
      pageIndex: 1,
      loading: true,
      hasMore: true,
    });
    setTimeout(() => {
      searchMessageByKeyWords();
    });
  };

  const setTimeButton = (type: string) => {
    let tmpArr = [moment().subtract(1, type as any), moment()];

    setSearchParams({
      keywords: '',
      timeButton: type,
      compRange: tmpArr as any,
      timeRange: tmpArr.map((item) => item.unix()),
    });
    setSearchOffset({
      pageIndex: 1,
      loading: true,
      hasMore: true,
    });
    setTimeout(() => {
      searchMessageByTime();
    });
  };

  const searchConversation = () => {
    if (conversationSearchStr) {
      setIsSearching(true);
    }
  };

  const loadMoreConversation = () => {
    if (!hasMoreConversation) return;
    openIM
      .getConversationListSplit({
        offset: 0,
        count: 50,
      })
      .then(({ data }) => {
        setConversationList((conversations) => [...conversations, ...data]);
        setHasMoreConversation(data.length === 50);
      });
  };

  const getRenderConversationList = isSearching
    ? conversationList.filter(
        (item) =>
          item.showName.includes(conversationSearchStr) ||
          item.userID.includes(conversationSearchStr) ||
          item.groupID.includes(conversationSearchStr),
      )
    : conversationList;

  const fetchMessageLoading = getMessageLoading || searchOffset.loading;

  return (
    <Modal
      destroyOnClose
      footer={null}
      closable={false}
      className={styles.preview_modal}
      width={1068}
      open
      onCancel={onCancel}
    >
      <div className="h-[35px] leading-[35px] w-full bg-[#F0F8FF] text-right pr-3">
        <CloseOutlined onClick={onCancel} className="text-xl text-[#999] cursor-pointer" />
      </div>
      <Spin spinning={syncLoading}>
        <div className="flex h-[600px] bg-[#f0f2f5]">
          <div className="w-[320px] bg-white mr-3">
            <div className="flex mx-3 my-3">
              <Space size={'middle'}>
                <Input
                  value={conversationSearchStr}
                  allowClear
                  onChange={(e) => {
                    setConversationSearchStr(e.target.value);
                    if (!e.target.value) {
                      setIsSearching(false);
                    }
                  }}
                  onPressEnter={searchConversation}
                  prefix={<SearchOutlined />}
                  placeholder={intl.formatMessage({ id: 'conversationSearchStr' })}
                />
                <Button onClick={searchConversation} size="small" type="primary">
                  {intl.formatMessage({ id: 'query' })}
                </Button>
              </Space>
            </div>
            <Virtuoso
              className="h-[542px] overflow-x-hidden"
              data={getRenderConversationList}
              startReached={loadMoreConversation}
              computeItemKey={(_, item) => item.conversationID}
              itemContent={(idx, item) => {
                return (
                  <div
                    key={idx}
                    onClick={() => selectConversation(item)}
                    className={classNames(
                      'flex items-center px-3 py-2 hover:bg-[#f4f8fd] rounded',
                      {
                        'bg-[#f4f8fd]': currentConversation?.conversationID === item.conversationID,
                      },
                    )}
                  >
                    <OIMAvatar
                      isgroup={item.conversationType === SessionType.WorkingGroup}
                      src={item.faceURL}
                      text={item.showName}
                    />
                    <div className="ml-3 truncate max-w-[120px]">{item.showName}</div>
                  </div>
                );
              }}
            />
          </div>
          <div className="flex flex-col w-full">
            <div className="bg-white mb-3 py-4 px-3 flex justify-between">
              <div>
                <DatePicker.RangePicker
                  disabled={currentConversation === undefined}
                  onChange={datePackerChanged as any}
                  value={searchParams.compRange as any}
                />
                <Button
                  disabled={currentConversation === undefined}
                  onClick={() => setTimeButton('day')}
                  type={searchParams.timeButton === 'day' ? 'link' : 'text'}
                >
                  {intl.formatMessage({ id: 'today' })}
                </Button>
                <Button
                  disabled={currentConversation === undefined}
                  onClick={() => setTimeButton('week')}
                  type={searchParams.timeButton === 'week' ? 'link' : 'text'}
                >
                  {intl.formatMessage({ id: 'thisWeek' })}
                </Button>
                <Button
                  disabled={currentConversation === undefined}
                  onClick={() => setTimeButton('month')}
                  type={searchParams.timeButton === 'month' ? 'link' : 'text'}
                >
                  {intl.formatMessage({ id: 'thisMonth' })}
                </Button>
              </div>
              <Space size={'middle'}>
                <Input
                  allowClear
                  disabled={currentConversation === undefined}
                  onChange={(e) => {
                    setSearchParams({
                      ...searchParams,
                      keywords: e.target.value,
                    });
                    if (!e.target.value) {
                      selectConversation({ ...currentConversation! });
                    }
                  }}
                  onPressEnter={enterSearchByKeywords}
                  value={searchParams.keywords}
                  prefix={<SearchOutlined />}
                />
                <Button
                  disabled={currentConversation === undefined}
                  onClick={enterSearchByKeywords}
                  size="small"
                  type="primary"
                >
                  {intl.formatMessage({ id: 'query' })}
                </Button>
              </Space>
            </div>
            <Spin
              wrapperClassName="flex-1 overflow-hidden"
              spinning={getMessageLoading && messageList.length > 0}
            >
              <div className="bg-white pb-3 h-full">
                {!fetchMessageLoading && !messageList.length ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className="m-0 flex h-full flex-col items-center justify-center"
                  />
                ) : (
                  <div
                    id="scrollableDiv"
                    className={clsx(
                      'flex h-full w-full flex-col-reverse overflow-x-hidden growable',
                    )}
                  >
                    <InfiniteScroll
                      dataLength={messageList.length}
                      next={loadMoreMessage}
                      className={clsx('flex w-full flex-col-reverse')}
                      inverse={true}
                      hasMore={hasMore}
                      loader={
                        messageList.length > 0 && (
                          <div className="flex justify-center py-2">
                            <Spin />
                          </div>
                        )
                      }
                      scrollableTarget="scrollableDiv"
                    >
                      {messageList.map((message) => (
                        <HistoryMessageItem
                          key={message.clientMsgID}
                          message={message}
                          isSelf={message.sendID === userID}
                        />
                      ))}
                    </InfiniteScroll>
                  </div>
                )}
              </div>
            </Spin>
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

export default PreviewMessageModal;
