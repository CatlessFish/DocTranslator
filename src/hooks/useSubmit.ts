import React from 'react';
import useStore from '@store/store';
import { useTranslation } from 'react-i18next';
import { ChatInterface, MessageInterface, TaskInterface } from '@type/chat';
import { getChatCompletion, getChatCompletionStream } from '@api/api';
import { parseEventSource } from '@api/helper';
import { limitMessageTokens, updateTotalTokenUsed } from '@utils/messageUtils';
import { _defaultChatConfig, blankAssistentMessage } from '@constants/chat';
import { officialAPIEndpoint } from '@constants/auth';
import { isArray, isUndefined } from 'lodash';
import { addContextToPrompt, useConstructPrompt } from '@hooks/useConstructPrompt';
import useBackup from './useBackup';

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
  const { syncToServer } = useBackup();

  const handleSubmit = async () => {
    const dictBackupQuery = syncToServer('userdict', { dict: useStore.getState().userDicts[0] });
    const promptBackupQuery = syncToServer('userprompt', { prompts: useStore.getState().userPrompts });
    const chats = useStore.getState().chats;
    if (generating || !chats) return;
    // console.debug('Submitting..');

    const currTask = chats[currentChatIndex].task;
    // console.log(currTask.user_text);
    currTask.result_text = '';
    currTask.original_result_text = '';
    currTask.message_chunks = [];
    currTask.result_text_chunks = [];
    currTask.original_result_text_chunks = [];
    const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));
    setChats(updatedChats);

    // This should update task.messageChunks, so the above changes must be saved first
    const constructedMessagesChunks = constructPrompt();
    // console.log(constructedMessagesChunks);
    setGenerating(true);

    try {
      // check if len == 0
      for (let i = 0, len = constructedMessagesChunks.length; i < len; i++) {
        const messages = constructedMessagesChunks[i];
        let ith_result;
        // Limit messages token
        if (messages.length === 0) throw new Error('Message exceed max token!');
        console.debug(`[handleSubmit] Submitting Messages ${i}: `, messages);
        // console.log(JSON.stringify(messages));

        // no api key (free)
        if (!apiKey || apiKey.length === 0) {
          // official endpoint
          if (apiEndpoint === officialAPIEndpoint) {
            throw new Error(t('noApiKeyWarning') as string);
          }
          ith_result = await getChatCompletion(
            useStore.getState().apiEndpoint,
            messages,
            chats[currentChatIndex].config
          );
        } else if (apiKey) {
          // own apikey
          ith_result = await getChatCompletion(
            useStore.getState().apiEndpoint,
            messages,
            {
              ...chats[currentChatIndex].config,
              temperature: 0.1,
              response_format: { "type": "json_object" },
            },
            apiKey
          );
        }
        // Process the result
        // console.log(ith_result)
        const reason = ith_result.choices[0].finish_reason;
        if (reason != 'stop') {
          console.error('Unexpected finish reason:', reason, 'result:', ith_result);
          continue;
        }
        const rawJson = JSON.parse(ith_result.choices[0].message.content);
        console.debug(`Messages [${i}] got response:`, rawJson);
        // console.log(JSON.stringify(rawJson));
        const { chunk_num, text: _text, context } = rawJson;

        // Some post-process
        let text: string;
        if (isArray(_text))
          text = _text.join('\n')
        else
          text = _text
        text.replaceAll('<NEWLINE>', '\n');
        console.debug(text.split('\n').length);

        // Feature: use context
        if (i + 1 < len)
          constructedMessagesChunks[i + 1] = addContextToPrompt(constructedMessagesChunks[i + 1], context);

        // Update task
        const updatedChats: ChatInterface[] = JSON.parse(
          JSON.stringify(useStore.getState().chats)
        );
        const updatedTask = updatedChats[currentChatIndex].task;
        updatedTask.result_text += (text + '\n\n');
        updatedTask.result_text_chunks.push({ chunk_num, text: text + '\n\n' });
        updatedTask.original_result_text += (text + '\n\n');
        updatedTask.original_result_text_chunks.push({ chunk_num, text: text + '\n\n' });
        setChats(updatedChats);

        const chatBackupQuery = syncToServer('chat', { chat: updatedChats[currentChatIndex] });
        await Promise.all([dictBackupQuery, promptBackupQuery, chatBackupQuery]);
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
