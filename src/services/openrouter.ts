import { Message } from "../types/chat";
import { StreamUpdate, ToolCall } from "../types/tools";
import { TOOL_DEFINITIONS } from "./tools";
import EventSource from "react-native-sse";
import { DatabaseSettings } from "./database";
import { INTERNAL_SYSTEM_PROMPT } from "../constants/prompts";

import { env } from "./env";

const OPENROUTER_URL = env.EXPO_PUBLIC_OPENROUTER_URL;

export const openRouterClient = {
  async *sendMessageStreaming(
    history: Message[],
    settings: DatabaseSettings,
    signal?: AbortSignal,
    webSearch?: boolean,
    customSystemPrompt?: string,
  ): AsyncGenerator<StreamUpdate> {
    console.log(`[openRouter.sendMessageStreaming] >>> HTTP POST model="${settings.selected_model}" msgCount=${history.length} webSearch=${!!webSearch}`);
    const { api_key, selected_model, max_tokens, temperature } = settings;

    if (!api_key) throw new Error("API_KEY_NOT_SET");

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${api_key}`,
      "HTTP-Referer": "https://elcom.cli",
      "X-Title": "ElcomCLI",
    };

    const formattedMessages = history.map((msg, idx) => {
      let content = msg.content;
      if (webSearch && idx === history.length - 1 && msg.role === "user") {
        content = `${content}\n\n[SYSTEM: WEB_SEARCH_ENABLED. Use the openrouter:web_search tool to find real-time data for this specific query.]`;
      }

      if (!msg.attachment) return { role: msg.role, content };

      const contentParts: any[] = [{ type: "text", text: content || "" }];
      if (msg.attachment.type.startsWith("image/")) {
        const b64Length = msg.attachment.base64?.length || 0;
        console.log(`[ElcomCLI/API] Attaching image: uri=${msg.attachment.uri}, type=${msg.attachment.type}, base64Length=${b64Length} chars`);
        if (b64Length === 0) {
          console.warn("[ElcomCLI/API] Warning: Image base64 data is empty or undefined!");
        }
        contentParts.push({
          type: "image_url",
          image_url: {
            url: `data:${msg.attachment.type};base64,${msg.attachment.base64 || ""}`,
          },
        });
      } else if (msg.attachment.type === "application/pdf") {
        const b64Length = msg.attachment.base64?.length || 0;
        console.log(`[ElcomCLI/API] Attaching PDF: uri=${msg.attachment.uri}, type=${msg.attachment.type}, base64Length=${b64Length} chars`);
        if (b64Length === 0) {
          console.warn("[ElcomCLI/API] Warning: PDF base64 data is empty or undefined!");
        }
        contentParts.push({
          type: "file",
          file: { url: `data:application/pdf;base64,${msg.attachment.base64 || ""}` },
        });
      }
      return { role: msg.role, content: contentParts };
    });

    const body: any = {
      model: selected_model || "qwen/qwen3.6-plus:free",
      messages: [
        {
          role: "system",
          content: customSystemPrompt || INTERNAL_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
        ...formattedMessages,
      ],
      stream: true,
      max_tokens,
      temperature,
      tools: TOOL_DEFINITIONS,
      tool_choice: "auto",
    };

    if (webSearch) {
      body.tools = [...TOOL_DEFINITIONS, { type: "openrouter:web_search" }];
    }

    const es = new EventSource(OPENROUTER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const queue: (StreamUpdate | Error)[] = [];
    let resolveNext: ((value: void) => void) | null = null;
    const accumulatedCalls = new Map<string, ToolCall>();

    const onMessage = (event: any) => {
      try {
        if (event.data === "[DONE]") {
          queue.push({ done: true });
        } else {
          const parsed = JSON.parse(event.data || "{}");
          const delta = parsed.choices?.[0]?.delta;
          if (delta) {
            if (delta.content || delta.reasoning || delta.thought) {
              const rText = delta.reasoning || delta.thought;
              queue.push({
                content: delta.content,
                reasoning: rText,
              });
            }

            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.id) {
                  if (!accumulatedCalls.has(tc.id)) {
                    accumulatedCalls.set(tc.id, {
                      id: tc.id,
                      type: "function",
                      function: { name: tc.function?.name || "", arguments: tc.function?.arguments || "" },
                    });
                  }
                } else {
                  const lastCall = [...accumulatedCalls.values()].pop();
                  if (lastCall && tc.function?.arguments) {
                    lastCall.function.arguments += tc.function.arguments;
                  }
                }
              }
            }
          }

          const finishReason = parsed.choices?.[0]?.finish_reason;
          if (finishReason === "tool_calls" && accumulatedCalls.size > 0) {
            queue.push({ tool_calls: [...accumulatedCalls.values()] });
            accumulatedCalls.clear();
          }
        }
      } catch (e) {}
      resolveNext?.();
    };

    const onError = (event: any) => {
      let errorMsg = "CONNECTION_FAILED_OR_TIMEOUT";
      try {
        if (event.message) {
          const parsed = JSON.parse(event.message);
          if (parsed.error?.metadata?.raw) {
            try {
              const rawParsed = JSON.parse(parsed.error.metadata.raw);
              errorMsg = rawParsed.error?.message || parsed.error.metadata.raw;
            } catch (e) {
              errorMsg = parsed.error.metadata.raw;
            }
          } else if (parsed.error?.message) {
            errorMsg = parsed.error.message;
          }
        } else if (event.type === "error" && event.xhrStatus) {
          errorMsg = `HTTP_ERROR_${event.xhrStatus}`;
        }
      } catch (e) {}
      console.error("SSE Error Parsed:", errorMsg);
      queue.push(new Error(errorMsg));
      resolveNext?.();
    };

    es.addEventListener("message", onMessage);
    es.addEventListener("error", onError);

    if (signal) {
      signal.addEventListener("abort", () => {
        es.close();
        queue.push({ done: true });
        resolveNext?.();
      });
    }

    try {
      while (true) {
        if (queue.length === 0) {
          await new Promise<void>((resolve) => {
            resolveNext = resolve;
          });
          resolveNext = null;
        }

        while (queue.length > 0) {
          const item = queue.shift()!;
          if (item instanceof Error) throw item;
          yield item;
          if (item.done) return;
        }

        if (signal?.aborted) break;
      }
    } finally {
      console.log(`[openRouter.sendMessageStreaming] <<< DONE model="${settings.selected_model}"`);
      es.removeEventListener("message", onMessage);
      es.removeEventListener("error", onError);
      es.close();
    }
  },
};
