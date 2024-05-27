import { SyncType } from "@hooks/useBackup";
const BASE_URL = import.meta.env.VITE_BACKEND_API_ENDPOINT || "";

export const syncUp = async (stype: SyncType, data: any) => {
    try {
        const bodyString = JSON.stringify({
            syncType: stype as string,
            data,
        });
        console.debug('[syncUp] body:', bodyString);
        const result = await fetch(BASE_URL + 'upload', {
            method: 'POST',
            headers: {
                // Auth
                'Content-Type': 'application/json',
                'Content-Length': bodyString.length.toString()
            },
            body: bodyString,
            // 'headers'
        });
        console.debug('[syncUp] result:', await result.text());
    } catch (error) {
        console.error(error);
    }
};

export const syncDown = async (stype: SyncType) => {
    console.debug('syncDown');
}