import { useState, useCallback, useRef } from "react";
import { IdeMessage, FileNode } from "../types/ide";
import { openCodeZenService, mapModelForOpenCode } from "../services/openCodeZenService";
import { openRouterClient } from "../services/openrouter";
import { DatabaseSettings } from "../services/database";
import { Message } from "../types/chat";

export interface ReplaceBlock {
  file: string;
  oldCode: string;
  newCode: string;
}

export const parseReplaceBlocks = (text: string): ReplaceBlock[] => {
  const blocks: ReplaceBlock[] = [];
  const regex =
    /<str_replace>\s*<file>([\s\S]*?)<\/file>\s*<old>([\s\S]*?)<\/old>\s*<new>([\s\S]*?)<\/new>\s*<\/str_replace>/g;
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      file: match[1].trim(),
      oldCode: match[2],
      newCode: match[3],
    });
  }
  return blocks;
};

export const useAIAgent = () => {
  const [messages, setMessages] = useState<IdeMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getSystemPrompt = useCallback((fileTree: FileNode[], activeFilePath: string | null, activeFileContent: string | null): string => {
    const treeText = fileTree.map((f) => `- ${f.path}`).join("\n");
    return `[SYSTEM] Expert AI Software Engineer. Workspace structure:
${treeText}
${activeFilePath ? `Open file: ${activeFilePath}\nContent:\n${activeFileContent}` : "No open file."}

Modify files using:
<str_replace>
<file>relative/path</file>
<old>exact old code</old>
<new>new code</new>
</str_replace>
Reply ONLY with <str_replace> blocks. No chat, no markdown, no other text.`;
  }, []);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (
      userPrompt: string,
      settings: DatabaseSettings,
      fileTree: FileNode[],
      activeFilePath: string | null,
      activeFileContent: string | null,
      onStreamUpdate?: (content: string) => void,
    ): Promise<ReplaceBlock[]> => {
      setIsStreaming(true);
      setError(null);
      abortControllerRef.current = new AbortController();

      const userMsg: IdeMessage = {
        id: Math.random().toString(36).substring(7),
        role: "user",
        content: userPrompt,
      };

      const updatedHistory = [...messages, userMsg];
      setMessages(updatedHistory);

      let fullAssistantContent = "";
      const opencodeKey = settings.opencode_api_key || process.env.EXPO_PUBLIC_OPENCODE_API_KEY || "";
      const useOpenRouter = !opencodeKey && !!settings.api_key;

      try {
        if (useOpenRouter) {
          const formattedHistory: Message[] = updatedHistory.map((m) => ({
            role: m.role as "user" | "assistant" | "system",
            content: m.content,
          }));
          const systemPrompt = getSystemPrompt(fileTree, activeFilePath, activeFileContent);
          const stream = openRouterClient.sendMessageStreaming(
            formattedHistory,
            settings,
            abortControllerRef.current.signal,
            false,
            systemPrompt,
          );

          for await (const chunk of stream) {
            if (chunk.content) {
              fullAssistantContent += chunk.content;
              if (onStreamUpdate) {
                onStreamUpdate(fullAssistantContent);
              }
            }
          }
        } else {
          const systemMsg: IdeMessage = {
            id: "system",
            role: "system",
            content: getSystemPrompt(fileTree, activeFilePath, activeFileContent),
          };
          const requestMessages = [systemMsg, ...updatedHistory];
          const stream = openCodeZenService.streamCompletion(
            requestMessages,
            opencodeKey,
            mapModelForOpenCode(settings.selected_model),
            abortControllerRef.current.signal,
          );

          for await (const chunk of stream) {
            if (chunk.content) {
              fullAssistantContent += chunk.content;
              if (onStreamUpdate) {
                onStreamUpdate(fullAssistantContent);
              }
            }
          }
        }

        const assistantMsg: IdeMessage = {
          id: Math.random().toString(36).substring(7),
          role: "assistant",
          content: fullAssistantContent,
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Parse modifications
        return parseReplaceBlocks(fullAssistantContent);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          const errMsg = err.message || "AI_AGENT_ERROR";
          setError(errMsg);
          throw new Error(errMsg);
        }
        return [];
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, getSystemPrompt],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearChat,
  };
};
