import SettingIcon from "@icon/SettingIcon";
import ArrowBottom from "@icon/ArrowBottom";
import React, { ChangeEvent, useState } from 'react';
import PopupModal from "@components/PopupModal";

const DictionaryBar = () => {
    const [inputValue, setInputValue] = useState<string>('');
    const [showDictDropup, setShowDictDropup] = useState<boolean>(false);

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
                setInputValue('');
                // Add to dict
            }
        }
    }

    return (
        <>
            <div
                className={'flex'}
                style={{
                    'borderWidth': '1px',
                    'borderColor': 'rgba(0,0,0,0.1)',
                    'borderRadius': '0.25rem',
                    'marginRight': '0.5rem',
                    'flex': '1',
                }}>
                <div className='flex w-[calc(100%-36px)]'>
                    {/* Dictionary Input */}
                    <DictInputBar
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
                    onClick={() => setShowDictDropup(!showDictDropup)}
                >
                    {/* Dropup Toggle for Dictionary Menu */}
                    <ArrowBottom className={`transition-all duration-100 ${showDictDropup ? '' : 'rotate-180'}`} />
                    {/* <SettingIcon /> */}
                </button>
            </div>
            {showDictDropup && <PopupModal
                title='自定义字典'
                message={''}
                setIsModalOpen={setShowDictDropup}
                handleConfirm={() => { setShowDictDropup(false) }}
                handleClose={() => { }}
                cancelButton={false}
            />}
        </>
    );
};

const DictInputBar = ({
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
                placeholder={'输入自定义偏好，以冒号分隔，例如"apple:苹果"'}
                value={value}
                onChange={(e) => { handleChange(e) }}
                onKeyDown={(e) => { handleKeyDown(e) }}
            />
        </div>
    );
};

export default DictionaryBar;