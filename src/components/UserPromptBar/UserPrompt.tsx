import ArrowBottom from "@icon/ArrowBottom";
import React, { ChangeEvent, useState } from 'react';
import PopupModal from "@components/PopupModal";
import useStore from "@store/store";
import { v4 as uuidv4, v4 } from 'uuid';
import { UserPromptInterface } from "@type/userpref";
import UserPromptConfig from "./UserPromptConfig";
import useBackup from "@hooks/useBackup";

const UserPromptBar = () => {
    const [inputValue, setInputValue] = useState<string>('');
    const [showPromptPopup, setShowPromptPopup] = useState<boolean>(false);

    const currentChatIndex = useStore((state) => state.currentChatIndex);
    const chats = useStore((state) => state.chats);
    if (!chats || currentChatIndex < 0 || currentChatIndex >= chats.length) return <></>;

    const userPrompts = useStore((state) => state.userPrompts);
    const setUserPrompts = useStore((state) => state.setUserPrompts);

    const { syncToServer, syncFromServer } = useBackup();

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
    }

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const isMobile =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|playbook|silk/i.test(
                navigator.userAgent
            );

        if (e.key === 'Enter' && !isMobile && !e.nativeEvent.isComposing) {
            if (e.ctrlKey && e.shiftKey) {
                e.preventDefault();
            } else {
                // Add to userPrompt
                const updatedUserPrompts: UserPromptInterface[] = JSON.parse(JSON.stringify(userPrompts));
                // updatedUserPrompts = []; // clear all prompts, for debug
                updatedUserPrompts.push({
                    id: uuidv4(),
                    content: inputValue,
                });
                setUserPrompts(updatedUserPrompts);
                setInputValue('');
            }
        }
    }

    const validateUserPrompt = () => {
        // Remove Empty Entries
        // const updatedUserPrompts: UserPromptInterface[] = JSON.parse(JSON.stringify(userDicts));
        const updatedUserPrompts = userPrompts.filter((prompt) => prompt.content);
        setUserPrompts(updatedUserPrompts);
    };

    const syncUpPrompts = async () => {
        await syncToServer('userprompt', { prompts: useStore.getState().userPrompts });
    }

    const syncDownPrompts = async () => {
        await syncFromServer('userprompt');
        setShowPromptPopup(false);
    }

    return (
        <>
            <div
                className={'flex rounded-tr-md border-black/10'}
                style={{
                    'borderWidth': '0.5px',
                    'borderColor': 'rgba(0,0,0,0.1)',
                    'flex': '1',
                }}>
                <div className='flex w-[calc(100%-36px)]'>
                    <UserPromptInputBar
                        value={inputValue}
                        handleChange={handleInputChange}
                        handleKeyDown={handleInputKeyDown}
                        className={"w-full"}
                        disabled={false}
                    />
                </div>
                <button className="btn btn-neutral w-[calc(36px)]"
                    style={{
                        'justifyContent': 'center',
                        'margin': '0',
                        'border': 'none',
                    }}
                    onClick={() => setShowPromptPopup(!showPromptPopup)}
                >
                    {/* Dropup Toggle for Dictionary Menu */}
                    <ArrowBottom className={`transition-all duration-100 ${showPromptPopup ? '' : 'rotate-180'}`} />
                    {/* <SettingIcon /> */}
                </button>
            </div>
            {showPromptPopup && <PopupModal
                title='自定义Prompt'
                message={''}
                setIsModalOpen={setShowPromptPopup}
                handleConfirm={() => { validateUserPrompt(); setShowPromptPopup(false); }}
                handleClose={validateUserPrompt}
                cancelButton={false}
                options={[{ title: 'SyncUp', callBack: syncUpPrompts }, { title: 'SyncDown', callBack: syncDownPrompts }]}
            >
                <UserPromptConfig />
            </PopupModal>}
        </>
    );
};

const UserPromptInputBar = ({
    value,
    handleChange,
    handleKeyDown,
    className,
    disabled,
}: {
    value: string;
    handleChange: React.ChangeEventHandler<HTMLInputElement>;
    handleKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
    className?: React.HTMLAttributes<HTMLDivElement>['className'];
    disabled?: boolean;
}) => {
    return (
        <div className={className}>
            <input
                disabled={disabled}
                type='text'
                className='text-gray-800 dark:text-white p-3 text-sm bg-transparent disabled:opacity-40  disabled:cursor-not-allowed transition-opacity m-0 w-full h-full focus:outline-none rounded border border-white/20'
                placeholder={'输入自定义Prompt'}
                value={value}
                onChange={(e) => { handleChange(e) }}
                onKeyDown={(e) => { handleKeyDown(e) }}
            />
        </div>
    );
};

export default UserPromptBar;