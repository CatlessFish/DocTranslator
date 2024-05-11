export interface UserDictEntryInterface {
    source: string,
    target: string,
};

export interface UserDictInterface {
    id: string,
    name: string,
    entries: UserDictEntryInterface[],
};

export interface UserPromptInterface {
    content: string,
};