import { FC } from 'react';

import OIMAvatar from '@/components/OIMAvatar';

import { IMessageItemProps } from '.';
import styles from './message-item.module.less';
import { useIntl } from '@umijs/max';

const CardMessageRenderer: FC<IMessageItemProps> = ({ message }) => {
  const intl = useIntl();
  const cardData = message.cardElem;
  return (
    <div className={styles['card-shadow']} style={{ marginBottom: '5px' }}>
      <div className="flex items-center bg-[#e6f3ff] p-4">
        <OIMAvatar src={cardData.faceURL} size={36} text={cardData.nickname} />
        <div className="ml-3 truncate" title={cardData.nickname}>
          {cardData.nickname}
        </div>
      </div>
      <div className="py-1.5 pl-4 text-xs text-[var(--sub-text)]">
        {intl.formatMessage({ id: 'personalCard' })}
      </div>
    </div>
  );
};

export default CardMessageRenderer;
