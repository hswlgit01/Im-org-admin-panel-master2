import { TransactionTypeColor, TransactionType } from '@/constants/enum';
import { getExchangeRate, getWalletBalance, getWalletTsRecord } from '@/services/wallet';
import { PlusOutlined, WalletOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import type { TabsProps } from 'antd';
import {
  Breadcrumb,
  Button,
  Card,
  DatePicker,
  Image,
  message,
  Select,
  Spin,
  Table,
  Tabs,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { CreateCurrencyForm } from './CreateCurrency';
import { CreateWalletForm } from './CreateWallet';
import { EditCurrencyForm } from './EditCurrency';
import styles from './index.less';
import TransferModal from './TransferModal';
import Verify from './Verify';
import { useIntl } from '@umijs/max';
const { RangePicker } = DatePicker;
const { Option } = Select;

const convertRatesToOptions = (rates: Record<string, number>) => {
  return Object.entries(rates).map(([currency, rate]) => {
    return {
      value: currency,
      label: currency,
      rate: rate,
    };
  });
};

const AccountPage: React.FC = () => {
  const intl = useIntl();
    
  const walletExist = localStorage.getItem('walletExist');
  const [loading, setLoading] = useState(false);
  const [currencyOptions, setCurrencyOptions] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('CNY');
  const [currentRate, setCurrentRate] = useState<number>(1);
  const [originalUsdBalance, setOriginalUsdBalance] = useState<number>(0);

   const TransactionTypeText: Record<number, string> = {
    [TransactionType.TransferOut]: intl.formatMessage({ id: 'transferOut' }),
    [TransactionType.TransferRefund]: intl.formatMessage({ id: 'transferRefund' }),
    [TransactionType.TransferIn]: intl.formatMessage({ id: 'transferReceive' }),
    [TransactionType.RedPacketRefund]: intl.formatMessage({ id: 'redPacketRefund' }),
    [TransactionType.RedPacketOut]: intl.formatMessage({ id: 'redPacketOut' }),
    [TransactionType.RedPacketIn]: intl.formatMessage({ id: 'redPacketReceive' }),
    [TransactionType.Deposit]: intl.formatMessage({ id: 'recharge' }),
    [TransactionType.Withdraw]: intl.formatMessage({ id: 'withdraw' }),
    [TransactionType.Consume]: intl.formatMessage({ id: 'consumption' }),
    [TransactionType.IssueCurrency]: intl.formatMessage({ id: 'issueCurrency' }),
  };
  useEffect(() => {
    console.log(selectedCurrency);
  }, [selectedCurrency]);

  const fetchExchangeRate = async () => {
    try {
      const { data } = await getExchangeRate();
      delete data.rates.BTC;
      const res = convertRatesToOptions(data.rates);
      setCurrencyOptions(res);
    } catch (err) {
      message.error('Failed to fetch exchange rate');
    }
  };
  const getBalance = async () => {
    setLoading(true);
    const { data } = await getWalletBalance();
    const originalUsd = data.total_balance_usd;
    setOriginalUsdBalance(originalUsd);

    setAccountBalance({
      usd: originalUsd,
      available: Number(originalUsd) - Number(data.total_frozen_balance),
      frozen: data.total_frozen_balance,
    });

    if (data.wallet_balance && data.wallet_balance.length > 0) {
      const currenciesData = data.wallet_balance.map((item: any) => ({
        key: item.wallet_currency.id,
        name: item.wallet_currency.name,
        fullName: `${item.wallet_currency.name} Token`,
        icon: item.wallet_currency.icon,
        available: Number(item.available_balance),
        exchangeRate: item.wallet_currency.exchange_rate,
        minAvailableAmount: item.wallet_currency.min_available_amount,
        maxRedPacketAmount: item.wallet_currency.max_red_packet_amount,
        maxTotalSupply: item.wallet_currency.max_total_supply,
        decimals: item.wallet_currency.decimals,
        creatorId: item.wallet_currency.creator_id,
      }));
      setCurrencies(currenciesData);
    }

    setLoading(false);
  };

  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [currencyFilter, setCurrencyFilter] = useState<string>('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[number, number] | null>(null);
  const [transactionCurrencyOptions, setTransactionCurrencyOptions] = useState<any[]>([]);

  const getTsRecord = async (params?: any) => {
    setTransactionLoading(true);
    try {
      const { data } = await getWalletTsRecord({
        page: currentPage,
        pageSize: pageSize,
        order: 'created_at',
        ...(transactionTypeFilter ? { type: transactionTypeFilter } : {}),
        ...(currencyFilter ? { currency_id: currencyFilter } : {}),
        ...(dateRange
          ? {
              startTime: dateRange[0],
              endTime: dateRange[1],
            }
          : {}),
        ...params,
      });

      if (data) {
        setTransactionTotal(data.total);

        // 转换交易记录数据格式
        const formattedTransactions = data.data.map((item: any) => ({
          id: item.id,
          walletId: item.WalletId,
          currencyId: item.currency_id,
          currencyName: item.currency_info.name,
          currencyIcon: item.currency_info.icon,
          amount: item.amount,
          remark: item.remark,
          source: item.source,
          type: item.type,
          typeText: TransactionTypeText[item.type as number] || '未知类型',
          time: dayjs(item.transaction_time).format('YYYY-MM-DD HH:mm:ss'),
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));

        setTransactions(formattedTransactions);

        const currencyOptions = Array.from(
          new Set(data.data.map((item: any) => item.currency_id)),
        ).map((currencyId) => {
          const item = data.data.find((i: any) => i.currency_id === currencyId);
          return {
            value: item.currency_id,
            label: item.currency_info.name,
            icon: item.currency_info.icon,
          };
        });

        setTransactionCurrencyOptions(currencyOptions);
      }
    } catch (error) {
      console.error('获取交易记录失败', error);
      message.error(intl.formatMessage({ id: 'operationFailed' }));
    } finally {
      setTransactionLoading(false);
    }
  };

  // 处理分页变化
  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) setPageSize(size);
  };

  // 处理日期范围变化
  const handleDateRangeChange = (dates: any, dateStrings: [string, string]) => {
    if (dates) {
      // 转换为时间戳，使用毫秒级时间戳
      const startTimestamp = new Date(dates[0]).getTime() / 1000;
      const endTimestamp = new Date(dates[1]).getTime() / 1000;
      console.log('startTimestamp', startTimestamp);
      setDateRange([startTimestamp, endTimestamp]);
    } else {
      setDateRange(null);
    }
  };

  // 应用筛选条件
  const applyFilters = () => {
    setCurrentPage(1); // 重置到第一页
    getTsRecord({
      page: 1,
      type: transactionTypeFilter,
      currency_id: currencyFilter,
      ...(dateRange ? { startTime: dateRange[0], endTime: dateRange[1] } : {}),
    });
  };

  // 重置筛选条件
  const resetFilters = () => {
    // 先重置所有筛选条件状态
    setCurrencyFilter('');
    setTransactionTypeFilter(null);
    setDateRange(null);
    setCurrentPage(1);

    // 然后立即调用一次getTsRecord，使用空的筛选参数
    getTsRecord({
      page: 1,
      type: null,
      currency_id: '',
      startTime: null,
      endTime: null,
    });
  };

  useEffect(() => {
    if (walletExist === 'true') {
      getBalance();
      fetchExchangeRate();
      getTsRecord();
    }
  }, []);

  // 监听分页变化
  useEffect(() => {
    if (walletExist === 'true') {
      getTsRecord();
    }
  }, [currentPage, pageSize]);

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [accountBalance, setAccountBalance] = useState({
    usd: 0,
    available: 0,
    frozen: 0,
  });

  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [createWalletVisible, setCreateWalletVisible] = useState(false);
  const [createCurrencyVisible, setCreateCurrencyVisible] = useState(false);
  const [editCurrencyVisible, setEditCurrencyVisible] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [currentCurrency, setCurrentCurrency] = useState<any>(null);

  const openCreateWallet = () => {
    setVerifyModalVisible(false);
    setCreateWalletVisible(true);
  };

  const [currencies, setCurrencies] = useState([]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const changeCurrency = async (value: string) => {
    setLoading(true);
    setSelectedCurrency(value);
    try {
      const { data } = await getExchangeRate();
      const rate = data.rates[value] || 1;
      setCurrentRate(rate);

      const convertedBalance = originalUsdBalance * rate;
      setAccountBalance({
        ...accountBalance,
        usd: convertedBalance,
      });
    } catch (err) {
      message.error('Failed to fetch exchange rate');
    }
    setLoading(false);
  };

  const tabs: TabsProps['items'] = [
    {
      key: 'overview',
      label: intl.formatMessage({ id: 'accountOverview' }),
      children: (
        <div className={styles.accountOverview}>
          <div className={styles.balanceCard}>
            <div className={styles.balanceInfo}>
              <div className={styles.accountIconContainer}>
                <WalletOutlined className={styles.accountIcon} />
              </div>
              <div className={styles.balanceData}>
                <div className={styles.balanceLabel}>{intl.formatMessage({ id: 'accountBalance' })}</div>
                <div className={styles.balanceValue}>
                  <span className={styles.mainAmount}>{originalUsdBalance} CNY</span>
                  <span className={styles.secondaryAmount}>
                    ≈ {accountBalance.usd} {selectedCurrency}
                  </span>
                </div>
                <div className={styles.balanceDetails}>
                  <span>可用 {accountBalance.available}</span>
                  <span className={styles.separator}>|</span>
                  {/*<span>冻结 {accountBalance.frozen}</span>*/}
                </div>
              </div>
            </div>
            <div className={styles.balanceActions}>
              <Select
                className={styles.currencySelect}
                value={selectedCurrency}
                options={currencyOptions}
                showSearch
                onChange={changeCurrency}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'currencies',
      label:intl.formatMessage({ id: 'currencyManagement' }),
      children: (
        <div className={styles.currencyManagement}>
          <div className={styles.currencyHeader}>
            <div></div>
          </div>

          <Table
            dataSource={currencies}
            rowKey="key"
            className={styles.currencyTable}
            pagination={{
              pageSize: 10,
              total: currencies.length,
            }}
          >
            <Table.Column
              title={intl.formatMessage({ id: 'currency' })}
              dataIndex="name"
              key="name"
              render={(text, record: any) => (
                <div className={styles.currencyInfo}>
                  <div className={styles.currencyIcon}>
                    <Image
                      src={record.icon}
                      alt={record.name}
                      width={24}
                      height={24}
                      preview={false}
                      className={styles.currencyIcon}
                    />
                  </div>
                  <div>
                    <div>{record.name}</div>
                    <div className={styles.currencyFullName}>{record.fullName}</div>
                  </div>
                </div>
              )}
            />
            <Table.Column
              title={intl.formatMessage({ id: 'availableBalance' })}
              dataIndex="available"
              key="available"
              render={(text, record: any) => (
                <span>
                  {text} {record.name}
                </span>
              )}
            />
            <Table.Column
              title={intl.formatMessage({ id: 'exchangeRateToCNY' })}
              dataIndex="exchangeRate"
              key="exchangeRate"
              render={(text, record: any) => (
                <span>
                  1 {record.name} = {text} CNY
                </span>
              )}
            />
            <Table.Column
              title={intl.formatMessage({ id: 'minAvailableAmount' })}
              dataIndex="minAvailableAmount"
              key="minAvailableAmount"
              render={(text, record: any) => (
                <span>
                  {text} {record.name}
                </span>
              )}
            />
            <Table.Column
              title={intl.formatMessage({ id: 'redPacketLimit' })}
              dataIndex="maxRedPacketAmount"
              key="maxRedPacketAmount"
              render={(text, record: any) => (
                <span>
                  {text} {record.name}
                </span>
              )}
            />
            {/* <Table.Column
              title="状态"
              dataIndex="status"
              key="status"
              render={(text) => <Tag color={text === '启用' ? 'success' : 'default'}>{text}</Tag>}
            /> */}
            <Table.Column
              title=""
              key="action"
              render={(_, record: any) => (
                <Button
                  type="link"
                  className={styles.editBtn}
                  onClick={() => {
                    console.log(localStorage.getItem('OrganizationId'), 'record123');
                    openEditCurrency(record);
                  }}
                  disabled={record.creatorId !== localStorage.getItem('OrganizationID')}
                >
                  {intl.formatMessage({ id: 'edit' })}
                </Button>
              )}
            />
          </Table>
        </div>
      ),
    },
    {
      key: 'transactions',
      label: intl.formatMessage({ id: 'transactionRecords' }),
      children: (
        <div className={styles.transactionRecords}>
          <div className={styles.filterBar}>
            <div className={styles.filterItem}>
              <span className={styles.filterLabel}>{intl.formatMessage({ id: 'currency' })}：</span>
              <Select
                style={{ width: 120 }}
                allowClear
                value={currencyFilter || undefined}
                onChange={(value) => setCurrencyFilter(value)}
              >
                {transactionCurrencyOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </div>
            <div className={styles.filterItem}>
              <span className={styles.filterLabel}>{intl.formatMessage({ id: 'transactionType' })}：</span>
              <Select
                style={{ width: 170 }}
                allowClear
                value={transactionTypeFilter || undefined}
                onChange={(value) => setTransactionTypeFilter(value)}
              >
                {Object.entries(TransactionTypeText).map(([type, text]) => (
                  <Option key={type} value={Number(type)}>
                    {text}
                  </Option>
                ))}
              </Select>
            </div>
            <div className={styles.filterItem}>
              <RangePicker
                onChange={handleDateRangeChange}
                value={dateRange ? [dayjs(dateRange[0] * 1000), dayjs(dateRange[1] * 1000)] : null}
              />
            </div>
            <div className={styles.filterActions}>
              <Button type="primary" onClick={applyFilters}>
                {intl.formatMessage({ id: 'search' })}
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={resetFilters}>
                {intl.formatMessage({ id: 'reset' })}
              </Button>
            </div>
          </div>

          <Table
            dataSource={transactions}
            rowKey="id"
            loading={transactionLoading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: transactionTotal,
              onChange: handlePageChange,
              showSizeChanger: true,
            }}
            className={styles.transactionTable}
          >
            <Table.Column title={intl.formatMessage({ id: 'transactionId' })} dataIndex="id" key="id" ellipsis />
            <Table.Column title={intl.formatMessage({ id: 'transactionTime' })} dataIndex="time" key="time" />
            <Table.Column
              title={intl.formatMessage({ id: 'currency' })}
              dataIndex="currencyName"
              key="currencyName"
              render={(text, record: any) => (
                <div className={styles.currencyInfo}>
                  <div className={styles.currencyIcon}>
                    <Image
                      src={record.currencyIcon}
                      alt={record.currencyName}
                      width={24}
                      height={24}
                      preview={false}
                    />
                  </div>
                  <span>{text}</span>
                </div>
              )}
            />
            <Table.Column
              title={intl.formatMessage({ id: 'transactionType' })}
              dataIndex="typeText"
              key="typeText"
              render={(text, record: any) => {
                const color = TransactionTypeColor[record.type as number] || 'default';
                return <Tag color={color}>{text}</Tag>;
              }}
            />
            <Table.Column
              title={intl.formatMessage({ id: 'transactionAmount' })}
              dataIndex="amount"
              key="amount"
              render={(amount, record: any) => {
                const isPositive = parseFloat(amount) >= 0;
                return (
                  <span style={{ color: isPositive ? '#52c41a' : '#ff4d4f' }}>
                    {isPositive ? '+' : ''}
                    {amount} {record.currencyName}
                  </span>
                );
              }}
            />
            <Table.Column title={intl.formatMessage({ id: 'remark' })} dataIndex="remark" key="remark" ellipsis />
          </Table>
        </div>
      ),
    },
  ];

  // 打开编辑币种表单
  const openEditCurrency = (record: any) => {
    console.log(record, 'record');
    setCurrentCurrency(record);
    setEditCurrencyVisible(true);
  };

  // 刷新货币列表数据
  const refreshCurrencies = async () => {
    if (walletExist === 'true') {
      await getBalance();
      await getTsRecord();
    }
  };

  return (
    <PageContainer
      header={{
        title: '',
        breadcrumb: <Breadcrumb items={[{ title: '首页' }, { title: '账户管理' }]} />,
      }}
    >
      <Spin spinning={loading}>
        <Card>
          <div className={styles.pageHeader}>
            <h2 className={styles.pageTitle}>{intl.formatMessage({ id: 'accountOverview' })}</h2>
            <div className={styles.pageActions}>
              {walletExist === 'true' ? (
                <>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateCurrencyVisible(true)}
                  >
                    {intl.formatMessage({ id: 'issue' })}
                  </Button>
                  <Button onClick={() => setTransferModalVisible(true)}>{intl.formatMessage({ id: 'transfer' })}</Button>
                </>
              ) : (
                <Button onClick={() => setVerifyModalVisible(true)}>{intl.formatMessage({ id: 'createWallet' })}</Button>
              )}
            </div>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={tabs}
            className={styles.accountTabs}
          />
        </Card>
      </Spin>
      <Verify
        isModalVisible={verifyModalVisible}
        onCancel={() => setVerifyModalVisible(false)}
        openCreateWallet={openCreateWallet}
      />
      <CreateWalletForm
        isModalVisible={createWalletVisible}
        onCancel={() => setCreateWalletVisible(false)}
      />
      <CreateCurrencyForm
        isModalVisible={createCurrencyVisible}
        onCancel={() => setCreateCurrencyVisible(false)}
        onSuccess={refreshCurrencies}
      />
      <EditCurrencyForm
        isModalVisible={editCurrencyVisible}
        onCancel={() => setEditCurrencyVisible(false)}
        onSuccess={refreshCurrencies}
        currency={currentCurrency}
      />
      <TransferModal
        isModalVisible={transferModalVisible}
        onCancel={() => setTransferModalVisible(false)}
        onSuccess={refreshCurrencies}
        currencies={currencies}
        balance={accountBalance.available}
      />
    </PageContainer>
  );
};

export default AccountPage;
