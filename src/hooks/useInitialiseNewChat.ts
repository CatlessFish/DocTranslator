import React from 'react';
import useStore from '@store/store';
import { MessageInterface } from '@type/chat';
import { generateDefaultChat, generateDefaultSession } from '@constants/chat';

const useInitialiseNewChat = () => {
  const setChats = useStore((state) => state.setChats);
  const setCurrentChatIndex = useStore((state) => state.setCurrentChatIndex);

  const initialiseNewChat = () => {
    setChats([generateDefaultChat()]);
    setCurrentChatIndex(0);
  };

  return initialiseNewChat;
};

export const useInitialiseNewSession = () => {
  const setSessions = useStore((state) => state.setSessions);
  const setCurrentSessionIndex = useStore((state) => state.setCurrentSessionIndex);

  const initialiseNewSession = () => {
    setSessions([generateDefaultSession()]);
    setCurrentSessionIndex(0);
  };

  return initialiseNewSession;
}

export default useInitialiseNewChat;
