import { blankAssistentMessage } from "@constants/chat";
import { MessageInterface, MessageChunkInterface, TaskInterface, ChatInterface } from "@type/chat";
import { _defaultSystemMessage } from "@constants/chat";
import useStore from "@store/store";
import { UserDictEntryInterface, UserDictInterface } from "@type/userpref";
import { useEffect } from "react";

const useConstructPrompt = () => {
    const userDicts = useStore((state) => state.userDicts);
    const currentChatIndex = useStore((state) => state.currentChatIndex);
    const setChats = useStore((state) => state.setChats);

    const constructPrompt = (): MessageChunkInterface[] => {
        let chunks: MessageChunkInterface[] = [];
        const chats = useStore.getState().chats;
        if (!chats) return chunks;
        const currTask = chats[currentChatIndex].task;
        const userDict = (currTask.userDictIndex < userDicts.length && currTask.userDictIndex >= 0) ?
            userDicts[currTask.userDictIndex] : userDicts[0];
        // console.log(currTask, userDict);
        chunks = _constructPrompt(currTask, userDict);
        // Update task.chunks
        const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));
        if (currentChatIndex < updatedChats.length && currentChatIndex >= 0) {
            updatedChats[currentChatIndex].task.messageChunks = chunks;
            setChats(updatedChats);
        }
        // console.log(updatedChats[currentChatIndex].task);
        return chunks;
    };

    return { constructPrompt };
};

// These functions specify Prompt Strategy
const _constructPrompt = (task: TaskInterface, dict: UserDictInterface): MessageChunkInterface[] => {
    const truncatedUserText: string[] = textTrunc(task.user_text);
    const chunks: MessageChunkInterface[] = truncatedUserText.map((usertext) => {
        let messages: MessageInterface[] = [];
        messages.push({ 'role': 'system', 'content': _defaultSystemMessage });
        dict.entries.forEach((entry) => {
            messages.push({ 'role': 'system', 'content': dictEntryToPrompt(entry) });
        });
        messages.push({ 'role': 'user', 'content': usertext });
        // messages.push(blankAssistentMessage);
        return messages;
    });
    return chunks;
};

// Truncate long text into smaller pieces
const textTrunc = (text: string): string[] => {
    const result = text.split('\n').filter((value) => value);
    // console.log(result);
    return result;
}

const dictEntryToPrompt = (entry: UserDictEntryInterface): string => {
    return `You should translate "${(entry as any).source}" into "${(entry as any).target}"`;
}

export { useConstructPrompt };