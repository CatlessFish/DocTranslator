import { StoreSlice } from "./store";

export interface AppStateSlice {
    mainPagenum: number;
    setMainPagenum: (newPageNum: number) => void;
};

export const createAppStateSlice: StoreSlice<AppStateSlice> = (set, get) => ({
    mainPagenum: 0,
    setMainPagenum: (newPageNum: number) => {
        set((prev: AppStateSlice) => ({
            ...prev,
            mainPagenum: newPageNum,
        }))
    }
});