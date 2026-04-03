import { Message } from '../types/chat';
import EventSource from 'react-native-sse';
import { DatabaseSettings } from './database';
import { INTERNAL_SYSTEM_PROMPT } from '../constants/prompts';

export interface StreamUpdate {
  content?: string;
  reasoning?: string;
  done?: boolean;
}

const OPENROUTER_URL = process.env.EXPO_PUBLIC_OPENROUTER_URL || '';
export const openRouterClient = {
  async *sendMessageStreaming(
    history: Message[],
    settings: DatabaseSettings,
    signal?: AbortSignal,
    webSearch?: boolean
  ): AsyncGenerator<StreamUpdate> {
    const { api_key, selected_model, max_tokens, temperature } = settings;
    
    if (!api_key) throw new Error('API_KEY_NOT_SET');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${api_key}`,
      'HTTP-Referer': 'https://elcom.cli',
      'X-Title': 'ElcomCLI',
    };

    const formattedMessages = history.map((msg, idx) => {
      let content = msg.content;
      // Force search instruction for the latest user message
      if (webSearch && idx === history.length - 1 && msg.role === 'user') {
        content = `${content}\n\n[SYSTEM: WEB_SEARCH_ENABLED. Use the openrouter:web_search tool to find real-time data for this specific query.]`;
      }

      if (!msg.attachment) return { role: msg.role, content };
      
      const contentParts: any[] = [{ type: 'text', text: content || '' }];
      if (msg.attachment.type.startsWith('image/')) {
        contentParts.push({
          type: 'image_url',
          image_url: { url: `data:${msg.attachment.type};base64,${msg.attachment.base64}` }
        });
      } else if (msg.attachment.type === 'application/pdf') {
        contentParts.push({
          type: 'file',
          file: { url: `data:application/pdf;base64,${msg.attachment.base64}` }
        });
      }
      return { role: msg.role, content: contentParts };
    });

    const body: any = {
      model: selected_model || 'qwen/qwen3.6-plus:free',
      messages: [{ role: 'system', content: INTERNAL_SYSTEM_PROMPT }, ...formattedMessages],
      stream: true,
      max_tokens,
      temperature,
    };

    if (webSearch) {
      body.tools = [{ type: 'openrouter:web_search' }];
      body.tool_choice = 'auto';
    }

    const es = new EventSource(OPENROUTER_URL, { method: 'POST', headers, body: JSON.stringify(body) });
    const queue: (StreamUpdate | Error)[] = [];
    let resolveNext: ((value: void) => void) | null = null;

    let searchingReported = false;
    const onMessage = (event: any) => {
      try {
        if (event.data === '[DONE]') {
          queue.push({ done: true });
        } else {
          const parsed = JSON.parse(event.data || '{}');
          const delta = parsed.choices?.[0]?.delta;
          if (delta) {
            // Handle content, reasoning and tool calls (search results synthesized by OR)
            if (delta.content || delta.reasoning || delta.thought) {
              queue.push({ 
                content: delta.content, 
                reasoning: delta.reasoning || delta.thought 
              });
            } else if (delta.tool_calls && !searchingReported) {
              searchingReported = true;
              // Signal search activity
              queue.push({ content: ' // SEARCHING_WEB...\n' });
            }
          }
        }
      } catch (e) {
        // Silently skip parse errors which often happen mid-stream
      }
      resolveNext?.();
    };

    const onError = (event: any) => {
      console.error('SSE Error:', event);
      queue.push(new Error('SSE_STREAM_FAILED'));
      resolveNext?.();
    };

    es.addEventListener('message', onMessage);
    es.addEventListener('error', onError);

    if (signal) {
      signal.addEventListener('abort', () => {
        es.close();
        queue.push({ done: true });
        resolveNext?.();
      });
    }

    try {
      while (true) {
        if (queue.length === 0) {
          await new Promise<void>((resolve) => { resolveNext = resolve; });
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
      es.removeEventListener('message', onMessage);
      es.removeEventListener('error', onError);
      es.close();
    }
  },
};
