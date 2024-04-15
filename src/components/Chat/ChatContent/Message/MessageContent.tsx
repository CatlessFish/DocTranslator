import React, { useState } from 'react';
import useStore from '@store/store';

// import ContentView from './View/ContentView';
import EditView from './View/EditView';
import ResultView from './View/ResultView';

const MessageContent = ({
  role,
  content,
  messageIndex,
  sticky = false,
}: {
  role: string;
  content: string;
  messageIndex: number;
  sticky?: boolean;
}) => {
  const [isEdit, setIsEdit] = useState<boolean>(sticky);
  // const advancedMode = useStore((state) => state.advancedMode);

  return (
    <div className='relative flex flex-col gap-2 h-full md:gap-3 lg:w-[calc(100%-80px)]'
      style={{ margin: 'auto', paddingTop: '20px' }}>
      {isEdit ? (
        <EditView
          content={content}
          setIsEdit={setIsEdit}
          messageIndex={messageIndex}
          sticky={sticky}
        />
      ) : (
          <ResultView
          content={content}
          setIsEdit={setIsEdit}
          messageIndex={messageIndex}
        />
      )}
    </div>
  );
};

export default MessageContent;
