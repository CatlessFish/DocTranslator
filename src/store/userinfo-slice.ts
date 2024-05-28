import { UserInfoInterface } from '@type/userinfo';
import { StoreSlice } from './store';
import { defaultUserInfo } from '@constants/user';

export interface UserInfoSlice {
    user: UserInfoInterface,
    setUser: (user: UserInfoInterface) => void,
};

export const createUserInfoSlice: StoreSlice<UserInfoSlice> = (set, get) => ({
    user: defaultUserInfo,
    setUser: (user: UserInfoInterface) => {
        set((prev: UserInfoSlice) => ({
            ...prev,
            user: user,
        }))
    },
});