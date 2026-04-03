import { useState, useCallback } from 'react';
import { Message, ChatState } from '../types/chat';
import { openRouterClient } from '../services/openrouter';

const INITIAL_STATE: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
};

export const useChat = () => {
  const [state, setState] = useState<ChatState>(INITIAL_STATE);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = { role: 'user', content: content.trim() };
    
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const fullHistory = [...state.messages, userMessage];
      const stream = openRouterClient.sendMessageStreaming(fullHistory);

      let assistantMessage: Message = { role: 'assistant', content: '', reasoning: '' };
      
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));

      for await (const chunk of stream) {
        if (chunk.content) assistantMessage.content += chunk.content;
        if (chunk.reasoning) assistantMessage.reasoning = (assistantMessage.reasoning || '') + chunk.reasoning;

        setState((prev) => {
          const newMessages = [...prev.messages];
          newMessages[newMessages.length - 1] = { ...assistantMessage };
          return { ...prev, messages: newMessages };
        });
      }

      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('Chat: Failed to send message', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'FAILED_TO_FETCH_AI_RESPONSE',
      }));
    }
  }, [state.messages]);

  const clearChat = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return { ...state, sendMessage, clearChat };
};
