import { getChatCompletion } from "@api/api";
import { UserDictEntryInterface } from "@type/userpref";
import useStore from "@store/store";
import { _defaultChatConfig } from "@constants/chat";
import { MessageInterface } from "@type/chat";

const prompt = `下面你将会接收三段文本，分别是【英文原文】、【中文译文】和【修订译文】。
请你首先以词语为单位，找出【修订译文】相较于【中文译文】中的修改之处，每一处修改只应包含一个尽量短的短语，
且空白字符（例如换行、空格）等不算作修改。
然后，对于每一处修改的中文短语，找出其在【英文原文】中所对应的英文短语。
请以json格式返回一个修改列表，其中包含所有的修改。修改列表命名为"diff"，每一个修改项里英文短语命名为"en"，中文译文命名为"zh"，修订译文命名为"zh_mod"。
回答时每个部分使用其原本对应的语言。不要添加任何解释或其它说明。`

const useExtractPreference = () => {
    const apiEndpoint = useStore((state) => state.apiEndpoint);
    const apiKey = useStore((state) => state.apiKey);

    const extractPreference = async (en: string, zh: string, zh_mod: string): Promise<UserDictEntryInterface[]> => {
        const messages: MessageInterface[] = [
            { role: 'system', content: prompt },
            { role: 'user', content: '英文原文：\n' + en },
            { role: 'user', content: '中文译文：\n' + zh },
            { role: 'user', content: '修订译文：\n' + zh_mod },
        ];
        console.debug('Extract Preferences:', messages);
        const rawJson = await getChatCompletion(
            apiEndpoint,
            messages,
            {
                ..._defaultChatConfig,
                temperature: 0.1,
                response_format: { "type": "json_object" },
            },
            apiKey,
        );
        // console.log(rawJson.choices[0].message.content);
        const prefList = JSON.parse(rawJson.choices[0].message.content);
        console.debug('prefList:', prefList);
        if (!prefList.diff) return [];
        const result = (prefList.diff as any[]).map((diff): UserDictEntryInterface => {
            return {
                source: diff.en || '',
                target: diff.zh_mod || '',
            }
        });
        // console.log(result);
        return result;
    };

    return { extractPreference };
}

export default useExtractPreference;