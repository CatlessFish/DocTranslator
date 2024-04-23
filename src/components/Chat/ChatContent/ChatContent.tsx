import React, { useEffect, useRef } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';
import useStore from '@store/store';

import ScrollToBottomButton from './ScrollToBottomButton';
import ChatTitle from './ChatTitle';
import Message from './Message';
import CrossIcon from '@icon/CrossIcon';

import useSubmit from '@hooks/useSubmit';
import { generateDefaultTask } from '@constants/chat';

const ChatContent = () => {
  const setError = useStore((state) => state.setError);

  const task = useStore((state) =>
    state.chats &&
      state.chats.length > 0 &&
      state.currentChatIndex >= 0 &&
      state.currentChatIndex < state.chats.length
      ? state.chats[state.currentChatIndex].task
      : generateDefaultTask() // Should not happen?
  );

  // const stickyIndex = useStore((state) =>
  //   state.chats &&
  //   state.chats.length > 0 &&
  //   state.currentChatIndex >= 0 &&
  //   state.currentChatIndex < state.chats.length
  //     ? state.chats[state.currentChatIndex].messages.length
  //     : 0
  // );
  const stickyIndex = 0;
  // const advancedMode = useStore((state) => state.advancedMode);
  const generating = useStore.getState().generating;
  const hideSideMenu = useStore((state) => state.hideSideMenu);

  const saveRef = useRef<HTMLDivElement>(null);

  // clear error at the start of generating new messages
  useEffect(() => {
    if (generating) {
      setError('');
    }
  }, [generating]);

  const { error } = useSubmit();

  return (
    <div className='flex-1 overflow-hidden'>
      <ScrollToBottom
        className='h-full dark:bg-gray-800'
        followButtonClassName='hidden'
      >
        {/* <ScrollToBottomButton /> */}
        <div className='flex items-center text-sm dark:bg-gray-800 h-full'>
          <div className='w-full h-full'>
            {/* Input area */}
            <Message
              role={'user'}
              content={task.user_text}
              messageIndex={stickyIndex}
              sticky
            />
          </div>

          <div className='w-full h-full'>
            {/* Result area */}
            <Message
              role={'assistant'}
              content={task.result_text}
              messageIndex={1}
            />
          </div>

          {error !== '' && (
            <div className='relative py-2 px-3 w-3/5 mt-3 max-md:w-11/12 border rounded-md border-red-500 bg-red-500/10'>
              <div className='text-gray-600 dark:text-gray-100 text-sm whitespace-pre-wrap'>
                {error}
              </div>
              <div
                className='text-white absolute top-1 right-1 cursor-pointer'
                onClick={() => {
                  setError('');
                }}
              >
                <CrossIcon />
              </div>
            </div>
          )}
        </div>
      </ScrollToBottom>
    </div>
  );
};

export default ChatContent;
