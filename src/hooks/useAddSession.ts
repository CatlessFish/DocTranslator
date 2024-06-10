import React from 'react';
import useStore from '@store/store';
import { generateDefaultChat, generateDefaultSession } from '@constants/chat';
import { ChatInterface, SessionInterface } from '@type/chat';

const useAddSession = () => {
  // const setChats = useStore((state) => state.setChats);
  // const setCurrentChatIndex = useStore((state) => state.setCurrentChatIndex);
  const setSessions = useStore((state) => state.setSessions);
  const setCurrentSessionIndex = useStore((state) => state.setCurrentSessionIndex);

  const addSession = (folder?: string) => {
    // const chats = useStore.getState().chats;
    const sessions = useStore.getState().sessions;
    // if (chats) {
    if (sessions) {
      // const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));
      const updatedSessions: SessionInterface[] = JSON.parse(JSON.stringify(sessions));
      let titleIndex = 1;
      let title = `New Chat ${titleIndex}`;

      while (sessions.some((session) => session.title === title)) {
        titleIndex += 1;
        title = `New Chat ${titleIndex}`;
      }

      // updatedChats.unshift(generateDefaultChat(title, folder));
      // setChats(updatedChats);
      // console.log('[useAddChat] updatedChats:', updatedChats);
      // setCurrentChatIndex(0);
      updatedSessions.unshift(generateDefaultSession(title, folder));
      setSessions(updatedSessions);
      setCurrentSessionIndex(0);
    }
  };

  return addSession;
};

export default useAddSession;
