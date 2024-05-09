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
import UserPromptBar from '@components/UserPromptBar';
import useExtractPreference from '@hooks/useExtractPreference';
import DictionaryConfig from '@components/DictionaryBar/DictionaryConfig';
import { UserDictEntryInterface, UserDictInterface } from '@type/userpref';
import SpinnerIcon from '@icon/SpinnerIcon';

const ResultView = () => {
  const chats = useStore((state) => state.chats);
  if (!chats) return <></>;
  const setChats = useStore((state) => state.setChats);
  const currentChatIndex = useStore((state) => state.currentChatIndex);
  const task = chats[currentChatIndex].task;
  let content: string = '';
  if (task.result_text_chunks) {
    content = task.result_text_chunks.map((chunk) => chunk.text)
      .reduce((prev, curr) => {
        return prev + curr;
      }, '');
    // console.log(my_content);
  }
  const { extractPreference } = useExtractPreference();

    const [_content, _setContent] = useState<string>(content);
    const [isShowDiffModalOpen, setIsShowDiffModalOpen] = useState<boolean>(false);
    const [isDictModalOpen, setIsDictModalOpen] = useState<boolean>(false);
    const [diffPreview, setDiffPreview] = useState<Diff.Change[]>([]);
    const textareaRef = React.createRef<HTMLTextAreaElement>();
    const resetTextAreaHeight = () => {
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

    const handleShowDiff = () => {
      if (!chats || !chats[currentChatIndex]) return;
      const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));
      setDiffPreview(Diff.diffChars(updatedChats[currentChatIndex].task.original_result_text, _content));
      setIsShowDiffModalOpen(true);
    }

    const handleSaveModifiedResult = async () => {
      if (!chats || !chats[currentChatIndex]) return;
      const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));
      const currentTask: TaskInterface = updatedChats[currentChatIndex].task;
      currentTask.result_text = _content;
      setDiffPreview(Diff.diffChars(currentTask.original_result_text, _content));
      // console.log(diffPreview);
      const modified = diffPreview.some((part) => part.added || part.removed)
      setChats(updatedChats);

      // Update user dictionary
      const newDictEntries: UserDictEntryInterface[] = modified ?
        await extractPreference(currentTask.user_text, currentTask.original_result_text, _content) : [];
      // console.log(newDictEntries);
      const userDicts = useStore.getState().userDicts;
      const setUserDicts = useStore.getState().setUserDicts;

      if (newDictEntries.length > 0) {
        const updatedDicts: UserDictInterface[] = JSON.parse(JSON.stringify(userDicts));
        newDictEntries.forEach((newEntry) => {
          if (!updatedDicts[currentTask.user_dict_index].entries.find((oldEntry) => {
            return ((oldEntry as any).source == (newEntry as any).source
              && (oldEntry as any).target == (newEntry as any).target)
          })) {
            // if not found
            updatedDicts[currentTask.user_dict_index].entries.push(newEntry);
          }
        });
        updatedDicts[currentTask.user_dict_index].entries;
        setUserDicts(updatedDicts);

        // Popup UserDict config panel
        setIsDictModalOpen(true);
      };
    }

    const handleExtractPreference = () => {
      const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));
      const currentTask: TaskInterface = updatedChats[currentChatIndex].task;
      extractPreference(currentTask.user_text, currentTask.original_result_text, _content);
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
          className={`w-full h-[calc(100%-70px)] py-2 md:py-3 px-2 md:px-4 border-b border-r border-t\
            border-black/10 bg-white dark:border-gray-900/50 dark:text-white dark:bg-gray-700\
            
          `}
          style={{
            borderLeftWidth: '0.5px',
            borderRadius: '0 0 0.375rem 0',
          }}
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
                {useStore.getState().generating && <SpinnerIcon
                  style={{
                    height: '24px',
                    width: '24px',
                  }}
                />}
                <CopyButton onClick={handleCopy} />
              </>
            )}
          </div>
        </div>
        <ResultViewButtons
          handleSave={handleSaveModifiedResult}
          handlePreview={handleShowDiff}
        />
        {isShowDiffModalOpen && (
          <PopupModal
            setIsModalOpen={setIsShowDiffModalOpen}
            title={`预览修改` as string}
            handleConfirm={() => setIsShowDiffModalOpen(false)}
            cancelButton={false}
          >
            <>
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
                {/* <button onClick={handleExtractPreference}>here</button> */}
              </div>
            </>
          </PopupModal>
        )}
        {isDictModalOpen && (
          <PopupModal
            setIsModalOpen={setIsDictModalOpen}
            title={`更新词库` as string}
            handleConfirm={() => setIsDictModalOpen(false)}
            cancelButton={false}
          >
            <DictionaryConfig />
          </PopupModal>
        )}
      </>
    );
};

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
          {/* <UserPromptBar /> */}
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
