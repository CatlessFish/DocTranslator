import { StoreSlice } from './store';
import { UserDictInterface } from '@type/userdict';
import defaultUserDicts from '@constants/userdict';

export interface UserDictSlice {
    userDicts: UserDictInterface[];
    setUserDicts: (UserDicts: UserDictInterface[]) => void;
};

export const createUserDictSlice: StoreSlice<UserDictSlice> = (set, get) => ({
    userDicts: defaultUserDicts,
    setUserDicts: (userDicts: UserDictInterface[]) => {
        set((prev: UserDictSlice) => ({
            ...prev,
            userDicts: userDicts,
        }));
    },
});
