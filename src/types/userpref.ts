export interface UserDictEntryInterface {

};

export interface UserDictInterface {
    id: string,
    name: string,
    entries: UserDictEntryInterface[],
};

export interface UserPromptInterface {
    content: string,
};