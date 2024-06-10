import useStore from "@store/store";
import { v4 as uuidv4, v4 } from 'uuid';
import { ChangeEvent, useEffect, useState } from "react";
import { ChatInterface } from "@type/chat";
import { UserDictEntryInterface, UserDictInterface, UserPromptInterface } from "@type/userpref";
import EditIcon from "@icon/EditIcon";
import TickIcon from "@icon/TickIcon";
import DeleteIcon from "@icon/DeleteIcon";
import PlusIcon from "@icon/PlusIcon";
import useBackup from "@hooks/useBackup";

const UserPromptConfig = () => {
    // from global storage
    const userDicts = useStore((state) => state.userDicts);
    const setUserDicts = useStore((state) => state.setUserDicts);
    const userPrompts = useStore((state) => state.userPrompts);
    const setUserPrompts = useStore((state) => state.setUserPrompts);

    // component state
    const [currPrompts, _setCurrPrompts] = useState<UserPromptInterface[]>(userPrompts);

    // a wrapper to update both local state and global storage
    const setCurrPrompts = (prompts: UserPromptInterface[]) => {
        _setCurrPrompts(prompts);
        setUserPrompts(prompts);
    };

    const { syncToServer } = useBackup();

    const promptEntryUpdator = (entryIndex: number) => (
        (newEntry: UserPromptInterface) => {
            const updatedPrompts: UserPromptInterface[] = JSON.parse(JSON.stringify(currPrompts));
            if (entryIndex < updatedPrompts.length)
                updatedPrompts[entryIndex] = newEntry;
            else
                updatedPrompts.push(newEntry);
            setCurrPrompts(updatedPrompts);
        }
    );
    const promptEntryRemover = (entryIndex: number) => (
        () => {
            const updatedPrompts: UserPromptInterface[] = currPrompts.filter(
                (v, i) => i !== entryIndex
            );
            setCurrPrompts(updatedPrompts);
        }
    );
    const handleAddNewEntry = () => {
        const updatedPrompts: UserPromptInterface[] = JSON.parse(JSON.stringify(currPrompts));
        updatedPrompts.push({
            id: uuidv4(),
            content: '',
        });
        setCurrPrompts(updatedPrompts);
    };

    // console.log('Entries: ', userDicts[_currDictIndex].entries);

    return (
        <>
            <div className="flex flex-col" style={{
                minHeight: '300px',
                minWidth: '500px',
            }}>
                {currPrompts.map((entry, idx) => {
                    // console.log(entry, idx);
                    return <UserPromptEntryView
                        key={idx}
                        content={(entry as any).content || ''}
                        handleUpdate={promptEntryUpdator(idx)}
                        handleRemove={promptEntryRemover(idx)}
                    />
                })}
                <button onClick={handleAddNewEntry} style={{
                    padding: '0.5rem 0.5rem',
                    display: 'flex',
                    justifyContent: 'center',
                    backgroundColor: 'lightgrey',
                    color: 'white',
                }}>
                    <PlusIcon />
                </button>
            </div>
            {/* TODO: edit dictionary */}
            {/* TODO: choose between dictionaries */}
        </>
    )
};

const UserPromptEntryView = ({
    content,
    handleUpdate,
    handleRemove,
    ...props
}: {
    content: string,
    handleUpdate: (newEntry: UserPromptInterface) => void,
    handleRemove: () => void,
}) => {
    const [inputValue, setInputValue] = useState<string>(content);
    useEffect(() => {
        setInputValue(content);
    }, [content]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.blur();
            handleEditButtonClick();
        }
    };

    const [isNotEditable, setIsNotEditable] = useState<boolean>(true);
    const handleEditButtonClick = () => {
        if (!isNotEditable)
            handleUpdate({ id: uuidv4(), content: inputValue });
        setIsNotEditable(!isNotEditable);
    };
    const handleRemoveButtonClick = () => {
        handleRemove();
        setIsNotEditable(true);
    };

    return (
        <div className="w-full flex">
            <input
                disabled={isNotEditable}
                type='text'
                className='text-gray-800 dark:text-white p-3 text-sm bg-transparent disabled:opacity-40 disabled:cursor-not-allowed transition-opacity m-0 w-full h-full focus:outline-none rounded border border-white/20'
                placeholder={'Prompt'}
                value={inputValue}
                onChange={(e) => { handleInputChange(e) }}
                onKeyDown={(e) => { handleKeyDown(e) }}
            />
            {
                !isNotEditable && <button className={'m-2'} onClick={handleRemoveButtonClick}>
                    <DeleteIcon />
                </button>
            }
            <button className={'m-2'} onClick={handleEditButtonClick}>
                {
                    isNotEditable ? <EditIcon /> : <TickIcon />
                }
            </button>
        </div>
    )
};

export default UserPromptConfig;