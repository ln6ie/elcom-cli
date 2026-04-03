import { useState, useCallback, useEffect, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Message, ChatState } from '../types/chat';
import { openRouterClient } from '../services/openrouter';
import { database } from '../services/database';
import { useSettings } from './useSettings';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';

const PAGE_SIZE = 20;

export const useChat = (conversationId?: string) => {
  const db = useSQLiteContext();
  const { settings } = useSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);

  const loadHistory = useCallback(async (isInitial = true) => {
    if (!conversationId) return;
    
    if (isInitial) {
      setIsLoading(true);
      offsetRef.current = 0;
    } else {
      setIsLoadingMore(true);
    }

    try {
      const history = await database.getMessagesPaginated(
        db, 
        conversationId, 
        PAGE_SIZE, 
        offsetRef.current
      );
      
      const newMessages = (history as Message[]).reverse();
      
      if (isInitial) {
        setMessages(newMessages);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
      }

      setHasMore(history.length === PAGE_SIZE);
      offsetRef.current += history.length;
    } catch (err) {
      console.error('useChat: Load failed', err);
      setError('FAILED_TO_LOAD_HISTORY');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [db, conversationId]);

  useEffect(() => {
    loadHistory(true);
  }, [loadHistory]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    await loadHistory(false);
  }, [isLoadingMore, hasMore, loadHistory]);

  const sendMessage = useCallback(async (content: string, attachment?: { uri: string, type: string, base64?: string }) => {
    if (!content.trim() || !conversationId) return;

    const userMsgId = Crypto.randomUUID();
    
    let finalAttachment = attachment;
    if (attachment && !attachment.base64) {
      try {
        const base64 = await FileSystem.readAsStringAsync(attachment.uri, { encoding: 'base64' });
        finalAttachment = { ...attachment, base64 };
      } catch (e) {
        console.error('useChat: Failed to read attachment', e);
      }
    }

    const userMessage: Message = { 
      role: 'user', 
      content: content.trim(),
      attachment: finalAttachment,
    };

    await database.addMessage(
      db,
      userMsgId,
      conversationId,
      'user',
      userMessage.content,
      undefined,
      finalAttachment?.uri,
      finalAttachment?.type
    );
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Get full context for the AI (from settings)
      const fullContext = await database.getMessagesPaginated(db, conversationId, settings.context_length, 0);
      const historyForAI = (fullContext as Message[]).reverse();
      
      const stream = openRouterClient.sendMessageStreaming(historyForAI, settings);
      let assistantMessage: Message = { role: 'assistant', content: '', reasoning: '' };
      
      setMessages((prev) => [...prev, assistantMessage]);

      let lastUpdate = Date.now();
      const UPDATE_INTERVAL = 60;

      for await (const chunk of stream) {
        if (chunk.content) assistantMessage.content += chunk.content;
        if (chunk.reasoning) assistantMessage.reasoning = (assistantMessage.reasoning || '') + chunk.reasoning;

        const now = Date.now();
        if (now - lastUpdate > UPDATE_INTERVAL) {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { ...assistantMessage };
            return next;
          });
          lastUpdate = now;
        }
      }

      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...assistantMessage };
        return next;
      });
      setIsLoading(false);

      await database.addMessage(
        db,
        Crypto.randomUUID(),
        conversationId,
        'assistant',
        assistantMessage.content,
        assistantMessage.reasoning
      );
    } catch (err) {
      console.error('Chat: Failed to send', err);
      setError(err instanceof Error ? err.message : 'FAILED_TO_FETCH_AI_RESPONSE');
      setIsLoading(false);
    }
  }, [db, conversationId, settings]);

  const clearChat = useCallback(() => {
    setMessages([]);
    offsetRef.current = 0;
    setHasMore(false);
  }, []);

  return { 
    messages, 
    isLoading, 
    isLoadingMore, 
    hasMore, 
    error, 
    sendMessage, 
    clearChat, 
    loadMore,
    refreshHistory: () => loadHistory(true) 
  };
};
