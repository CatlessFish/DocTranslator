import React from 'react';
import useStore from '@store/store';
import { useTranslation } from 'react-i18next';
import { ChatInterface, MessageInterface, TaskInterface } from '@type/chat';
import { getChatCompletion, getChatCompletionStream } from '@api/api';
import { parseEventSource } from '@api/helper';
import { limitMessageTokens, updateTotalTokenUsed } from '@utils/messageUtils';
import { _defaultChatConfig, blankAssistentMessage } from '@constants/chat';
import { officialAPIEndpoint } from '@constants/auth';
import { isUndefined } from 'lodash';
import { useConstructPrompt } from '@hooks/useConstructPrompt';

const useSubmit = () => {
  const { t, i18n } = useTranslation('api');
  const error = useStore((state) => state.error);
  const setError = useStore((state) => state.setError);
  const apiEndpoint = useStore((state) => state.apiEndpoint);
  const apiKey = useStore((state) => state.apiKey);
  const setGenerating = useStore((state) => state.setGenerating);
  const generating = useStore((state) => state.generating);
  const currentChatIndex = useStore((state) => state.currentChatIndex);
  const setChats = useStore((state) => state.setChats);
  const { constructPrompt } = useConstructPrompt();

  const handleSubmit = async () => {
    const chats = useStore.getState().chats;
    if (generating || !chats) return;

    chats[currentChatIndex].task.result_text = '';
    chats[currentChatIndex].task.original_result_text = '';
    chats[currentChatIndex].task.message_chunks = [];
    const constructedMessagesChunks = constructPrompt(); // This should update task.messageChunks

    const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));
    setChats(updatedChats);
    setGenerating(true);

    try {
      // check if len == 0
      for (let i = 0, len = constructedMessagesChunks.length; i < len; i++) {
        const messages = constructedMessagesChunks[i];
        console.log(i, messages);
        let stream;

        // Check messages.length
        // Limit messages token
        if (messages.length === 0) throw new Error('Message exceed max token!');
        console.debug('[handleSubmit] Submitting Messages: ', messages);

        // no api key (free)
        if (!apiKey || apiKey.length === 0) {
          // official endpoint
          if (apiEndpoint === officialAPIEndpoint) {
            throw new Error(t('noApiKeyWarning') as string);
          }

          // other endpoints
          stream = await getChatCompletionStream(
            useStore.getState().apiEndpoint,
            messages,
            chats[currentChatIndex].config
          );
        } else if (apiKey) {
          // own apikey
          stream = await getChatCompletionStream(
            useStore.getState().apiEndpoint,
            messages,
            chats[currentChatIndex].config,
            apiKey
          );
        }

        if (stream) {
          if (stream.locked)
            throw new Error(
              'Oops, the stream is locked right now. Please try again'
            );
          const reader = stream.getReader();
          let reading = true;
          let partial = '';
          while (reading && useStore.getState().generating) {
            const { done, value } = await reader.read();
            const result = parseEventSource(
              partial + new TextDecoder().decode(value)
            );
            partial = '';

            if (result === '[DONE]' || done) {
              reading = false;
            } else {
              const resultString = result.reduce((output: string, curr) => {
                if (typeof curr === 'string') {
                  partial += curr;
                } else {
                  const content = curr.choices[0]?.delta?.content ?? null;
                  if (content) output += content;
                }
                return output;
              }, '');
            // console.log('[resultstring]', resultString);

              const updatedChats: ChatInterface[] = JSON.parse(
                JSON.stringify(useStore.getState().chats)
              );
              const updatedTask = updatedChats[currentChatIndex].task;
              updatedTask.result_text += resultString;
              updatedTask.original_result_text += resultString;

              // Where to store the result of each chunk?
              // const updatedMessages = updatedTask.messageChunks[i];
              // updatedMessages[updatedMessages.length - 1].content += resultString;
              setChats(updatedChats);
              // console.debug('[handleSubmit] Updated task: ', updatedChats[currentChatIndex].task);
            }
          }
          if (useStore.getState().generating) {
            reader.cancel('Cancelled by user');
          } else {
            reader.cancel('Generation completed');
          }
          reader.releaseLock();
          stream.cancel();
        }
        // Add Newline
        const updatedChats: ChatInterface[] = JSON.parse(
          JSON.stringify(useStore.getState().chats)
        );
        const updatedTask = updatedChats[currentChatIndex].task;
        updatedTask.result_text += '\n';
        updatedTask.original_result_text += '\n';
        setChats(updatedChats);

        // update tokens used in chatting
        const currChats = useStore.getState().chats;
        const countTotalTokens = useStore.getState().countTotalTokens;

        if (currChats && countTotalTokens) {
          const model = currChats[currentChatIndex].config.model;
          // const messages = currChats[currentChatIndex].messages;
          const messages: MessageInterface[] = [];
          updateTotalTokenUsed(
            model,
            messages.slice(0, -1),
            messages[messages.length - 1]
          );
        };
      } // end for
    } catch (e: unknown) {
      console.log(e)
      const err = (e as Error).message;
      console.log(err);
      setError(err);
    }
    setGenerating(false);
  };

  return { handleSubmit, error };
};

export default useSubmit;
