import { generateDefaultSession } from '@constants/chat';
import { StoreSlice } from './store';
import { ChatInterface, FolderCollection, MessageInterface, SessionInterface } from '@type/chat';

export interface ChatSlice {
  messages: MessageInterface[];
  chats?: ChatInterface[];
  currentChatIndex: number;
  sessions: SessionInterface[];
  currentSessionIndex: number;
  generating: boolean;
  error: string;
  folders: FolderCollection;
  setMessages: (messages: MessageInterface[]) => void;
  setChats: (chats: ChatInterface[]) => void;
  setCurrentChatIndex: (currentChatIndex: number) => void;
  setSessions: (sessions: SessionInterface[]) => void;
  setCurrentSessionIndex: (currentSessionIndex: number) => void;
  setGenerating: (generating: boolean) => void;
  setError: (error: string) => void;
  setFolders: (folders: FolderCollection) => void;
}

export const createChatSlice: StoreSlice<ChatSlice> = (set, get) => ({
  messages: [],
  currentChatIndex: -1,
  sessions: [generateDefaultSession()],
  currentSessionIndex: 0,
  generating: false,
  error: '',
  folders: {},
  setMessages: (messages: MessageInterface[]) => {
    set((prev: ChatSlice) => ({
      ...prev,
      messages: messages,
    }));
  },
  setChats: (chats: ChatInterface[]) => {
    set((prev: ChatSlice) => ({
      ...prev,
      chats: chats,
    }));
  },
  setCurrentChatIndex: (currentChatIndex: number) => {
    set((prev: ChatSlice) => ({
      ...prev,
      currentChatIndex: currentChatIndex,
    }));
  },
  setSessions: (sessions: SessionInterface[]) => {
    set((prev: ChatSlice) => ({
      ...prev,
      sessions: sessions,
    }));
  },
  setCurrentSessionIndex: (currentSessionIndex: number) => {
    set((prev: ChatSlice) => ({
      ...prev,
      currentSessionIndex: currentSessionIndex,
    }));
  },
  setGenerating: (generating: boolean) => {
    set((prev: ChatSlice) => ({
      ...prev,
      generating: generating,
    }));
  },
  setError: (error: string) => {
    set((prev: ChatSlice) => ({
      ...prev,
      error: error,
    }));
  },
  setFolders: (folders: FolderCollection) => {
    set((prev: ChatSlice) => ({
      ...prev,
      folders: folders,
    }));
  },
});
