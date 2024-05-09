import EditView from "./Message/View/EditView";
import useStore from "@store/store";
import { generateDefaultTask } from "@constants/chat";
import ResultView from "./Message/View/ResultView";

const ChatContentEditor = () => {
    const task = useStore((state) =>
        state.chats &&
            state.chats.length > 0 &&
            state.currentChatIndex >= 0 &&
            state.currentChatIndex < state.chats.length
            ? state.chats[state.currentChatIndex].task
            : generateDefaultTask() // Should not happen?
    );
    const hideSideMenu = useStore((state) => state.hideSideMenu);

    return (
        <div className='flex items-center text-sm dark:bg-gray-800 w-full h-full'>
            <TextAreaStyleDecorator>
                <EditView content={task.user_text} />
            </TextAreaStyleDecorator>
            <TextAreaStyleDecorator>
                <ResultView />
            </TextAreaStyleDecorator>

        </div>
    );
};

const TextAreaStyleDecorator = ({ children }: { children?: React.ReactElement; }) => {
    const hideSideMenu = useStore((state) => state.hideSideMenu);
    return (
        <div className='w-full h-full border-black/10 dark:border-gray-900/50 text-gray-800 dark:text-gray-100 group'>
            <div className={`h-full text-base gap-4 md:gap-6 m-auto transition-all ease-in-out ${hideSideMenu
                ? 'md:max-w-5xl lg:max-w-5xl xl:max-w-6xl'
                : 'md:max-w-3xl lg:max-w-3xl xl:max-w-4xl'
                }`}
            >
                {children}
            </div>
        </div>
    );
}

export default ChatContentEditor;