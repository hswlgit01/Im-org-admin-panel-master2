import { FC } from 'react';

import { MessageType } from 'open-im-sdk';
import { IMessageItemProps } from '.';
import styles from './message-item.module.less';

const TextMessageRender: FC<IMessageItemProps> = ({ message }) => {
  let content = message.textElem?.content;

  if (message.contentType === MessageType.QuoteMessage) {
    content = message.quoteElem.text;
  }

  return <div className={styles.bubble} dangerouslySetInnerHTML={{ __html: content }}></div>;
};

export default TextMessageRender;
