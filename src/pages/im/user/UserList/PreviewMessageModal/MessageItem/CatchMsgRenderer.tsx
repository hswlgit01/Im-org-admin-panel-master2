import { FC } from 'react';

import styles from './message-item.module.less';
import { useIntl } from '@umijs/max';

const CatchMessageRender: FC = () => {
  const intl = useIntl();
  return <div className={styles.bubble}> {intl.formatMessage({ id: 'catchMessage' })}</div>;
};

export default CatchMessageRender;
