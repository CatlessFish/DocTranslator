import React, {
  DetailedHTMLProps,
  FocusEventHandler,
  HTMLAttributes,
  ReactElement,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useStore from '@store/store';
import { ChatInterface, MessageInterface, TaskInterface, TextChunkInterface } from '@type/chat';
import PopupModal from '@components/PopupModal';
import { useTranslation } from 'react-i18next';
import CopyButton from './Button/CopyButton';
import * as Diff from 'diff';
import UserPromptBar from '@components/UserPromptBar';
import useExtractPreference from '@hooks/useExtractPreference';
import DictionaryConfig from '@components/DictionaryBar/DictionaryConfig';
import { UserDictEntryInterface, UserDictInterface } from '@type/userpref';
import SpinnerIcon from '@icon/SpinnerIcon';
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable';
import parse from 'html-react-parser';
import { renderToString } from 'react-dom/server';
import { isArray, isUndefined } from 'lodash';

const ResultView = () => {
  const chats = useStore((state) => state.chats);
  if (!chats) return <></>;
  const setChats = useStore((state) => state.setChats);
  const currentChatIndex = useStore((state) => state.currentChatIndex);
  const task = chats[currentChatIndex].task;

  const [chunks, setChunks] = useState(task.result_text_chunks || []);
  useEffect(() => { setChunks(task.result_text_chunks || []) }, [task]);

  const innerContentHtml = renderToString(<>{
    chunks.map((chunk, idx) => {
      return <p key={idx} id={`${idx}`} style={{ whiteSpace: 'pre-wrap' }}>
        {chunk.text}
      </p>
    })
  }</>);
  const editorContent = useRef(innerContentHtml);
  useEffect(() => { editorContent.current = innerContentHtml }, [innerContentHtml]);
  // console.log('refreshed')

  const { extractPreference } = useExtractPreference();
  const [isShowDiffModalOpen, setIsShowDiffModalOpen] = useState<boolean>(false);
  const [isDictModalOpen, setIsDictModalOpen] = useState<boolean>(false);
  const [diffPreview, setDiffPreview] = useState<Diff.Change[]>([]);

  const assembleChunks = (chunks: TextChunkInterface[]): string => {
    let cont: string = '';
    cont = chunks.map((chunk) => chunk.text)
      .reduce((prev, curr) => {
        return prev + curr;
      }, '');
    return cont;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(assembleChunks(chunks));
  };

  const handleShowDiff = () => {
    if (!chats || !chats[currentChatIndex]) return;
    const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));
    setDiffPreview(Diff.diffChars(updatedChats[currentChatIndex].task.original_result_text, assembleChunks(chunks)));
    setIsShowDiffModalOpen(true);
  };

  const handleSaveModifiedResult = async () => {
    if (!chats || !chats[currentChatIndex]) return;
    const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));
    const currentTask: TaskInterface = updatedChats[currentChatIndex].task;
    currentTask.result_text = assembleChunks(chunks);
    setDiffPreview(Diff.diffChars(currentTask.original_result_text, assembleChunks(chunks)));
    // console.log(diffPreview);
    setChats(updatedChats);

    // Update user dictionary

    // const modified = diffPreview.some((part) => part.added || part.removed)
    // const _newDictEntries: UserDictEntryInterface[] = modified ?
    //   await extractPreference(currentTask.user_text, currentTask.original_result_text, assembleChunks(chunks)) : [];

    const prefQueries = currentTask.original_result_text_chunks.map((orig_chunk) => {
      const en_chunk = currentTask.user_text_chunks.find((en_chunk) => {
        return en_chunk.chunk_num == orig_chunk.chunk_num
      });
      const mod_chunk = currentTask.result_text_chunks.find((res_chunk) => {
        return res_chunk.chunk_num == orig_chunk.chunk_num
      });
      if (isUndefined(mod_chunk) || isUndefined(en_chunk)) return;
      if (orig_chunk.text == mod_chunk.text) return;
      console.debug('Diff:', en_chunk.text, orig_chunk.text, mod_chunk.text);
      return extractPreference(en_chunk.text, orig_chunk.text, mod_chunk.text);
    });

    let newDictEntries: UserDictEntryInterface[] = [];
    const val = await Promise.all(prefQueries);
    val.forEach((item) => {
      if (!isUndefined(item)) newDictEntries.push(...item);
    });
    console.debug('NewDict from Diff:', newDictEntries);

    const userDicts = useStore.getState().userDicts;
    const setUserDicts = useStore.getState().setUserDicts;
    const updatedTask: TaskInterface = updatedChats[currentChatIndex].task;
    // console.log(userDicts, updatedTask);

    if (newDictEntries.length > 0) {
      const updatedDicts: UserDictInterface[] = JSON.parse(JSON.stringify(userDicts));
      newDictEntries.forEach((newEntry) => {
        if (!updatedDicts[updatedTask.user_dict_index].entries.find((oldEntry) => {
          return (oldEntry.source == newEntry.source && oldEntry.target == newEntry.target)
        })) {
        // if not found
          updatedDicts[updatedTask.user_dict_index].entries.push(newEntry);
        }
      });
      setUserDicts(updatedDicts);

      // Popup UserDict config panel
      setIsDictModalOpen(true);
    };
  };

  const handleContentChange = (e: ContentEditableEvent) => {
    // Do not re-render when content change
    // console.log(editorContent.current == e.target.value);
    // editorContent.current = JSON.parse(JSON.stringify(e.target.value));
    editorContent.current = e.target.value;
    // console.log('change:', editorContent.current);
  };

  // ******This code looks shit... Hopes it work properly... ******
  const handleBlur = () => {
    // Save content modifications when blur
    // console.log('blur:', editorContent.current);
    let children: ReactElement[] = parse(editorContent.current);
    if (!isArray(children)) children = [children];
    // console.log('children', children)
    const newChunks: TextChunkInterface[] = chunks.map((c) => {
      return { chunk_num: c.chunk_num, text: '' };
    });
    // console.groupCollapsed('chunks');
    children.forEach((child) => {
      // console.log(child);
      const chunk_id = child.props.id ? child.props.id as number : -1;
      const text = child.props.children[0] ?
        isArray(child.props.children) ? child.props.children[0] : child.props.children
        : '\n';
      // console.log(chunk_id, text);
      if (chunk_id >= 0) newChunks[chunk_id].text += text;
    });
    // console.groupEnd();
    // console.debug('newchunks', newChunks);

    const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));
    updatedChats[currentChatIndex].task.result_text_chunks = newChunks;
    setChunks(newChunks);
    setChats(updatedChats);
  }

  // CSS Animation for the spinner
  const blinkAnimation = `
    @keyframes blink {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `;
  const styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.appendChild(document.createTextNode(blinkAnimation));
  document.head.appendChild(styleElement);

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
          <div className={`w-full flex-col overflow-y-scroll
              m-0 resize-none rounded-lg bg-transparent overflow-y-scroll
              focus:ring-0 focus-visible:ring-0 leading-7 placeholder:text-gray-500/40
            `}
            style={{
              maxHeight: 'calc(100% - 30px)',
              minHeight: 'calc(100% - 30px)',
            }}>
            <ContentEditable
              html={innerContentHtml}
              onChange={handleContentChange}
              onBlur={handleBlur}
              style={{outline: 'none'}}
            />
          </div>
          <div className='flex justify-end gap-2 w-full mt-2'>
            {(
              <>
                {useStore.getState().generating && <SpinnerIcon
                  style={{
                    height: '24px',
                    width: '24px',
                    animation: 'blink 1s infinite alternate',
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
