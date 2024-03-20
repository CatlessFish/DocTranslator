import { blankAssistentMessage } from "@constants/chat";
import { MessageInterface, TaskInterface } from "@type/chat";
import { _defaultSystemMessage } from "@constants/chat";

const promptConstruct = (task: TaskInterface): MessageInterface[] => {
    const updatedTask = task;
    let messages: MessageInterface[] = [];
    messages.push({ 'role': 'system', 'content': _defaultSystemMessage });
    messages.push({ 'role': 'user', 'content': updatedTask.user_text });
    messages.push(blankAssistentMessage);
    return messages;
};

export { promptConstruct };