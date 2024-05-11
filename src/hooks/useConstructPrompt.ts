import { blankAssistentMessage } from "@constants/chat";
import { MessageInterface, MessageChunkInterface, TaskInterface, ChatInterface } from "@type/chat";
import { _defaultSystemMessage } from "@constants/chat";
import useStore from "@store/store";
import { UserDictEntryInterface, UserDictInterface, UserPromptInterface } from "@type/userpref";
import { useEffect } from "react";
import countTokens from "@utils/messageUtils";

const useConstructPrompt = () => {
    const currentChatIndex = useStore((state) => state.currentChatIndex);
    const setChats = useStore((state) => state.setChats);

    const constructPrompt = (): MessageChunkInterface[] => {
        const chats = useStore.getState().chats;
        const userDicts = useStore.getState().userDicts;
        const userPrompts = useStore.getState().userPrompts;
        let chunks: MessageChunkInterface[] = [];
        if (!chats) return chunks;
        const currTask = chats[currentChatIndex].task;
        const userDict = (currTask.user_dict_index < userDicts.length && currTask.user_dict_index >= 0) ?
            userDicts[currTask.user_dict_index] : userDicts[0];
        // console.log(currTask, userDict);
        const chunkedUserText: string[] = textTrunc(currTask.user_text);
        chunks = _constructPrompt(chunkedUserText, userDict, userPrompts);

        // Update task.chunks
        const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));
        if (currentChatIndex < updatedChats.length && currentChatIndex >= 0) {
            updatedChats[currentChatIndex].task.message_chunks = chunks;
            updatedChats[currentChatIndex].task.user_text_chunks = chunkedUserText.map((text, chunk_num) => {
                return { chunk_num, text }
            });
            setChats(updatedChats);
        }
        // console.log(updatedChats[currentChatIndex].task);
        return chunks;
    };

    return { constructPrompt };
};

// These functions specify Prompt Strategy
// const beta_prompt = `所给的英文文本格式为[【$编号】][换行][待翻译文本]。
// 除了开头的一个编号和换行之外，后续内容都是待翻译文本，你需要将它们全部翻译出来。
// 以json格式返回结果，json中包括：1.这段文本的编号，命名为"chunk_num"；2.翻译的结果，命名为"text"`
const init_prompt = `
The English text given by USER is formatted as "[【$number】][text_to_translate].
All the text after the $number at the very beginning should be translated.
Return in JSON, which has the structure as {"chunk_num":[the given number], "text":[the translated text]}.
`

const following_prompt = `
There will be two pieces of text given by USER, namely "PREV_EN" and "CURR_EN".
"PREV_EN" and "CURR_EN" are originally consequent text.
You need to translate the text in "CURR_EN" into Chinese, considering the context and coreference in "PREV_EN".
"CURR_EN" is formatted as "[【$number】][text_to_translate]. All the text after the $number at the very beginning should be translated.
Return in JSON, which has the structure as {"chunk_num":[the given number in "CURR_EN"], "text":[the translated text]}.
`

const following_prompt_withZH = `
There will be three pieces of text given by USER, namely "PREV_EN", "PREV_ZH" and "CURR_EN".
"PREV_EN" and "CURR_EN" are consequent text, and "PREV_ZH" is the Chinese translation of the text in "PREV_EN".
You need to translate the text in "CURR_EN" into Chinese, considering the context, coreference and
translation style of "PREV_ZH" and its original text "PREV_EN".
"CURR_EN" is formatted as "[【$number】][text_to_translate]. All the text after the $number at the very beginning should be translated.
Return in JSON, which has the structure as {"chunk_num":[the given number in "CURR_ZH"], "text":[the translated text]}.
`

const _constructPrompt = (chunkedUserText: string[], dict: UserDictInterface, prompts: UserPromptInterface[]): MessageChunkInterface[] => {
    const chunks: MessageChunkInterface[] = chunkedUserText.map((usertext, idx) => {
        const messages: MessageInterface[] = [];
        messages.push({ 'role': 'system', 'content': _defaultSystemMessage });
        // Task introduction
        if (idx == 0) {
            messages.push({ 'role': 'system', 'content': init_prompt });
        } else {
            messages.push({ 'role': 'system', 'content': following_prompt });
        }

        // User Preferences, including vocab and prompt
        dict.entries.forEach((entry) => {
            messages.push({ 'role': 'system', 'content': dictEntryToPrompt(entry) });
        });
        prompts.forEach((prompt) => {
            messages.push({ 'role': 'system', 'content': prompt.content });
        })

        // Text to translate
        if (idx == 0) {
            messages.push({ 'role': 'user', 'content': `【$${idx}】` + '\n' + usertext });
        } else {
            messages.push({ 'role': 'user', 'content': 'PREV_EN:\n' + chunkedUserText[idx - 1] });
            messages.push({ 'role': 'user', 'content': 'CURR_EN:\n' + `【$${idx}】` + '\n' + usertext });
        }
        return messages;
    });
    return chunks;
};

// Truncate long text into smaller pieces
const textTrunc = (text: string): string[] => {
    const model = 'gpt-3.5-turbo';
    const tokenLimit = 6400; // gpt-3.5-turbo supports maximum 16385 tokens

    // Strategy: consider '\n\n' as a deliminator of a paragraph
    const lines = text.split('\n\n').filter((value) => value);

    const result = [text];
    // console.log(result);
    return lines;
}

const dictEntryToPrompt = (entry: UserDictEntryInterface): string => {
    return `You should translate "${(entry as any).source}" into "${(entry as any).target}"`;
}

export { useConstructPrompt };