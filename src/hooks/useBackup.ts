import { syncUp } from "@api/backendApi";
import { ChatInterface } from "@type/chat";
import { UserDictInterface, UserPromptInterface } from "@type/userpref";

export type SyncType = 'chat' | 'userdict' | 'userprompt'

const useBackup = () => {
    const syncToServer = async (syncType: SyncType, {
        chat,
        dict,
        prompts,
    }: {
        chat?: ChatInterface,
        dict?: UserDictInterface,
        prompts?: UserPromptInterface[],
    }) => {
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
        const syncResult = await syncUp(syncType, data);
    };

    const syncFromServer = async () => {
        console.debug('syncFromServer');
    };

    return { syncToServer, syncFromServer };
};

export default useBackup;