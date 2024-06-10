import { syncDown, syncUp, userLogin } from "@api/backendApi";
import { _defaultChatConfig } from "@constants/chat";
import useStore from "@store/store";
import { ChatInterface, SessionInterface } from "@type/chat";
import { UserDictInterface, UserPromptInterface } from "@type/userpref";

export type SyncType = 'chat' | 'userdict' | 'userprompt' | 'session';

const useBackup = () => {
    const currentChatIndex = useStore((state) => state.currentChatIndex);
    const chats = useStore((state) => state.chats);
    const setChats = useStore((state) => state.setChats);
    // const currentDictIndex = (!chats || currentChatIndex < 0 || currentChatIndex >= chats.length) ?
    //     0 : chats[currentChatIndex].task.user_dict_index;

    const sessions = useStore((state) => state.sessions);
    const setSessions = useStore((state) => state.setSessions);
    const currentSessionIndex = useStore((state) => state.currentSessionIndex);
    const currentDictIndex = sessions[currentSessionIndex].user_dict_index;
    const setUserDicts = useStore((state) => state.setUserDicts);
    const setUserPromtps = useStore((state) => state.setUserPrompts);

    const syncToServer = async (syncType: SyncType, {
        chat,
        session,
        dict,
        prompts,
    }: {
        chat?: ChatInterface,
            session?: SessionInterface,
        dict?: UserDictInterface,
        prompts?: UserPromptInterface[],
    }) => {
        const currUser = useStore.getState().user;
        if (!currUser.isValid || !currUser.token) {
            return;
        }
        let data: any = {};
        switch (syncType) {
            case 'chat':
                data.chat = chat;
                break;
            case 'session':
                data.session = session;
                break;
            case 'userdict':
                data.userdict = dict;
                break;
            case 'userprompt':
                data.userprompt = prompts;
                break;
        };
        const syncResult = await syncUp(syncType, data, currUser.token);
    };

    const syncFromServer = async (syncType: SyncType) => {
        const currUser = useStore.getState().user;
        if (!currUser.isValid || !currUser.token) {
            return;
        }
        const syncResult = await syncDown(syncType, currUser.token);
        // console.debug('[syncFromServer]');
        if (syncResult.code != 0) {
            console.error(syncResult.error_msg);
            return;
        }
        switch (syncType) {
            case 'chat':
                const chats: ChatInterface[] = syncResult.data;
                console.debug(chats);
                const currChats = useStore.getState().chats || [];
                const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(currChats));
                const existing_chat_ids = updatedChats.map((c) => { return c.id });
                chats.forEach((c) => {
                    c.config = _defaultChatConfig;
                    c.titleSet = false;
                    if (!(existing_chat_ids.some((id) => id == c.id)))
                        updatedChats.unshift(c);
                });
                setChats(updatedChats);
                break;
            case 'session':
                const sessions: SessionInterface[] = syncResult.data;
                const updatedSessions: SessionInterface[] = JSON.parse(JSON.stringify(useStore.getState().sessions));
                const existing_session_ids = updatedSessions.map((s) => s.id);
                sessions.forEach((s) => {
                    s.config = _defaultChatConfig;
                    if (!(existing_session_ids.some((id) => id == s.id)))
                        updatedSessions.unshift(s);
                });
                setSessions(updatedSessions);
                break;
            case 'userdict':
                const dict: UserDictInterface = syncResult.data;
                // console.debug(dict);
                if (dict && dict.entries instanceof Array) {
                    const updatedDicts = JSON.parse(JSON.stringify(useStore.getState().userDicts));
                    updatedDicts[currentDictIndex] = dict;
                    setUserDicts(updatedDicts);
                };
                break;
            case 'userprompt':
                const { prompts }: { prompts: UserPromptInterface[] } = syncResult.data;
                // console.debug(prompts);
                setUserPromtps(prompts);
                break;
        };
    };

    return { syncToServer, syncFromServer };
};

export default useBackup;