import React, { useEffect } from 'react';
import useStore from '@store/store';
import i18n from './i18n';

import Chat from '@components/Chat';
import Menu from '@components/Menu';

import useInitialiseNewChat from '@hooks/useInitialiseNewChat';
import { ChatInterface } from '@type/chat';
import { Theme } from '@type/theme';
import ApiPopup from '@components/ApiPopup';
import ApiMenu from '@components/ApiMenu';
import Pages from '@components/Pages';
import { ProfileMenu } from '@components/ProfileMenu';
import { ChatToSession, generateDefaultSession } from '@constants/chat';

function App() {
  const initialiseNewChat = useInitialiseNewChat();
  const setChats = useStore((state) => state.setChats);
  const setSessions = useStore((state) => state.setSessions);
  const setCurrentSessionIndex = useStore((state) => state.setCurrentSessionIndex);
  const setTheme = useStore((state) => state.setTheme);
  const setApiKey = useStore((state) => state.setApiKey);
  const setMainPagenum = useStore((state) => state.setMainPagenum);
  const setCurrentChatIndex = useStore((state) => state.setCurrentChatIndex);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    i18n.on('languageChanged', (lng) => {
      document.documentElement.lang = lng;
    });
  }, []);

  useEffect(() => {
    setMainPagenum(0);
  }, []);

  useEffect(() => {
    const chats = useStore.getState().chats;
    if (chats && chats.length) {
      setSessions(chats.map((chat) => ChatToSession(chat)));
      setChats([]);
    }
    const sessions = useStore.getState().sessions;
    if (!sessions || sessions.length === 0) {
      setSessions([generateDefaultSession()]);
    }
    setCurrentSessionIndex(0);
  }, [])

  return (
    <div className='overflow-hidden w-full h-full relative'>
      <Menu />
      <Pages
        children={[
          { title: 'Chat', content: <Chat /> },
          { title: '用户信息', content: <ProfileMenu /> },
          { title: 'API Settings', content: <ApiMenu /> },
        ]}
      />
      {/* <ApiPopup /> */}
    </div>
  );
}

export default App;
