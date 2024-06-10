import React, { useEffect, useRef, useState } from 'react';
import useStore from '@store/store';
import { shallow } from 'zustand/shallow';

import ChatFolder from './ChatFolder';
import SessionHistory from './SessionHistory';
import ChatSearch from './ChatSearch';

import {
  SessionHistoryInterface,
  SessionHistoryFolderInterface,
  SessionInterface,
  FolderCollection,
} from '@type/chat';

const SessionHistoryList = () => {

  const currentSessionIndex = useStore((state) => state.currentSessionIndex);
  const setSessions = useStore((state) => state.setSessions);
  const sessionTitles = useStore(
    (state) => state.sessions.map((session) => session.title),
    shallow
  );
  const setFolders = useStore((state) => state.setFolders);

  const [isHover, setIsHover] = useState<boolean>(false);
  const [sessionFolders, setSessionFolders] = useState<SessionHistoryFolderInterface>(
    {}
  );
  const [noSessionFolders, setNoSessionFolders] = useState<SessionHistoryInterface[]>(
    []
  );
  const [filter, setFilter] = useState<string>('');

  const sessionsRef = useRef<SessionInterface[]>(useStore.getState().sessions || []);
  const foldersRef = useRef<FolderCollection>(useStore.getState().folders);
  const filterRef = useRef<string>(filter);

  const updateFolders = useRef(() => {
    const _folders: SessionHistoryFolderInterface = {};
    const _noFolders: SessionHistoryInterface[] = [];
    const sessions = useStore.getState().sessions;
    const folders = useStore.getState().folders;

    Object.values(folders)
      .sort((a, b) => a.order - b.order)
      .forEach((f) => (_folders[f.id] = []));

    if (sessions) {
      sessions.forEach((session, index) => {
        const _filterLowerCase = filterRef.current.toLowerCase();
        const _sessionTitle = session.title.toLowerCase();
        const _sessionFolderName = session.folder
          ? folders[session.folder].name.toLowerCase()
          : '';

        if (
          !_sessionTitle.includes(_filterLowerCase) &&
          !_sessionFolderName.includes(_filterLowerCase) &&
          index !== useStore.getState().currentSessionIndex
        )
          return;

        if (!session.folder) {
          _noFolders.push({ title: session.title, index: index, id: session.id });
        } else {
          if (!_folders[session.folder]) _folders[_sessionFolderName] = [];
          _folders[session.folder].push({
            title: session.title,
            index: index,
            id: session.id,
          });
        }
      });
    }

    setSessionFolders(_folders);
    setNoSessionFolders(_noFolders);
  }).current;

  useEffect(() => {
    updateFolders();

    useStore.subscribe((state) => {
      if (
        !state.generating &&
        state.sessions &&
        state.sessions !== sessionsRef.current
      ) {
        updateFolders();
        sessionsRef.current = state.sessions;
      } else if (state.folders !== foldersRef.current) {
        updateFolders();
        foldersRef.current = state.folders;
      }
    });
  }, []);

  useEffect(() => {
    if (
      sessionTitles &&
      currentSessionIndex >= 0 &&
      currentSessionIndex < sessionTitles.length
    ) {
      // set title
      document.title = sessionTitles[currentSessionIndex];

      // expand folder of current chat
      const sessions = useStore.getState().sessions;
      if (sessions) {
        const folderId = sessions[currentSessionIndex].folder;

        if (folderId) {
          const updatedFolders: FolderCollection = JSON.parse(
            JSON.stringify(useStore.getState().folders)
          );

          updatedFolders[folderId].expanded = true;
          setFolders(updatedFolders);
        }
      }
    }
  }, [currentSessionIndex, sessionTitles]);

  useEffect(() => {
    filterRef.current = filter;
    updateFolders();
  }, [filter]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer) {
      e.stopPropagation();
      setIsHover(false);

      const sessionIndex = Number(e.dataTransfer.getData('chatIndex'));
      const updatedSessions: SessionInterface[] = JSON.parse(
        JSON.stringify(useStore.getState().sessions)
      );
      delete updatedSessions[sessionIndex].folder;
      setSessions(updatedSessions);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHover(true);
  };

  const handleDragLeave = () => {
    setIsHover(false);
  };

  const handleDragEnd = () => {
    setIsHover(false);
  };

  return (
    <div
      className={`flex-col flex-1 overflow-y-auto hide-scroll-bar border-b border-white/20 ${isHover ? 'bg-gray-800/40' : ''
        }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnd={handleDragEnd}
    >
      <ChatSearch filter={filter} setFilter={setFilter} />
      <div className='flex flex-col gap-2 text-gray-100 text-sm'>
        {Object.keys(sessionFolders).map((folderId) => (
          <ChatFolder
            folderChats={sessionFolders[folderId]}
            folderId={folderId}
            key={folderId}
          />
        ))}
        {noSessionFolders.map(({ title, index, id }) => (
          <SessionHistory title={title} key={`${title}-${id}`} sessionIndex={index} />
        ))}
      </div>
      <div className='w-full h-10' />
    </div>
  );
};

const ShowMoreButton = () => {
  return (
    <button className='btn relative btn-dark btn-small m-auto mb-2'>
      <div className='flex items-center justify-center gap-2'>Show more</div>
    </button>
  );
};

export default SessionHistoryList;
