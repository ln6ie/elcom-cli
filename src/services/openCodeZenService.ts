import EventSource from "react-native-sse";
import { IdeMessage } from "../types/ide";
import { StreamUpdate, ToolCall } from "../types/tools";
import { TOOL_DEFINITIONS } from "./tools";

const OPENCODE_ZEN_URL = "https://opencode.ai/zen/v1/chat/completions";

export const openCodeZenService = {
  async *streamCompletion(
    messages: IdeMessage[],
    apiKey: string,
    model: string = "deepseek-v4-flash-free",
    signal?: AbortSignal,
  ): AsyncGenerator<StreamUpdate> {
    console.log(`[openCodeZenService.streamCompletion] >>> HTTP POST model="${model}" msgCount=${messages.length}`);
    const cleanKey = apiKey.trim().replace(/^["']|["']$/g, "").trim();
    if (!cleanKey) {
      throw new Error("OPENCODE_API_KEY_NOT_SET");
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cleanKey}`,
    };

    const body = {
      model,
      messages: messages.map((m) => {
        if (m.role === "tool") {
          return { role: "tool" as const, tool_call_id: m.tool_call_id || "", content: m.content };
        }
        if (m.role === "assistant" && m.tool_calls_json) {
          const toolCalls = JSON.parse(m.tool_calls_json);
          return { role: "assistant" as const, content: m.content, tool_calls: toolCalls };
        }
        return { role: m.role, content: m.content } as { role: string; content: string };
      }),
      stream: true,
      tools: TOOL_DEFINITIONS,
      tool_choice: "auto",
    };

    const es = new EventSource(OPENCODE_ZEN_URL, {
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
            if (delta.content) {
              queue.push({ content: delta.content });
            }

            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.id) {
                  accumulatedCalls.set(tc.id, {
                    id: tc.id,
                    type: "function",
                    function: { name: tc.function?.name || "", arguments: tc.function?.arguments || "" },
                  });
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
      let errorMsg = "OPENCODE_CONNECTION_FAILED";
      try {
        if (event.message) {
          const parsed = JSON.parse(event.message);
          errorMsg = parsed.error?.message || event.message;
        } else if (event.type === "error" && event.xhrStatus) {
          errorMsg = `HTTP_ERROR_${event.xhrStatus}`;
        }
      } catch (e) {}
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
      console.log(`[openCodeZenService.streamCompletion] <<< DONE model="${model}"`);
      es.removeEventListener("message", onMessage);
      es.removeEventListener("error", onError);
      es.close();
    }
  },
};

export const mapModelForOpenCode = (modelId: string): string => {
  if (modelId === "openrouter/free") return "deepseek-v4-flash-free";
  const parts = modelId.split("/");
  const modelName = parts[parts.length - 1];
  const cleanName = modelName.replace(":free", "");
  if (modelId.includes(":free")) {
    return `${cleanName}-free`;
  }
  return cleanName;
};
