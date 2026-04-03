import { storage } from './storage';
import { Message } from '../types/chat';
import EventSource from 'react-native-sse';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'qwen/qwen3.6-plus:free';

export interface StreamUpdate {
  content?: string;
  reasoning?: string;
  done?: boolean;
}

export const openRouterClient = {
  async *sendMessageStreaming(history: Message[]): AsyncGenerator<StreamUpdate> {
    const apiKey = await storage.getApiKey();
    if (!apiKey) throw new Error('API_KEY_NOT_SET');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://elcomlab.site',
      'X-Title': 'ElcomCLI',
    };

    const body = {
      model: DEFAULT_MODEL,
      messages: history.map(({ role, content }) => ({ role, content })),
      stream: true,
      reasoning: { enabled: true },
    };

    const es = new EventSource(OPENROUTER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    try {
      while (true) {
        const result = await new Promise<StreamUpdate | Error>((resolve) => {
          es.addEventListener('message', (event) => {
            if (event.data === '[DONE]') {
              resolve({ done: true });
              return;
            }
            try {
              const parsed = JSON.parse(event.data || '{}');
              const delta = parsed.choices?.[0]?.delta;
              if (delta) {
                resolve({ 
                  content: delta.content, 
                  reasoning: delta.reasoning || delta.thought 
                });
              }
            } catch (e) {
              // Ignore partial JSON
            }
          });

          es.addEventListener('error', (event) => {
            resolve(new Error('SSE_STREAM_FAILED'));
          });
        });

        if (result instanceof Error) throw result;
        yield result;
        if (result.done) break;
      }
    } finally {
      es.close();
    }
  },
};
