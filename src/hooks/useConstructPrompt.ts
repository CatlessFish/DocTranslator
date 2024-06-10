import { blankAssistentMessage } from "@constants/chat";
import { MessageInterface, MessageChunkInterface, TaskInterface, ChatInterface, SessionInterface } from "@type/chat";
import { _defaultSystemMessage } from "@constants/chat";
import useStore from "@store/store";
import { UserDictEntryInterface, UserDictInterface, UserPromptInterface } from "@type/userpref";
import { useEffect } from "react";
import countTokens from "@utils/messageUtils";
import { encode, isWithinTokenLimit, encodeChat } from 'gpt-tokenizer';

const useConstructPrompt = () => {
    const currentChatIndex = useStore((state) => state.currentChatIndex);
    const setChats = useStore((state) => state.setChats);

    const currentSessionIndex = useStore((state) => state.currentSessionIndex);
    const setSessions = useStore((state) => state.setSessions);

    const constructPrompt = (): MessageChunkInterface[] => {
        const chats = useStore.getState().chats;
        const sessions = useStore.getState().sessions;
        const userDicts = useStore.getState().userDicts;
        const userPrompts = useStore.getState().userPrompts;
        // console.log(JSON.stringify(userDicts));
        // console.log(JSON.stringify(userPrompts));
        let chunks: MessageChunkInterface[] = [];
        // if (!chats) return chunks;
        // const currTask = chats[currentChatIndex].task;
        const currSession = sessions[currentSessionIndex];
        const userDict = (currSession.user_dict_index < userDicts.length && currSession.user_dict_index >= 0) ?
            userDicts[currSession.user_dict_index] : userDicts[0];
        // console.log(currTask, userDict);
        const chunkedUserText: string[] = textTrunc(currSession.user_text);
        chunks = _constructPrompt(chunkedUserText, userDict, userPrompts);

        // Update task.chunks
        // CHAT2SESSION
        // const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));
        // if (currentChatIndex < updatedChats.length && currentChatIndex >= 0) {
        //     updatedChats[currentChatIndex].task.message_chunks = chunks;
        //     updatedChats[currentChatIndex].task.user_text_chunks = chunkedUserText.map((text, chunk_num) => {
        //         return { chunk_num, text }
        //     });
        //     setChats(updatedChats);
        // }
        // console.log(updatedChats[currentChatIndex].task);
        const updatedSessions: SessionInterface[] = JSON.parse(JSON.stringify(useStore.getState().sessions));
        updatedSessions[currentSessionIndex].message_chunks = chunks;
        updatedSessions[currentSessionIndex].user_text_chunks = chunkedUserText.map((text, chunk_num) => {
            return { chunk_num, text }
        });
        setSessions(updatedSessions);
        return chunks;
    };

    const doContextAdjust = async (translation: string[],
        ctx: string,
        completionAPI: (msgs: MessageInterface[]) => Promise<any>,
    ) => {
        const messages: MessageInterface[] = [];
        messages.push({ 'role': 'system', 'content': context_update_prompt });
        messages.push({ 'role': 'user', 'content': ctx + '\n' + translation.join('\n') });
        const res = await completionAPI(
            messages,
        );
        const pTok = res.usage?.prompt_tokens || 0;
        const cTok = res.usage?.completion_tokens || 0;
        const rawJson = JSON.parse(res.choices[0].message.content);
        const { context } = rawJson;
        return { context, pTok, cTok };
    }

    return { constructPrompt, doContextAdjust };
};

// These functions specify Prompt Strategy
const init_prompt = `\
Step 1: Translate. The English text given by USER is called "CURR_EN", it consists one or several segments.\
Each segment is formatted as "{{SEGMENT_NUMBER}}{text_to_translate}".\
Translate every segment into Simplified Chinese, do not omit any segments. And for each segment, you should translate all the text after the line number.\
Generate an empty translation for a segment if the text in it is empty.\
Step 2: Summarize. You should summarize the information in your translation and form a CONTEXT,\
for the following tasks to reference. The context should not exceeds 500 tokens.\
`

const following_prompt = `\
Task: Translate. In this task, there will be a piece of text given by USER, named "CURR_EN", a piece of text named "PREV_EN", \
and another piece of text given by USER named "CONTEXT"
"PREV_EN" and "CONTEXT" contains some context and background knowledge with respect to CURR_EN.\
You need to translate the text in "CURR_EN" into Simplified Chinese, considering the context in "CONTEXT" and "PREV_EN".\
"CURR_EN" consists one or several segments. Each segment is formatted as "{{SEGMENT_NUMBER}}{text_to_translate}".\
Requirements: Translate every segment between the START and END of CURR_EN, do not omit any segments. And for each segment, you should translate all the text after the line number.\
Generate an empty translation for a segment if the text in it is empty.\
Do not translate the text in "CONTEXT".
`

const init_format_prompt = `\
The translation result should be a list of translated segments of text.\
The length of the list must equal to the number of segments given in CURR_EN.\
Return in JSON, which has the structure as \
{"seg_num":the number of segments given in "CURR_EN", "text":[a list of the text of tranlated segments], "context":the summarized context}.\
The list of texts should not contain the line number. Do not add any other things into the result.\
`

const following_format_prompt = `\
The translation result should be a list of translated segments of text.\
The length of the list must equal to the number of segments given in CURR_EN.\
Return in JSON, which has the structure as \
{"seg_num":the number of segments given in "CURR_EN", "text":[a list of the text of tranlated segments]}.\
The list of texts should not contain the line number. Do not add any other things into the result.\
`

const context_update_prompt = `\
Summarize the information in the given text and generate an abstract.\
The length of the abstract should be less than 300 words.
You should return in JSON format. The JSON should have a structure like:\
"{"context":the abstract}" Do not add any other things in the result.
`

const _constructPrompt = (chunkedUserText: string[], dict: UserDictInterface, prompts: UserPromptInterface[]): MessageChunkInterface[] => {
    const chunks: MessageChunkInterface[] = chunkedUserText.map((usertext, idx) => {
        const messages: MessageInterface[] = [];
        messages.push({ 'role': 'system', 'content': _defaultSystemMessage });
        // Task introduction
        if (idx == 0) {
            messages.push({ 'role': 'system', 'content': init_prompt });
            messages.push({ 'role': 'system', 'content': init_format_prompt });
        } else {
            messages.push({ 'role': 'system', 'content': following_prompt });
            messages.push({ 'role': 'system', 'content': following_format_prompt });
        }

        // UserDict
        const referencedEntries = dictEntryFilter(usertext, dict);
        referencedEntries.forEach((entry) => {
            messages.push({ 'role': 'system', 'content': dictEntryToPrompt(entry) });
        });

        // UserPrompt
        if (Array.isArray(prompts) && prompts.length > 0) {
            prompts.forEach((prompt) => {
                messages.push({ 'role': 'system', 'content': prompt.content });
            });
        }

        if (idx != 0) {
            messages.push({ 'role': 'system', 'content': 'PREV_EN:\n' + chunkedUserText[idx - 1] });
        }
        // Text to translate
        const usertext_with_lines = usertext.split('\n');
        // const usertext_with_lines = usertext;
        messages.push({ 'role': 'user', 'content': '\n===START OF CURR_EN===\n' });
        usertext_with_lines.forEach((line, linenum) => {
            if (linenum == usertext_with_lines.length - 1 && line == '') return; // Avoid the last empty line
            const formatted = `{SEGMENT_${linenum + 1}}\n` + line;
            messages.push({
                'role': 'user',
                'content': formatted,
            });
        });
        messages.push({ 'role': 'user', 'content': '\n===END OF CURR_EN===\n' });
        return messages;
    });
    return chunks;
};

export const addContextToPrompt = (messages: MessageChunkInterface, context: string = ''): MessageChunkInterface => {
    messages.push({ 'role': 'user', 'content': '\n===BEGIN OF CONTEXT===\n' + context + '\n===END OF CONTEXT===\n' });
    return messages;
}

// Truncate long text into smaller pieces
const textTrunc = (text: string) => {
    let result: string[] = [];
    const tokenLimit = 1500; // gpt-3.5-turbo supports maximum 4096 tokens in completion
    const lineLimit = 20;
    const MAX_SEGMENT_LENGTH = 1600;

    const segments = text.split('\n\n').filter((value) => value);
    segments.forEach((segment) => {
        let curr_seg = '';
        let linecount = 0;
        segment.split('\n').forEach((line) => {
            // console.log(`CurrSeg: ${encode(curr_seg).length} tokens, line: ${encode(line).length} tokens.`)
            if (linecount < lineLimit && isWithinTokenLimit(curr_seg + line, tokenLimit)) {
                // if (curr_seg.length + line.length <= MAX_SEGMENT_LENGTH) {
                curr_seg += line + '\n';
                linecount += 1;
            } else {
                result.push(curr_seg);
                curr_seg = line + '\n';
                linecount = 1;
            }
        })
        if (curr_seg != '')
            result.push(curr_seg);
        result[result.length - 1] = result[result.length - 1].trimEnd();
    })
    return result;
}

const dictEntryFilter = (text: string, dict: UserDictInterface) => {
    const result: UserDictEntryInterface[] = [];
    if (!Array.isArray(dict.entries) || dict.entries.length == 0) return result;
    dict.entries.forEach((entry) => {
        const words = entry.source.split(' ');
        // console.debug(words, text);
        let count = 0;
        words.forEach((word) => {
            if (text.includes(word)) count += 1;
        })
        if (count >= words.length / 2)
            result.push(entry);
    })
    console.log(`${result.length} dict entries matched.`);
    return result;
}

const dictEntryToPrompt = (entry: UserDictEntryInterface): string => {
    return `You should translate "${entry.source}" into "${entry.target}"`;
}

export { useConstructPrompt };