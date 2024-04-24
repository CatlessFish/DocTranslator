import { StoreSlice } from './store';
import { UserDictInterface, UserPromptInterface } from '@type/userpref';
import defaultUserDicts from '@constants/userdict';

// export interface UserDictSlice {
//     userDicts: UserDictInterface[];
//     setUserDicts: (UserDicts: UserDictInterface[]) => void;
// };

export interface UserPreferenceSlice {
    userDicts: UserDictInterface[];
    userPrompts: UserPromptInterface[];
    setUserDicts: (UserDicts: UserDictInterface[]) => void;
    setUserPrompts: (UserPrompts: UserPromptInterface[]) => void;
}

export const createUserPreferenceSlice: StoreSlice<UserPreferenceSlice> = (set, get) => ({
    userDicts: defaultUserDicts,
    userPrompts: [],
    setUserDicts: (userDicts: UserDictInterface[]) => {
        set((prev: UserPreferenceSlice) => ({
            ...prev,
            userDicts: userDicts,
        }));
    },
    setUserPrompts: (UserPrompts: UserPromptInterface[]) => {
        set((prev: UserPreferenceSlice) => ({
            ...prev,
            userPrompts: UserPrompts,
        }));
    }
});
