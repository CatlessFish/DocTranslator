import React, { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';

import useSubmit from '@hooks/useSubmit';

import { ChatInterface, MessageInterface, SessionInterface } from '@type/chat';

import PopupModal from '@components/PopupModal';
import TokenCount from '@components/TokenCount';
import CommandPrompt from '../CommandPrompt';
import { blankAssistentMessage } from '@constants/chat';
import { useConstructPrompt } from '@hooks/useConstructPrompt';
import DictionaryBar from '@components/DictionaryBar';
import { parsePatch } from 'diff';

const EditView = ({
  content,
}: {
    content: string;
  }) => {
  // CHAT2SESSION
  const setChats = useStore((state) => state.setChats);
  const currentChatIndex = useStore((state) => state.currentChatIndex);
  const setSessions = useStore((state) => state.setSessions);
  const currentSessionIndex = useStore((state) => state.currentSessionIndex);
  const { constructPrompt } = useConstructPrompt();

  const [_content, _setContent] = useState<string>(content);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [promptPreview, setPromptPreview] = useState<MessageInterface[]>([]);
  const textareaRef = React.createRef<HTMLTextAreaElement>();

  const { t } = useTranslation();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|playbook|silk/i.test(
        navigator.userAgent
      );

    if (e.key === 'Enter' && !isMobile && !e.nativeEvent.isComposing) {
      const enterToSubmit = useStore.getState().enterToSubmit;
      if (e.ctrlKey && e.shiftKey) {
        e.preventDefault();
      } else if (
        (enterToSubmit && !e.shiftKey) ||
        (!enterToSubmit && (e.ctrlKey || e.shiftKey))
      ) {
        e.preventDefault();
      }
    }
  };

  const handlePreview = () => {
    if (useStore.getState().generating) return;
    // CHAT2SESSION
    // const updatedChats: ChatInterface[] = JSON.parse(
    //   JSON.stringify(useStore.getState().chats)
    // );
    // const updatedTask = updatedChats[currentChatIndex].task;
    // updatedTask.user_text = _content;
    // setChats(updatedChats);
    const updatedSessions: SessionInterface[] = JSON.parse(JSON.stringify(useStore.getState().sessions));
    updatedSessions[currentSessionIndex].user_text = _content;
    setSessions(updatedSessions);

    const messageChunks = constructPrompt();
    // console.log('[handlePreview] Updated messages: ', updatedChats[currentChatIndex].messages);
    setPromptPreview(messageChunks.flat());
    setIsPreviewModalOpen(true);
  };

  const { handleSubmit } = useSubmit();
  const handleGenerate = () => {
    if (_content == '' || useStore.getState().generating) return;
    // CHAT2SESSION
    // const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(useStore.getState().chats));
    // const updatedTask = updatedChats[currentChatIndex].task;
    // updatedTask.user_text = _content;
    // setChats(updatedChats);
    const updatedSessions: SessionInterface[] = JSON.parse(JSON.stringify(useStore.getState().sessions));
    updatedSessions[currentSessionIndex].user_text = _content;
    setSessions(updatedSessions);
    handleSubmit();
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [_content]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    _setContent(content);
  }, [content]);

  return (
    <>
      <div
        // shadow-[-5px_0_10px_-3px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]
        className={`w-full h-[calc(100%-70px)] py-2 md:py-3 px-2 md:px-4 border-b border-l border-t\
            border-black/10 bg-white dark:border-gray-900/50 dark:text-white dark:bg-gray-700\
            
          `}
        style={{
          borderRightWidth: '0.5px',
          borderRadius: '0 0 0 0.375rem',
        }}
      >
        <textarea
          ref={textareaRef}
          className='m-0 resize-none rounded-lg bg-transparent overflow-y-scroll focus:ring-0 focus-visible:ring-0 leading-7 w-full placeholder:text-gray-500/40'
          onChange={(e) => {
            _setContent(e.target.value);
          }}
          style={{ maxHeight: `calc(100% - 40px)`, minHeight: `calc(100% - 40px)` }}
          value={_content}
          placeholder={t('submitPlaceholder') as string}
          onKeyDown={handleKeyDown}
          rows={1}
        ></textarea>
      </div>
      <EditViewButtons
        handleGenerate={handleGenerate}
        handlePreview={handlePreview}
        _setContent={_setContent}
      />
      {isPreviewModalOpen && (
        <PopupModal
          setIsModalOpen={setIsPreviewModalOpen}
          title={`预览提示词` as string}
          handleConfirm={() => setIsPreviewModalOpen(false)}
          cancelButton={false}
        >
          <div className='flex flex-col'>
            {/* <TokenCount /> */}
            {
              promptPreview.map((msg, idx) => (
                <div className='m-2 p-2' key={idx}>
                  <div>{(msg.role as string).toUpperCase()}</div>
                  <div>{msg.content as string}</div>
                </div>
              ))
            }
          </div>
        </PopupModal>
      )}
    </>
  );
};

const EditViewButtons = memo(
  ({
    handleGenerate,
    handlePreview,
    _setContent,
  }: {
    handleGenerate: () => void;
      handlePreview: () => void;
    _setContent: React.Dispatch<React.SetStateAction<string>>;
  }) => {
    const { t } = useTranslation();
    const generating = useStore.getState().generating;

    return (
      <div className='text-center mt-2 flex justify-end'>
        {/* <DictionaryBar /> */}

          <button
          className={`btn relative mr-2 btn-neutral ${generating ? 'cursor-not-allowed opacity-40' : ''
            }`}
            onClick={handlePreview}
            // aria-label={t('preview') as string}
          >
            <div className='flex items-center justify-center gap-2'>
              {/* {t('preview')} */}
              {`预览提示词`}
            </div>
          </button>

          <button
            className={`btn relative mr-2 btn-primary ${generating ? 'cursor-not-allowed opacity-40' : ''
              }`}
            onClick={handleGenerate}
          // aria-label={t('generate') as string}
          >
            <div className='flex items-center justify-center gap-2'>
              {/* {t('generate')} */}
              {`翻译`}
            </div>
        </button>
      </div>
    );
  }
);

export default EditView;
