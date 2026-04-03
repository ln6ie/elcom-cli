import { z } from 'zod';

export const RoleSchema = z.enum(['user', 'assistant', 'system']);
export type Role = z.infer<typeof RoleSchema>;

export const MessageSchema = z.object({
  role: RoleSchema,
  content: z.string(),
  reasoning: z.string().optional(),
});
export type Message = z.infer<typeof MessageSchema>;

export const OpenRouterResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: MessageSchema,
    })
  ),
});

export type OpenRouterResponse = z.infer<typeof OpenRouterResponseSchema>;

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
