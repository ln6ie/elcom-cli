import { Message } from '../types/chat';
import EventSource from 'react-native-sse';
import { DatabaseSettings } from './database';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface StreamUpdate {
  content?: string;
  reasoning?: string;
  done?: boolean;
}

export const openRouterClient = {
  async *sendMessageStreaming(
    history: Message[],
    settings: DatabaseSettings
  ): AsyncGenerator<StreamUpdate> {
    const { api_key, selected_model, system_prompt, max_tokens, temperature } = settings;
    const apiUrl = process.env.EXPO_PUBLIC_OPENROUTER_URL || '';
    
    if (!api_key) throw new Error('API_KEY_NOT_SET');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${api_key}`,
      'HTTP-Referer': 'https://elcomlab.site',
      'X-Title': 'ElcomCLI',
    };

    // Prepend system prompt to context
    const formattedMessages = history.map((msg, index) => {
      // Handle attachment in the last user message
      if (index === history.length - 1 && msg.attachment) {
        return {
          role: msg.role,
          content: [
            { type: 'text', text: msg.content },
            { 
              type: 'image_url', 
              image_url: { url: `data:${msg.attachment.type}/jpeg;base64,${msg.attachment.base64}` } 
            }
          ]
        };
      }
      return { role: msg.role, content: msg.content };
    });

    const messages = [
      { role: 'system', content: system_prompt },
      ...formattedMessages,
    ];

    const body = {
      model: selected_model || 'qwen/qwen3.6-plus:free',
      messages,
      stream: true,
      max_tokens,
      temperature,
      reasoning: { enabled: true },
    };

    const es = new EventSource(apiUrl, {
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
