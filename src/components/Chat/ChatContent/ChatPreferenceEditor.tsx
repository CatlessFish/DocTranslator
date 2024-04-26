import DictionaryBar from "@components/DictionaryBar";
import UserPromptBar from "@components/UserPromptBar";

const ChatPreferenceEditor = () => {
    return (
        <div className="mx-6 lg:mx-10 mt-6 flex">
            <DictionaryBar />
            <UserPromptBar />
        </div>
    );
}

export default ChatPreferenceEditor;