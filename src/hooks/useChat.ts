import { useState, useCallback, useEffect, useRef } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { Message } from "../types/chat";
import { openRouterClient } from "../services/openrouter";
import { database, DatabaseSettings } from "../services/database";
import * as Crypto from "expo-crypto";
import { attachmentService } from "../services/attachment";

const PAGE_SIZE = 20;

export const useChat = (conversationId: string | undefined, settings: DatabaseSettings) => {
  const db = useSQLiteContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationTitle, setConversationTitle] =
    useState<string>("LOADING_SESSION...");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const offsetRef = useRef(0);

  const loadHistory = useCallback(
    async (isInitial = true) => {
      if (!conversationId) return;
      if (isInitial) {
        setIsLoading(true);
        offsetRef.current = 0;
        try {
          const conv = await database.getConversationById(db, conversationId);
          if (conv) setConversationTitle(conv.title);
        } catch (e) {}
      } else setIsLoadingMore(true);

      try {
        const history = await database.getMessagesPaginated(
          db,
          conversationId,
          PAGE_SIZE,
          offsetRef.current,
        );
        const newMessages = (history as any[])
          .map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            reasoning: msg.reasoning,
            modelId: msg.model_id,
            attachment: msg.attachment_uri
              ? {
                  uri: msg.attachment_uri,
                  type: msg.attachment_type || "image/jpeg",
                }
              : undefined,
          }))
          .reverse();

        setMessages((prev) =>
          isInitial ? newMessages : [...newMessages, ...prev],
        );
        setHasMore(history.length === PAGE_SIZE);
        offsetRef.current += history.length;
      } catch (err) {
        setError("FAILED_TO_LOAD_HISTORY");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [db, conversationId],
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (
      content: string,
      attachment?: { uri: string; type: string; base64?: string },
      webSearch?: boolean,
    ) => {
      if (!content.trim() && !attachment) return;
      if (!conversationId) return;

      abortControllerRef.current = new AbortController();
      const userMsgId = Crypto.randomUUID();
      let finalAttachment = attachment;

      if (attachment && !attachment.base64) {
        const base64 = await attachmentService.getBase64(attachment.uri);
        if (base64) finalAttachment = { ...attachment, base64 };
      }

      const userMessage: Message = {
        id: userMsgId,
        role: "user",
        content: content.trim(),
        attachment: finalAttachment,
      };
      await database.addMessage(
        db,
        userMsgId,
        conversationId,
        "user",
        userMessage.content,
        undefined,
        finalAttachment?.uri,
        finalAttachment?.type,
      );

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      const assistantMsgId = Crypto.randomUUID();
      let assistantMessage: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        reasoning: "",
      };

      try {
        const fullContext = await database.getMessagesPaginated(
          db,
          conversationId,
          settings.context_length,
          0,
        );
        const historyForAI = await Promise.all(
          (fullContext as any[])
            .reverse()
            .map((m) => attachmentService.prepareMessageWithBase64(m)),
        );

        const stream = openRouterClient.sendMessageStreaming(
          historyForAI,
          settings,
          abortControllerRef.current.signal,
          webSearch,
        );
        setMessages((prev) => [...prev, assistantMessage]);

        let lastUpdate = Date.now();
        for await (const chunk of stream) {
          if (chunk.content) assistantMessage.content += chunk.content;
          if (chunk.reasoning)
            assistantMessage.reasoning =
              (assistantMessage.reasoning || "") + chunk.reasoning;

          if (Date.now() - lastUpdate >= 16) {
            setMessages((prev) => {
              const next = [...prev];
              const cleanContent = assistantMessage.content
                .replace(/\[\[TITLE: .*?\]\]/g, "")
                .replace(/\[\[TITLE: .*/g, "")
                .trim();
              next[next.length - 1] = {
                ...assistantMessage,
                content: cleanContent,
              };
              return next;
            });
            lastUpdate = Date.now();
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") setError(err.message || "AI_ERROR");
      } finally {
        setIsLoading(false);
        const titleMatch =
          assistantMessage.content.match(/\[\[TITLE: (.*?)\]\]/);
        assistantMessage.content = assistantMessage.content
          .replace(/\[\[TITLE: .*?\]\]/g, "")
          .trim();
        assistantMessage.modelId = settings.selected_model;

        if (
          titleMatch &&
          (conversationTitle === "LOADING_SESSION..." ||
            conversationTitle.startsWith("NEW_SESSION"))
        ) {
          await database.updateConversationTitle(
            db,
            conversationId,
            titleMatch[1].trim(),
          );
          setConversationTitle(titleMatch[1].trim());
        }

        if (assistantMessage.content || assistantMessage.reasoning) {
          await database.addMessage(
            db,
            assistantMsgId,
            conversationId,
            "assistant",
            assistantMessage.content,
            assistantMessage.reasoning,
            undefined,
            undefined,
            settings.selected_model,
          );
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { ...assistantMessage };
            return next;
          });
        }
      }
    },
    [db, conversationId, settings, conversationTitle],
  );

  useEffect(() => {
    loadHistory(true);
  }, [loadHistory]);

  return {
    messages,
    conversationTitle,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    sendMessage,
    stopStreaming,
    clearChat: () => setMessages([]),
    loadMore: () => !isLoadingMore && hasMore && loadHistory(false),
    refreshHistory: () => loadHistory(true),
  };
};
