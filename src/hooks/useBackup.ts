import { syncDown, syncUp, userLogin } from "@api/backendApi";
import useStore from "@store/store";
import { ChatInterface } from "@type/chat";
import { UserDictInterface, UserPromptInterface } from "@type/userpref";

export type SyncType = 'chat' | 'userdict' | 'userprompt'

const useBackup = () => {
    const setUserPromtps = useStore((state) => state.setUserPrompts);

    const syncToServer = async (syncType: SyncType, {
        chat,
        dict,
        prompts,
    }: {
        chat?: ChatInterface,
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
        if (syncResult.code != 0) {
            console.error(syncResult.error_msg);
            return;
        }
        switch (syncType) {
            case 'chat':
                break;
            case 'userdict':
                break;
            case 'userprompt':
                const { prompts }: { prompts: UserPromptInterface[] } = syncResult.data;
                // console.debug(prompts);
                setUserPromtps(prompts);
                break;
        };
        console.debug('syncFromServer');
    };

    return { syncToServer, syncFromServer };
};

export default useBackup;