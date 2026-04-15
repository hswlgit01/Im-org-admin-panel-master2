import { useParseMessage } from '@/utils/common';
import { MessageItem } from 'open-im-sdk/lib/types/entity';
import { forwardRef } from 'react';
import MessageRender from './MessageItem';
import { tipMessageTypes } from '@/constants/enum';

const HistoryMessageItem = (
  { message, isSelf }: { message: MessageItem; isSelf: boolean },
  ref: any,
) => {
  const { parseMessageByType } = useParseMessage();
  if (tipMessageTypes.includes(message.contentType)) {
    return (
      <div ref={ref} className="w-full text-center text-sm text-[#999] py-2 px-10">
        {parseMessageByType(message)}
      </div>
    );
  }

  return <MessageRender isSender={isSelf} message={message} />;
};

export default forwardRef(HistoryMessageItem);
