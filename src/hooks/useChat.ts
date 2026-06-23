import { useState, useCallback, useEffect, useRef } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { Message } from "../types/chat";
import { StreamUpdate, ToolCall } from "../types/tools";
import { openRouterClient } from "../services/openrouter";
import { database, DatabaseSettings } from "../services/database";
import * as Crypto from "expo-crypto";
import { attachmentService } from "../services/attachment";
import { openCodeZenService, mapModelForOpenCode } from "../services/openCodeZenService";
import { INTERNAL_SYSTEM_PROMPT } from "../constants/prompts";
import { IdeMessage } from "../types/ide";
import { useIDEState } from "./useIDEState";
import { getToolSystemPrompt } from "../services/tools";

const PAGE_SIZE = 10;
const MAX_AI_HISTORY = 25;
const MAX_MESSAGE_CHARS = 16000;

const truncateMessage = (content: string, maxChars: number = MAX_MESSAGE_CHARS): string => {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars) + "\n\n[...content truncated for context...]";
};

function buildSessionSummary(
  messages: any[],
  openFiles: { path: string; content: string; originalContent: string }[],
): string {
  const oldestFirst = [...messages].reverse();
  const goal = oldestFirst.find((m) => m.role === "user")?.content?.slice(0, 300) || "";
  const readFiles = new Set<string>();
  const modifiedFiles = new Set<string>();
  let lastReasoning = "";

  for (const m of messages) {
    const c = m.content || "";
    if (c.startsWith("[TOOL_RESULT: read]")) {
      const line = c.split("\n")[0];
      const match = line.match(/\[TOOL_RESULT: read\]\n?File:\s*(.+)/);
      if (match) readFiles.add(match[1].trim());
      else readFiles.add(c.slice(0, 80));
    }
    if (c.startsWith("[TOOL_RESULT: edit]")) {
      const match = c.match(/Edited (.+)/);
      if (match) modifiedFiles.add(match[1].trim());
    }
    if (c.startsWith("[TOOL_RESULT: create]")) {
      const match = c.match(/Created file (.+)/);
      if (match) modifiedFiles.add(match[1].trim());
    }
    if (m.role === "assistant" && !c.startsWith("[TOOL_CALL:") && c.length > lastReasoning.length) {
      lastReasoning = c;
    }
  }

  const currentlyModified = openFiles
    .filter((f) => f.content !== f.originalContent)
    .map((f) => f.path);

  const parts: string[] = [
    "=== SESSION STATE ===",
    "",
    `Goal: ${goal}`,
    "",
  ];
  if (readFiles.size > 0) parts.push(`Files read: ${[...readFiles].join(", ")}`);
  if (modifiedFiles.size > 0) parts.push(`Files modified: ${[...modifiedFiles].join(", ")}`);
  if (currentlyModified.length > 0) parts.push(`Unpushed changes: ${currentlyModified.join(", ")}`);
  if (lastReasoning) parts.push(`\nLast analysis: ${lastReasoning.slice(0, 500)}`);

  return parts.join("\n");
}

const formatToolCallsForDisplay = (toolCalls: ToolCall[]): string => {
  return toolCalls
    .map((tc) => {
      const parsed = (() => {
        try {
          return JSON.parse(tc.function.arguments);
        } catch {
          return {};
        }
      })();
      const base = `[TOOL_CALL: ${tc.function.name}]`;
      const details: string[] = [];
      if (parsed.file_path) details.push(`file: ${parsed.file_path}`);
      if (parsed.offset) details.push(`offset: ${parsed.offset}`);
      if (parsed.limit) details.push(`limit: ${parsed.limit}`);
      if (parsed.pattern) details.push(`pattern: ${parsed.pattern}`);
      if (parsed.include) details.push(`include: ${parsed.include}`);
      if (tc.function.name === "edit") {
        details.push(`--- old:`);
        details.push(...(parsed.old_string || "").split("\n"));
        details.push(`+++ new:`);
        details.push(...(parsed.new_string || "").split("\n"));
      }
      return `${base}\n${details.join("\n")}`;
    })
    .join("\n---\n");
};

const getWorkspaceContext = (
  selectedRepo: any,
  fileTree: any[],
  activeFile: string | null,
  openFiles: any[],
) => {
  if (!selectedRepo) return "";

  const treeText = fileTree.map((f) => `- ${f.path}`).join("\n");
  const currentFile = openFiles.find((f) => f.path === activeFile);
  const activeFileContentText = currentFile ? currentFile.content : "";

  return `
[WORKSPACE_CONTEXT]
Current Active Repository: ${selectedRepo.owner?.login}/${selectedRepo.name}
Repository: ${selectedRepo.name}

Repository Files:
${treeText}

${activeFile ? `Active Open File: ${activeFile}\nContent:\n${activeFileContentText}` : "No file is currently open in the editor."}`;
};

export const useChat = (conversationId: string | undefined, settings: DatabaseSettings) => {
  const db = useSQLiteContext();
  const { selectedRepo, fileTree, activeFile, openFiles } = useIDEState();
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
        setError(null); // Reset any previous conversation errors immediately!
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
          .map((m) => ({
            id: m.id, role: m.role, content: m.content, reasoning: m.reasoning, modelId: m.model_id,
            attachment: m.attachment_uri ? { uri: m.attachment_uri, type: m.attachment_type || "image/jpeg" } : undefined
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
      silent?: boolean,
    ): Promise<{ content: string; messageId: string; tool_calls?: ToolCall[] }> => {
      if (!content.trim() && !attachment) return { content: "", messageId: "" };
      if (!conversationId) return { content: "", messageId: "" };

      console.log(`[sendMessage] >>> REQUEST model="${settings.selected_model}" provider="${settings.ai_provider}" silent=${!!silent} content="${content.slice(0, 80)}..."`);

      abortControllerRef.current = new AbortController();
      const userMsgId = Crypto.randomUUID();
      let finalAttachment = attachment;

      if (attachment && !attachment.base64) {
        const base64 = await attachmentService.getBase64(attachment.uri);
        if (base64) finalAttachment = { ...attachment, base64 };
      }

      const userMessage: Message = { id: userMsgId, role: "user", content: content.trim(), attachment: finalAttachment };
      
      if (!silent) {
        await database.addMessage(db, userMsgId, conversationId, "user", userMessage.content, undefined, finalAttachment?.uri, finalAttachment?.type);
        setMessages((prev) => [...prev, userMessage]);
      } else {
        // Still save the user message to DB when silent (tool loop needs it in history)
        await database.addMessage(db, userMsgId, conversationId, "user", userMessage.content, undefined, finalAttachment?.uri, finalAttachment?.type);
      }
      setIsLoading(true);
      setError(null);

      const assistantMsgId = Crypto.randomUUID();
      let assistantMessage: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        reasoning: "",
        modelId: settings.selected_model,
      };
      let pendingToolCalls: ToolCall[] = [];

      try {
        const historyLimit = Math.max(settings.context_length, MAX_AI_HISTORY);
        const fullContext = await database.getMessagesPaginated(
          db,
          conversationId,
          historyLimit,
          0,
        );

        // Compact history before expensive base64 conversion
        const compactedRaw = (fullContext as any[])
          .reverse()
          .filter((m) => m.role !== "system");

        const historyForAI = compactedRaw.length > MAX_AI_HISTORY
          ? await (async () => {
              const summary = buildSessionSummary(compactedRaw, openFiles);
              const kept = compactedRaw.slice(0, MAX_AI_HISTORY - 1);
              return [
                { role: "user" as const, content: `[SESSION_STATE]\n${summary}` },
                ...kept,
              ];
            })()
          : compactedRaw;

        const preparedHistory = (await Promise.all(
          historyForAI.map((m) => attachmentService.prepareMessageWithBase64(m)),
        )).map((m: any) => ({ ...m, content: truncateMessage(m.content) }));

        const workspaceContext = getWorkspaceContext(selectedRepo, fileTree, activeFile, openFiles);
        const basePrompt = settings.system_prompt || INTERNAL_SYSTEM_PROMPT;
        const toolPrompt = getToolSystemPrompt();
        const systemPrompt = workspaceContext
          ? `${basePrompt}\n${workspaceContext}\n${toolPrompt}`
          : `${basePrompt}\n${toolPrompt}`;

        const useOpenCode = settings.ai_provider === "opencode";
        const opencodeKey = settings.opencode_api_key || process.env.EXPO_PUBLIC_OPENCODE_API_KEY || "";

        let stream;
        if (useOpenCode && opencodeKey) {
          const mappedModel = mapModelForOpenCode(settings.selected_model);
          console.log(`[sendMessage] >>> OpenCode provider="${settings.ai_provider}" mappedModel="${mappedModel}" historyMsgCount=${preparedHistory.length}`);
          const systemMsg: IdeMessage = {
            id: "system",
            role: "system",
            content: systemPrompt,
          };
          const formattedHistory: IdeMessage[] = preparedHistory.map((m) => ({
            id: m.id || Crypto.randomUUID(),
            role: m.role,
            content: m.content,
            tool_call_id: m.role === "tool" ? (m as any).tool_call_id : undefined,
          }));
          stream = openCodeZenService.streamCompletion(
            [systemMsg, ...formattedHistory],
            opencodeKey,
            mappedModel,
            abortControllerRef.current.signal,
          );
        } else {
          console.log(`[sendMessage] >>> OpenRouter model="${settings.selected_model}" historyMsgCount=${preparedHistory.length}`);
          stream = openRouterClient.sendMessageStreaming(
            preparedHistory,
            settings,
            abortControllerRef.current.signal,
            webSearch,
            systemPrompt,
          );
        }

        // Always add assistant placeholder (even when silent) so the finally block can update it
        setMessages((prev) => [...prev, assistantMessage]);

        let lastUpdate = Date.now();
        for await (const chunk of stream) {
          if (chunk.content) assistantMessage.content += chunk.content;
          if (chunk.reasoning)
            assistantMessage.reasoning =
              (assistantMessage.reasoning || "") + chunk.reasoning;
          if (chunk.tool_calls) {
            pendingToolCalls = chunk.tool_calls;
          }

          if (!silent && Date.now() - lastUpdate >= 16) {
            setMessages((prev) => {
              const next = [...prev];
              const cleanContent = assistantMessage.content
                .replace(/\[\[TITLE: .*?\]\]/g, "")
                .replace(/\[\[TITLE: .*/g, "")
                .trim();
              next[next.length - 1] = {
                ...assistantMessage,
                content: cleanContent,
                reasoning: assistantMessage.reasoning,
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

        if (titleMatch && (conversationTitle === "LOADING_SESSION..." || conversationTitle.startsWith("NEW_SESSION"))) {
          await database.updateConversationTitle(db, conversationId, titleMatch[1].trim());
          setConversationTitle(titleMatch[1].trim());
        }

        if (pendingToolCalls.length > 0) {
          const toolCallText = assistantMessage.content
            ? `${assistantMessage.content}\n\n${formatToolCallsForDisplay(pendingToolCalls)}`
            : formatToolCallsForDisplay(pendingToolCalls);
          assistantMessage.content = toolCallText;
          await database.addMessage(db, assistantMsgId, conversationId, "assistant", assistantMessage.content, assistantMessage.reasoning, undefined, undefined, settings.selected_model);
          setMessages((p) => { const n = [...p]; n[n.length - 1] = { ...assistantMessage }; return n; });
        } else if (assistantMessage.content || assistantMessage.reasoning) {
          await database.addMessage(db, assistantMsgId, conversationId, "assistant", assistantMessage.content, assistantMessage.reasoning, undefined, undefined, settings.selected_model);
          setMessages((p) => { const n = [...p]; n[n.length - 1] = { ...assistantMessage }; return n; });
        }
      }
      const finalContent = assistantMessage.content;
      const finalToolCalls = pendingToolCalls.length > 0 ? pendingToolCalls : undefined;
      console.log(`[sendMessage] <<< DONE contentLen=${finalContent.length} tool_calls=${finalToolCalls?.length || 0} model="${settings.selected_model}"`);
      return { content: finalContent, messageId: assistantMsgId, tool_calls: finalToolCalls };
    },
    [db, conversationId, settings, conversationTitle, selectedRepo, fileTree, activeFile, openFiles],
  );

  useEffect(() => {
    loadHistory(true);
  }, [loadHistory]);

  return {
    messages,
    setMessages,
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
