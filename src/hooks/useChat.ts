import { useState, useCallback, useEffect, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Message, ChatState } from '../types/chat';
import { openRouterClient } from '../services/openrouter';
import { database } from '../services/database';
import { useSettings } from './useSettings';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';

const PAGE_SIZE = 20;

export const useChat = (conversationId?: string) => {
  const db = useSQLiteContext();
  const { settings } = useSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationTitle, setConversationTitle] = useState<string>('LOADING_SESSION...');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const offsetRef = useRef(0);
  const [modelId, setModelId] = useState<string | null>(null);

  const loadHistory = useCallback(async (isInitial = true) => {
    if (!conversationId) return;
    
    if (isInitial) {
      setIsLoading(true);
      offsetRef.current = 0;
      // Load conversation info (title)
      try {
        const conv = await database.getConversationById(db, conversationId);
        if (conv) {
          setConversationTitle(conv.title);
          setModelId(conv.model_id);
        }
      } catch (e) {}
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

      const newMessages = (history as any[]).map(msg => ({
        id: msg.id,
        role: msg.role as any,
        content: msg.content,
        reasoning: msg.reasoning,
        modelId: msg.model_id,
        attachment: msg.attachment_uri ? {
          uri: msg.attachment_uri,
          type: msg.attachment_type || 'image/jpeg'
        } : undefined
      })).reverse();
      
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

  const stopStreaming = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    await loadHistory(false);
  }, [isLoadingMore, hasMore, loadHistory]);

  const sendMessage = useCallback(async (content: string, attachment?: { uri: string, type: string, base64?: string }, webSearch?: boolean) => {
    if (!content.trim() && !attachment) return;
    if (!conversationId) return;

    abortControllerRef.current = new AbortController();
    const userMsgId = Crypto.randomUUID();
    
    let finalAttachment = attachment;
    if (attachment && !attachment.base64) {
      try {
        const base64 = await (FileSystem as any).readAsStringAsync(attachment.uri, { encoding: 'base64' });
        finalAttachment = { ...attachment, base64 };
      } catch (e) {
        console.error('useChat: Failed to read attachment', e);
      }
    }

    const userMessage: Message = { 
      id: userMsgId,
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

    const assistantMsgId = Crypto.randomUUID();
    let assistantMessage: Message = { 
      id: assistantMsgId, 
      role: 'assistant', 
      content: '', 
      reasoning: '' 
    };
    
    const isFirstExchange = messages.length === 0;

    try {
      const fullContext = await database.getMessagesPaginated(db, conversationId, settings.context_length, 0);
      const historyFromDb = (fullContext as any[]).reverse();
      
      // Crucial: Load base64 for vision messages in history
      const historyForAI: Message[] = await Promise.all(historyFromDb.map(async (msg) => {
        const message: Message = {
          id: msg.id,
          role: msg.role as any,
          content: msg.content,
          reasoning: msg.reasoning
        };
        
        if (msg.attachment_uri) {
          try {
            const base64 = await (FileSystem as any).readAsStringAsync(msg.attachment_uri, { encoding: 'base64' });
            message.attachment = {
              uri: msg.attachment_uri,
              type: msg.attachment_type || 'image/jpeg',
              base64
            };
          } catch (e) {
            console.error('prepareHistoryForAI: Load failed', msg.attachment_uri, e);
          }
        }
        return message;
      }));
      
      const stream = openRouterClient.sendMessageStreaming(
        historyForAI, 
        settings, 
        abortControllerRef.current.signal,
        webSearch
      );
      
      setMessages((prev) => [...prev, assistantMessage]);

      const UPDATE_INTERVAL = 16; // Much faster updates for smooth streaming
      let lastUpdate = Date.now();

      for await (const chunk of stream) {
        if (chunk.content) assistantMessage.content += chunk.content;
        if (chunk.reasoning) assistantMessage.reasoning = (assistantMessage.reasoning || '') + chunk.reasoning;

        const now = Date.now();
        if (now - lastUpdate >= UPDATE_INTERVAL) {
          setMessages((prev) => {
            const next = [...prev];
            // Hide the title tag visually even during streaming
            const displayContent = assistantMessage.content.replace(/\[\[TITLE: .*?\]\]/g, '').replace(/\[\[TITLE: .*/g, '').trim();
            next[next.length - 1] = { ...assistantMessage, content: displayContent };
            return next;
          });
          lastUpdate = now;
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        console.error('Chat: Failed to send', err);
        setError(err instanceof Error ? err.message : 'FAILED_TO_FETCH_AI_RESPONSE');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      
      // Post-stream processing: ALWAYS clean and extract info
      const titleMatch = assistantMessage.content.match(/\[\[TITLE: (.*?)\]\]/);
      // Clean content from any title tags
      assistantMessage.content = assistantMessage.content.replace(/\[\[TITLE: .*?\]\]/g, '').trim();
      assistantMessage.modelId = settings.selected_model;

      const isStillDefault = conversationTitle === 'LOADING_SESSION...' || conversationTitle.startsWith('NEW_SESSION');
      const aiTitle = titleMatch ? titleMatch[1].trim() : null;

      if (aiTitle && isStillDefault) {
        await database.updateConversationTitle(db, conversationId, aiTitle);
        setConversationTitle(aiTitle);
      }

      // Save valid content to database
      if (assistantMessage.content || assistantMessage.reasoning) {
        await database.addMessage(
          db,
          assistantMsgId,
          conversationId,
          'assistant',
          assistantMessage.content,
          assistantMessage.reasoning,
          undefined,
          undefined,
          settings.selected_model
        );
        
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...assistantMessage };
          return next;
        });
      }
    }
  }, [db, conversationId, settings, messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    offsetRef.current = 0;
    setHasMore(false);
  }, []);

  useEffect(() => {
    loadHistory(true);
    return () => {
      // We don't auto-abort anymore to allow background streaming
      // only abort if the entire hook instance is destroyed and we strictly want to cleanup
      // but for persistent ChatScreen, we stay alive.
    };
  }, [loadHistory]);

  return { 
    messages, 
    conversationTitle,
    modelId,
    isLoading, 
    isLoadingMore, 
    hasMore, 
    error, 
    sendMessage, 
    stopStreaming,
    clearChat, 
    loadMore,
    refreshHistory: () => loadHistory(true) 
  };
};
