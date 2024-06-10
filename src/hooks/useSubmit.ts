import React from 'react';
import useStore from '@store/store';
import { useTranslation } from 'react-i18next';
import { ChatInterface, MessageInterface, TaskInterface, SessionInterface } from '@type/chat';
import { getChatCompletion, getChatCompletionStream } from '@api/api';
import { parseEventSource } from '@api/helper';
import { limitMessageTokens, updateTotalTokenUsed } from '@utils/messageUtils';
import { _defaultChatConfig, blankAssistentMessage } from '@constants/chat';
import { officialAPIEndpoint } from '@constants/auth';
import { isArray, isUndefined } from 'lodash';
import { addContextToPrompt, useConstructPrompt } from '@hooks/useConstructPrompt';
import useBackup from './useBackup';
import { encode, isWithinTokenLimit, encodeChat } from 'gpt-tokenizer';

const useSubmit = () => {
  const { t, i18n } = useTranslation('api');
  const error = useStore((state) => state.error);
  const setError = useStore((state) => state.setError);
  const apiEndpoint = useStore((state) => state.apiEndpoint);
  const apiKey = useStore((state) => state.apiKey);
  const setGenerating = useStore((state) => state.setGenerating);
  const generating = useStore((state) => state.generating);
  const { constructPrompt, doContextAdjust } = useConstructPrompt();
  const { syncToServer } = useBackup();
  const setChats = useStore((state) => state.setChats);
  const currentChatIndex = useStore((state) => state.currentChatIndex);

  const setSessions = useStore((state) => state.setSessions);
  const currentSessionIndex = useStore((state) => state.currentSessionIndex);

  const handleSubmit = async () => {
    const dictBackupQuery = syncToServer('userdict', { dict: useStore.getState().userDicts[0] });
    const promptBackupQuery = syncToServer('userprompt', { prompts: useStore.getState().userPrompts });
    const chats = useStore.getState().chats;
    const sessions = useStore.getState().sessions;
    if (generating || !chats) return;
    // console.debug('Submitting..');

    const currentSession = sessions[currentSessionIndex];
    // console.log(currTask.user_text);
    currentSession.message_chunks = [];
    currentSession.result_text_chunks = [];
    currentSession.original_result_text_chunks = [];
    const updatedSessions: SessionInterface[] = JSON.parse(JSON.stringify(useStore.getState().sessions));
    setSessions(updatedSessions);

    // This should update task.messageChunks, so the above changes must be saved first
    const constructedMessagesChunks = constructPrompt();
    // console.log(constructedMessagesChunks);
    setGenerating(true);

    // For performance analysis
    const promptTokenCount = [];
    const completionTokenCount = [];

    try {
      let curr_ctx = '';
      for (let i = 0, len = constructedMessagesChunks.length; i < len; i++) {
        const messages = constructedMessagesChunks[i];
        const messages_tokencount = encodeChat(messages, 'gpt-3.5-turbo').length;
        let ith_result;
        let _text;

        // Insert Context
        if (i != 0) {
          constructedMessagesChunks[i] = addContextToPrompt(constructedMessagesChunks[i], curr_ctx);
        }

        // Limit messages token
        if (messages.length === 0) throw new Error('Message exceed max token!');
        console.debug(`[handleSubmit] Submitting Messages ${i}: `, messages);
        // console.log(JSON.stringify(messages));

        // API Check
        if (!apiKey || apiKey.length === 0) {
            throw new Error(t('noApiKeyWarning') as string);
        } 

        // Get Result
        let num_try = 0;
        const max_try = 3;
        while (true) {
          if (num_try >= max_try) {
            console.error(`Abort Chunk ${i} after ${num_try} times.`);
            console.error(`Aborted chunk with ${messages_tokencount} tokens:`, messages);
            break;
          }
          num_try += 1;

          ith_result = await getChatCompletion(
            useStore.getState().apiEndpoint,
            messages,
            {
              ...currentSession.config,
              temperature: 0.1,
              response_format: { "type": "json_object" },
            },
            apiKey
          );

          // Process the result
          // console.log(ith_result)
          const reason = ith_result.choices[0].finish_reason;
          if (reason != 'stop') {
            console.error('Unexpected finish reason:', reason, 'result:', ith_result);
            continue;
          }
          const rawJson = JSON.parse(ith_result.choices[0].message.content);
          // fileAsConsole.debug(`Messages [${i}] got response:`, rawJson);
          let { seg_num, context } = rawJson;
          _text = rawJson.text;
          console.debug(`Message Chunk [${i}] got response, seg_num=${seg_num}, line_num=${_text.length}`,);
          console.debug('TEXT:', _text);
          if (_text.length == 0 || seg_num > _text.length || (_text.length - seg_num > 3)) {
            console.error('text length error.\nRetrying...');
            continue;
          }

          if (i == 0) {
            curr_ctx = context;
          }

          break;
        } // end while

        // In case GPT didn't return an Array of text
        let text: string;
        if (isArray(_text)) {
          _text = _text.filter((sent: string) => {
            const shouldRemove = sent.includes('END OF CURR_EN') || sent.includes('BEGIN OF CURR_EN');
            return !shouldRemove;
          });
          text = _text.join('\n');
        }
        else {
          text = _text;
        }
        // console.debug(text.split('\n').length);

        // Update task
        // CHAT2SESSION
        // const updatedChats: ChatInterface[] = JSON.parse(
        //   JSON.stringify(useStore.getState().chats)
        // );
        // const updatedTask = updatedChats[currentChatIndex].task;
        // updatedTask.result_text += (text + '\n\n');
        // updatedTask.result_text_chunks.push({ chunk_num: i, text: text + '\n\n' });
        // updatedTask.original_result_text += (text + '\n\n');
        // updatedTask.original_result_text_chunks.push({ chunk_num: i, text: text + '\n\n' });
        // setChats(updatedChats);
        const updatedSessions: SessionInterface[] = JSON.parse(JSON.stringify(useStore.getState().sessions));
        const currSession = updatedSessions[currentSessionIndex];
        currSession.result_text_chunks.push({ chunk_num: i, text: text + '\n\n' });
        currSession.original_result_text_chunks.push({ chunk_num: i, text: text + '\n\n' });
        setSessions(updatedSessions);

        // Feature: use context
        const completionAPI = (msgs: MessageInterface[]) => {
          return getChatCompletion(
            useStore.getState().apiEndpoint,
            msgs,
            {
              ...currentSession.config,
              temperature: 0.1,
              response_format: { "type": "json_object" },
            },
            apiKey
          );
        }

        if (i != 0 && i + 1 != len) {
          // Parallize?
          const adjust_result = await doContextAdjust(_text, curr_ctx, completionAPI);
          curr_ctx = adjust_result.context
          promptTokenCount.push(adjust_result.pTok);
          completionTokenCount.push(adjust_result.cTok);
        }

        // Auto Backup
        const sessionBackupQuery = syncToServer('session', { session: currSession });
        // const sessionBackupQuery = Promise.resolve();
        await Promise.all([dictBackupQuery, promptBackupQuery, sessionBackupQuery]);
      } // end for
    } catch (e: unknown) {
      console.error(e);
      const err = (e as Error).message;
      // console.error(err);
      setError(err);
    }
    setGenerating(false);

    // For performance analysis
    const pTok = promptTokenCount.reduce((prev, curr) => { return prev + curr }, 0);
    const cTok = completionTokenCount.reduce((prev, curr) => { return prev + curr }, 0);
    const price = pTok * 0.5 / 1000000 + cTok * 1.5 / 1000000;
  };

  return { handleSubmit, error };
};

export default useSubmit;
