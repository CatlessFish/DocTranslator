import useStore from "@store/store";
import { ChangeEvent, useEffect, useState } from "react";
import { ChatInterface, SessionInterface } from "@type/chat";
import { UserDictEntryInterface, UserDictInterface } from "@type/userpref";
import defaultUserDicts from "@constants/userdict";
import EditIcon from "@icon/EditIcon";
import TickIcon from "@icon/TickIcon";
import DeleteIcon from "@icon/DeleteIcon";
import PlusIcon from "@icon/PlusIcon";

const DictionaryConfig = () => {
    const sessions = useStore((state) => state.sessions);
    const setSessions = useStore((state) => state.setSessions);
    const currentSessionIndex = useStore((state) => state.currentSessionIndex);
    const currentSession = sessions[currentSessionIndex];

    // CHAT2SESSION
    // const currentChatIndex = useStore((state) => state.currentChatIndex);
    // const chats = useStore((state) => state.chats);
    // const setChats = useStore((state) => state.setChats);
    // if (!chats || currentChatIndex < 0 || currentChatIndex >= chats.length) return <></>;

    const currentDictIndex = currentSession.user_dict_index;
    const [_currDictIndex, __setCurrDictIndex] = useState<number>(currentDictIndex);
    const _setCurrDictIndex = (newIndex: number) => {
        __setCurrDictIndex(newIndex);
        const updatedSessions: SessionInterface[] = JSON.parse(JSON.stringify(useStore.getState().sessions));
        updatedSessions[currentSessionIndex].user_dict_index = newIndex;
        setSessions(updatedSessions);
    };

    // from global storage
    const userDicts = useStore((state) => state.userDicts);
    const setUserDicts = useStore((state) => state.setUserDicts);

    // component state
    const [currDict, _setCurrDict] = useState<UserDictInterface>(userDicts[_currDictIndex]);

    // a wrapper to update both local state and global storage
    const setCurrDict = (dict: UserDictInterface) => {
        // console.log('[setUserDicts]', dict.entries);
        _setCurrDict(dict);

        const updatedUserDicts: UserDictInterface[] = JSON.parse(JSON.stringify(userDicts));
        updatedUserDicts[_currDictIndex] = dict;
        setUserDicts(updatedUserDicts);
    };

    const dictEntryUpdator = (entryIndex: number) => (
        (newEntry: UserDictEntryInterface) => {
            const updatedDict: UserDictInterface = JSON.parse(JSON.stringify(currDict));
            if (entryIndex < updatedDict.entries.length)
                updatedDict.entries[entryIndex] = newEntry;
            else
                updatedDict.entries.push(newEntry);
            setCurrDict(updatedDict);
        }
    );
    const dictEntryRemover = (entryIndex: number) => (
        () => {
            const updatedDict: UserDictInterface = JSON.parse(JSON.stringify(currDict));
            updatedDict.entries = updatedDict.entries.filter(
                (v, i) => i !== entryIndex
            );
            setCurrDict(updatedDict);
        }
    );
    const handleAddNewEntry = () => {
        const updatedDict: UserDictInterface = JSON.parse(JSON.stringify(currDict));
        updatedDict.entries.push({
            source: '',
            target: '',
        });
        setCurrDict(updatedDict);
    };

    // console.log('Entries: ', userDicts[_currDictIndex].entries);

    return (
        <>
            <div className="flex flex-col" style={{
                minHeight: '300px',
                minWidth: '500px',
            }}>
                {(userDicts[_currDictIndex]) && userDicts[_currDictIndex].entries.map((entry, idx) => {
                    // console.log(entry, idx);
                    return <DictEntryView
                        key={idx}
                        source={entry.source || ''}
                        target={entry.target || ''}
                        handleUpdate={dictEntryUpdator(idx)}
                        handleRemove={dictEntryRemover(idx)}
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

const DictEntryView = ({
    source,
    target,
    handleUpdate,
    handleRemove,
    ...props
}: {
    source: string,
    target: string,
    handleUpdate: (newEntry: UserDictEntryInterface) => void,
    handleRemove: () => void,
}) => {
    const [sourceValue, setSourceValue] = useState<string>(source);
    const [targetValue, setTargetValue] = useState<string>(target);
    useEffect(() => {
        setSourceValue(source);
        setTargetValue(target);
    }, [source, target]);

    const handleSourceChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSourceValue(e.target.value);
    };
    const handleTargetChange = (e: ChangeEvent<HTMLInputElement>) => {
        setTargetValue(e.target.value);
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.blur();
        }
    };

    const [isNotEditable, setIsNotEditable] = useState<boolean>(true);
    const handleEditButtonClick = () => {
        if (!isNotEditable)
            handleUpdate({ source: sourceValue, target: targetValue });
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
                placeholder={'源语言词汇'}
                value={sourceValue}
                onChange={(e) => { handleSourceChange(e) }}
                onKeyDown={(e) => { handleKeyDown(e) }}
            />
            <input
                disabled={isNotEditable}
                type='text'
                className='text-gray-800 dark:text-white p-3 text-sm bg-transparent disabled:opacity-40 disabled:cursor-not-allowed transition-opacity m-0 w-full h-full focus:outline-none rounded border border-white/20'
                placeholder={'目标语言词汇'}
                value={targetValue}
                onChange={(e) => { handleTargetChange(e) }}
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

export default DictionaryConfig;