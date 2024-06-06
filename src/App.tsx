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

function App() {
  const initialiseNewChat = useInitialiseNewChat();
  const setChats = useStore((state) => state.setChats);
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
    const chats = useStore.getState().chats;
    const currentChatIndex = useStore.getState().currentChatIndex;
    if (!chats || chats.length === 0) {
      initialiseNewChat();
    }
    if (
      chats &&
      !(currentChatIndex >= 0 && currentChatIndex < chats.length)
    ) {
      setCurrentChatIndex(0);
    }
  }, []);

  useEffect(() => {
    setMainPagenum(0);
  }, []);

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
