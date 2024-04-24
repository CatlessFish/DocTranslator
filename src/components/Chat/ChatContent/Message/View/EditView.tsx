import React, { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';

import useSubmit from '@hooks/useSubmit';

import { ChatInterface, MessageInterface } from '@type/chat';

import PopupModal from '@components/PopupModal';
import TokenCount from '@components/TokenCount';
import CommandPrompt from '../CommandPrompt';
import { blankAssistentMessage } from '@constants/chat';
import { useConstructPrompt } from '@hooks/useConstructPrompt';
import DictionaryBar from '@components/DictionaryBar';
import { parsePatch } from 'diff';

const EditView = ({
  content,
  setIsEdit,
  messageIndex,
  sticky,
}: {
  content: string;
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
  messageIndex: number;
  sticky?: boolean;
}) => {
  const inputRole = useStore((state) => state.inputRole);
  const setChats = useStore((state) => state.setChats);
  const currentChatIndex = useStore((state) => state.currentChatIndex);
  const { constructPrompt } = useConstructPrompt();

  const [_content, _setContent] = useState<string>(content);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [promptPreview, setPromptPreview] = useState<MessageInterface[]>([]);
  const textareaRef = React.createRef<HTMLTextAreaElement>();

  const { t } = useTranslation();

  const resetTextAreaHeight = () => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|playbook|silk/i.test(
        navigator.userAgent
      );

    if (e.key === 'Enter' && !isMobile && !e.nativeEvent.isComposing) {
      const enterToSubmit = useStore.getState().enterToSubmit;

      if (e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        handleGenerate();
        resetTextAreaHeight();
      } else if (
        (enterToSubmit && !e.shiftKey) ||
        (!enterToSubmit && (e.ctrlKey || e.shiftKey))
      ) {
        if (sticky) {
          e.preventDefault();
          handleGenerate();
          resetTextAreaHeight();
        } else {
          handlePreview();
        }
      }
    }
  };

  const handlePreview = () => {
    if (sticky && (useStore.getState().generating)) return;
    const updatedChats: ChatInterface[] = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );
    const updatedTask = updatedChats[currentChatIndex].task;
    updatedTask.user_text = _content;
    setChats(updatedChats);
    const messageChunks = constructPrompt();
    // console.log('[handlePreview] Updated messages: ', updatedChats[currentChatIndex].messages);
    setPromptPreview(messageChunks.flat());
    setIsPreviewModalOpen(true);
  };

  const { handleSubmit } = useSubmit();
  const handleGenerate = () => {
    if (useStore.getState().generating) return;
    const updatedChats: ChatInterface[] = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );
    const updatedTask = updatedChats[currentChatIndex].task;
    if (sticky && inputRole == 'user' && _content !== '') {
      updatedTask.user_text = _content;
    }
    setChats(updatedChats);
    if (_content !== '') {
      handleSubmit();
    }
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
        className={`w-full h-[calc(100%-70px)] ${
          sticky
            ? 'py-2 md:py-3 px-2 md:px-4 border border-black/10 bg-white dark:border-gray-900/50 dark:text-white dark:bg-gray-700 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]'
            : ''
        }`}
      >
        <textarea
          ref={textareaRef}
          className='m-0 resize-none rounded-lg bg-transparent overflow-y-scroll focus:ring-0 focus-visible:ring-0 leading-7 w-full placeholder:text-gray-500/40'
          onChange={(e) => {
            _setContent(e.target.value);
          }}
          style={{ maxHeight: '100%', minHeight: '100%' }}
          value={_content}
          placeholder={t('submitPlaceholder') as string}
          onKeyDown={handleKeyDown}
          rows={1}
        ></textarea>
      </div>
      <EditViewButtons
        sticky={sticky}
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
    sticky = false,
    handleGenerate,
    handlePreview,
  }: {
    sticky?: boolean;
    handleGenerate: () => void;
      handlePreview: () => void;
    _setContent: React.Dispatch<React.SetStateAction<string>>;
  }) => {
    const { t } = useTranslation();
    const generating = useStore.getState().generating;

    return (
      <div className='flex'>
        <div className='flex-1 text-center mt-2 flex justify-end'>
          <DictionaryBar />

          <button
            className={`btn relative mr-2 ${
              sticky
                ? `btn-neutral ${
                    generating ? 'cursor-not-allowed opacity-40' : ''
                  }`
                : 'btn-neutral'
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
      </div>
    );
  }
);

export default EditView;
