import { SyncType } from "@hooks/useBackup";
const BASE_URL = import.meta.env.VITE_BACKEND_API_ENDPOINT || "";

export interface ApiResultInterface {
    code: number,
    error_msg: string,
    data: any,
};

export const userRegister = async (
    { username, password, email }:
        { username: string, password: string, email: string }
): Promise<ApiResultInterface> => {
    try {
        const bodyString = JSON.stringify({
            username, password, email,
        });
        console.debug('[Register] body:', bodyString);
        const result = await fetch(BASE_URL + 'user/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': bodyString.length.toString()
            },
            body: bodyString,
        });
        const jsonData = await result.json();
        console.log(jsonData);
        return jsonData as ApiResultInterface;
    } catch (error) {
        console.error(error);
        return {
            code: -1,
            error_msg: (error as Error).message || 'Error',
            data: {},
        };
    }
};

export const userLogin = async (
    { username, password }:
        { username: string, password: string }
): Promise<ApiResultInterface> => {
    try {
        const bodyString = JSON.stringify({
            username, password
        });
        console.debug('[Login] body:', bodyString);
        const result = await fetch(BASE_URL + 'user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': bodyString.length.toString()
            },
            body: bodyString,
        });
        const jsonData = await result.json()
        console.log(jsonData);
        return jsonData as ApiResultInterface;
    } catch (error) {
        console.error(error);
        return {
            code: -1,
            error_msg: (error as Error).message || 'Error',
            data: {},
        };
    }
}

export const syncUp = async (stype: SyncType, data: any, userToken: string): Promise<ApiResultInterface> => {
    try {
        const bodyString = JSON.stringify({
            syncType: stype as string,
            data,
        });
        console.debug('[syncUp] body:', bodyString);
        const result = await fetch(BASE_URL + 'sync/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': bodyString.length.toString(),
                'Authorization': `Bearer ${userToken}`,
            },
            body: bodyString,
        });
        const jsonData = await result.json();
        console.debug('[syncUp] result:', jsonData);
        return jsonData as ApiResultInterface;
    } catch (error) {
        console.error(error);
        return {
            code: -1,
            error_msg: (error as Error).message || 'Error',
            data: {},
        };
    }
};

export const syncDown = async (stype: SyncType, userToken: string) => {
    try {
        const bodyString = JSON.stringify({
            syncType: stype as string,
        });
        console.debug('[syncDown] body:', bodyString);
        const result = await fetch(BASE_URL + 'sync/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': bodyString.length.toString(),
                'Authorization': `Bearer ${userToken}`,
            },
            body: bodyString,
        });
        const jsonData = await result.json();
        console.debug('[syncDown] result:', jsonData);
        return jsonData as ApiResultInterface;
    } catch (error) {
        console.error(error);
        return {
            code: -1,
            error_msg: (error as Error).message || 'Error',
            data: {},
        };
    }
};