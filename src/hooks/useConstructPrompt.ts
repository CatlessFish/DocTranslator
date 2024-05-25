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
        // console.log(JSON.stringify(userDicts));
        // console.log(JSON.stringify(userPrompts));
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
const init_prompt = `\
The English text given by USER is formatted as "[【$number】][text_to_translate].\
All the text after the $number at the very beginning should be translated.\
After this, you should summarize the information in your translation and form a CONTEXT,\
for the following tasks to reference. The context should not exceeds 500 tokens.\
`

const following_prompt = `\
In this task, there will be two pieces of text given by USER, namely "PREV_EN" and "CURR_EN".\
"PREV_EN" and "CURR_EN" are originally consequent text. "CURR_EN" is formatted as "[【$number】][text_to_translate].\
You need to translate the text in "CURR_EN" into Chinese, considering the context and coreference in "PREV_EN".\
 All the text after the $number at the very beginning should be translated.\
`

const context_prompt = `\
There will be another piece of text given by the USER named "CONTEXT". It contains the information of those text\
prior to the given text in this task. Please adjust your tranlation result according to the context.\
After this, update the context by summaring and adding the information in this tranlation into the original context.\
The updated context should not exceeds 500 tokens, so you may compress the original context if needed. You should return the updated context.\
`

// const linebreak_prompt = `将原文的每一行翻译成单独的一行。在译文中相应地位置，保留原文的换行符。原文有多少行，译文就应该有多少行。`
const linebreak_prompt = ` \
The string "<NEWLINE>" in the CURR_EN text is a special symbol suggesting a line break.
You need to keep them in their correct position in the translation.
\
`

const format_prompt = `\
Return in JSON, which has the structure as\
{"chunk_num":the given number in "CURR_EN", "text":the tranlated text, "context":the concluded context}.\
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
        // messages.push({ 'role': 'system', 'content': c });
        messages.push({ 'role': 'system', 'content': format_prompt });

        // User Preferences, including vocab and prompt
        const referencedEntries = dictEntryFilter(usertext, dict);
        referencedEntries.forEach((entry) => {
            messages.push({ 'role': 'system', 'content': dictEntryToPrompt(entry) });
        });
        prompts.forEach((prompt) => {
            messages.push({ 'role': 'system', 'content': prompt.content });
        })

        // Text to translate
        // const usertext_with_lines = usertext.split('\n').join('<NEWLINE>');
        const usertext_with_lines = usertext;
        if (idx == 0) {
            messages.push({ 'role': 'user', 'content': `【$${idx}】` + '\n' + usertext_with_lines });
        } else {
            messages.push({ 'role': 'user', 'content': 'PREV_EN:\n' + chunkedUserText[idx - 1] });
            messages.push({ 'role': 'user', 'content': 'CURR_EN:\n' + `【$${idx}】` + '\n' + usertext_with_lines });
        }
        return messages;
    });
    return chunks;
};

export const addContextToPrompt = (messages: MessageChunkInterface, context: string = ''): MessageChunkInterface => {
    messages.push({ 'role': 'system', 'content': context_prompt });
    messages.push({ 'role': 'user', 'content': 'CONTEXT:\n' + context });
    return messages;
}

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

const dictEntryFilter = (text: string, dict: UserDictInterface): UserDictEntryInterface[] => {
    const result: UserDictEntryInterface[] = [];
    dict.entries.forEach((entry) => {
        const words = entry.source.split(' ');
        // console.debug(words, text);
        let count = 0;
        words.forEach((word) => {
            if (text.includes(word)) count += 1;
        })
        if (count >= words.length) // Should be words.length / 2 ?
            result.push(entry);
    })
    return result;
}

const dictEntryToPrompt = (entry: UserDictEntryInterface): string => {
    return `You should translate "${entry.source}" into "${entry.target}"`;
}

export { useConstructPrompt };