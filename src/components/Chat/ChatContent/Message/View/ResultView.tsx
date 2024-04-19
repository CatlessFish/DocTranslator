import React, {
  DetailedHTMLProps,
  HTMLAttributes,
  memo,
  useEffect,
  useState,
} from 'react';
import useStore from '@store/store';
import { ChatInterface, MessageInterface, TaskInterface } from '@type/chat';
import PopupModal from '@components/PopupModal';
import { useTranslation } from 'react-i18next';
import CopyButton from './Button/CopyButton';
import * as Diff from 'diff';

const ResultView = memo(
  ({
    content,
    setIsEdit,
    messageIndex,
  }: {
    content: string;
    setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
    messageIndex: number;
  }) => {

    const handleCopy = () => {
      navigator.clipboard.writeText(content);
    };
    const [_content, _setContent] = useState<string>(content);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [diffPreview, setDiffPreview] = useState<Diff.Change[]>([]);
    const textareaRef = React.createRef<HTMLTextAreaElement>();
    const resetTextAreaHeight = () => {
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const setChats = useStore((state) => state.setChats);
    const currentChatIndex = useStore((state) => state.currentChatIndex);
    const chats = useStore.getState().chats;

    const handleShowDiff = () => {
      if (!chats || !chats[currentChatIndex]) return;
      const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));
      setDiffPreview(Diff.diffChars(updatedChats[currentChatIndex].task.original_result_text, _content));
      setIsModalOpen(true);
    }

    const handleSaveModifiedResult = () => {
      if (!chats || !chats[currentChatIndex]) return;
      const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));
      updatedChats[currentChatIndex].task.result_text = _content;
      setChats(updatedChats);
      const diff = Diff.diffChars(updatedChats[currentChatIndex].task.original_result_text, updatedChats[currentChatIndex].task.result_text);
      diff.forEach((part) => {
        const op = part.added ? 'Added: ' :
          part.removed ? 'Removed: ' : 'Remained: ';
        console.info(op, part.value);
      });
      // console.info('[saveModifiedResult] Original: ', updatedChats[currentChatIndex].task.original_result_text);
      // console.info('[saveModifiedResult] Modified: ', updatedChats[currentChatIndex].task.result_text);
    }

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
          className={`w-full h-[calc(100%-70px)] flex flex-col
            py-2 md:py-3 px-2 md:px-4 border border-black/10 bg-white 
            dark:border-gray-900/50 dark:text-white dark:bg-gray-700 
            rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]
        `}
        >
          <textarea
            ref={textareaRef}
            className={`w-full
              m-0 resize-none rounded-lg bg-transparent overflow-y-scroll 
              focus:ring-0 focus-visible:ring-0 leading-7 placeholder:text-gray-500/40
            `}
            onChange={(e) => {
              _setContent(e.target.value);
            }}
            style={{ maxHeight: `calc(100% - 40px)`, minHeight: `calc(100% - 40px)` }}
            value={_content}
          // placeholder={t('submitPlaceholder') as string}
          // onKeyDown={handleKeyDown}
          ></textarea>
          <div className='flex justify-end gap-2 w-full mt-2'>
            {(
              <>
                <CopyButton onClick={handleCopy} />
              </>
            )}
          </div>
        </div>
        <ResultViewButtons
          handleSave={handleSaveModifiedResult}
          handlePreview={handleShowDiff}
        />
        {isModalOpen && (
          <PopupModal
            setIsModalOpen={setIsModalOpen}
            title={`预览修改` as string}
            handleConfirm={() => setIsModalOpen(false)}
            cancelButton={false}
          >
            <div className='m-2 p-2'>
              {
                diffPreview.map((part, idx) => (
                  <span className={''} key={idx} style={
                    part.added ? { color: 'green', textDecoration: 'underline' } :
                      part.removed ? { color: 'red', textDecoration: 'line-through' } : {}
                  }>
                    {part.value}
                  </span>
                ))
              }
            </div>
          </PopupModal>
        )}
      </>
    );
  }
);

const ResultViewButtons = memo(
  ({
    handleSave,
    handlePreview,
  }: {
      handleSave: () => void;
      handlePreview: () => void;
  }) => {
    const { t } = useTranslation();
    // const generating = useStore.getState().generating;
    // const advancedMode = useStore((state) => state.advancedMode);

    return (
      <div className='flex'>
        <div className='flex-1 text-center mt-2 flex justify-end'>
          <button
            className={`btn relative mr-2 btn-neutral`}
            onClick={handlePreview}
          >
            <div className='flex items-center justify-center gap-2'>
              {`预览修改` as string}
            </div>
          </button>
          <button
            className={`btn relative mr-2 btn-primary`}
            onClick={handleSave}
          // aria-label={t('save') as string}
          >
            <div className='flex items-center justify-center gap-2'>
              {`保存修改` as string}
            </div>
          </button>
        </div>
      </div>
    );
  }
);

export default ResultView;
