import React, { useEffect, useRef, useState } from 'react';

import useInitialiseNewChat from '@hooks/useInitialiseNewChat';
import useInitialiseNewSession from '@hooks/useInitialiseNewChat';

import ChatIcon from '@icon/ChatIcon';
import CrossIcon from '@icon/CrossIcon';
import DeleteIcon from '@icon/DeleteIcon';
import EditIcon from '@icon/EditIcon';
import TickIcon from '@icon/TickIcon';
import useStore from '@store/store';

const SessionHistoryClass = {
  normal:
    'flex py-2 px-2 items-center gap-3 relative rounded-md bg-gray-900 hover:bg-gray-850 break-all hover:pr-4 group transition-opacity',
  active:
    'flex py-2 px-2 items-center gap-3 relative rounded-md break-all pr-14 bg-gray-800 hover:bg-gray-800 group transition-opacity',
  normalGradient:
    'absolute inset-y-0 right-0 w-8 z-10 bg-gradient-to-l from-gray-900 group-hover:from-gray-850',
  activeGradient:
    'absolute inset-y-0 right-0 w-8 z-10 bg-gradient-to-l from-gray-800',
};

const SessionHistory = React.memo(
  ({ title, sessionIndex }: { title: string; sessionIndex: number }) => {
    // const initialiseNewChat = useInitialiseNewChat();
    // const setCurrentChatIndex = useStore((state) => state.setCurrentChatIndex);
    // const setChats = useStore((state) => state.setChats);

    const initialiseNewSession = useInitialiseNewSession();
    const setCurrentSessionIndex = useStore((state) => state.setCurrentSessionIndex);
    const setSessions = useStore((state) => state.setSessions);

    const active = useStore((state) => state.currentSessionIndex === sessionIndex);
    const generating = useStore((state) => state.generating);

    const [isDelete, setIsDelete] = useState<boolean>(false);
    const [isEdit, setIsEdit] = useState<boolean>(false);
    const [_title, _setTitle] = useState<string>(title);
    const inputRef = useRef<HTMLInputElement>(null);

    const editTitle = () => {
      const updatedSessions = JSON.parse(
        JSON.stringify(useStore.getState().sessions)
      );
      updatedSessions[sessionIndex].title = _title;
      setSessions(updatedSessions);
      setIsEdit(false);
    };

    const deleteSession = () => {
      const updatedSessions = JSON.parse(
        JSON.stringify(useStore.getState().sessions)
      );
      updatedSessions.splice(sessionIndex, 1);
      if (updatedSessions.length > 0) {
        setCurrentSessionIndex(0);
        setSessions(updatedSessions);
      } else {
        initialiseNewSession();
      }
      setIsDelete(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        editTitle();
      }
    };

    const handleTick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      if (isEdit) editTitle();
      else if (isDelete) deleteSession();
    };

    const handleCross = () => {
      setIsDelete(false);
      setIsEdit(false);
    };

    const handleDragStart = (e: React.DragEvent<HTMLAnchorElement>) => {
      if (e.dataTransfer) {
        e.dataTransfer.setData('sessionIndex', String(sessionIndex));
      }
    };

    useEffect(() => {
      if (inputRef && inputRef.current) inputRef.current.focus();
    }, [isEdit]);

    return (
      <a
        className={`${
          active ? SessionHistoryClass.active : SessionHistoryClass.normal
        } ${
          generating
            ? 'cursor-not-allowed opacity-40'
            : 'cursor-pointer opacity-100'
        }`}
        onClick={() => {
          if (!generating) setCurrentSessionIndex(sessionIndex);
        }}
        draggable
        onDragStart={handleDragStart}
      >
        <ChatIcon />
        <div className='flex-1 text-ellipsis max-h-5 overflow-hidden break-all relative' title={title}>
          {isEdit ? (
            <input
              type='text'
              className='focus:outline-blue-600 text-sm border-none bg-transparent p-0 m-0 w-full'
              value={_title}
              onChange={(e) => {
                _setTitle(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              ref={inputRef}
            />
          ) : (
            _title
          )}

          {isEdit || (
            <div
              className={
                active
                  ? SessionHistoryClass.activeGradient
                  : SessionHistoryClass.normalGradient
              }
            />
          )}
        </div>
        {active && (
          <div className='absolute flex right-1 z-10 text-gray-300 visible'>
            {isDelete || isEdit ? (
              <>
                <button
                  className='p-1 hover:text-white'
                  onClick={handleTick}
                  aria-label='confirm'
                >
                  <TickIcon />
                </button>
                <button
                  className='p-1 hover:text-white'
                  onClick={handleCross}
                  aria-label='cancel'
                >
                  <CrossIcon />
                </button>
              </>
            ) : (
              <>
                <button
                  className='p-1 hover:text-white'
                  onClick={() => setIsEdit(true)}
                  aria-label='edit chat title'
                >
                  <EditIcon />
                </button>
                <button
                  className='p-1 hover:text-white'
                  onClick={() => setIsDelete(true)}
                  aria-label='delete chat'
                >
                  <DeleteIcon />
                </button>
              </>
            )}
          </div>
        )}
      </a>
    );
  }
);

export default SessionHistory;
