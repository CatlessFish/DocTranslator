import React, {
  DetailedHTMLProps,
  HTMLAttributes,
  memo,
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import CopyButton from './Button/CopyButton';

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
    const textareaRef = React.createRef<HTMLTextAreaElement>();
    const resetTextAreaHeight = () => {
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
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
          handleSave={() => { alert('保存修改') }}
          _setContent={_setContent}
        />
      </>
    );
  }
);

const ResultViewButtons = memo(
  ({
    handleSave,
    _setContent,
  }: {
    handleSave: () => void;
    _setContent: React.Dispatch<React.SetStateAction<string>>;
  }) => {
    const { t } = useTranslation();
    // const generating = useStore.getState().generating;
    // const advancedMode = useStore((state) => state.advancedMode);

    return (
      <div className='flex'>
        <div className='flex-1 text-center mt-2 flex justify-end'>
          <button
            className={`btn relative mr-2 btn-primary`}
            onClick={handleSave}
          // aria-label={t('save') as string}
          >
            <div className='flex items-center justify-center gap-2'>
              {`保存修改`}
              {/* {t('save')} */}
            </div>
          </button>
        </div>
      </div>
    );
  }
);

export default ResultView;
