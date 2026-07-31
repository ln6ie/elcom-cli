import { z } from "zod";

export const GitHubUserSchema = z.object({
  login: z.string(),
  avatar_url: z.string().url(),
  html_url: z.string().url(),
});

export type GitHubUser = z.infer<typeof GitHubUserSchema>;

export const GitHubRepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  private: z.boolean(),
  updated_at: z.string(),
  owner: z.object({
    login: z.string(),
  }),
});

export type GitHubRepo = z.infer<typeof GitHubRepoSchema>;

export const FileNodeSchema = z.object({
  path: z.string(),
  mode: z.string().optional(),
  type: z.enum(["blob", "tree"]),
  sha: z.string(),
  size: z.number().optional(),
});

export type FileNode = z.infer<typeof FileNodeSchema>;

export const OpenFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  originalContent: z.string(),
  sha: z.string(),
});

export type OpenFile = z.infer<typeof OpenFileSchema>;

export const IdeMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string(),
  reasoning: z.string().optional(),
  tool_call_id: z.string().optional(),
  tool_calls_json: z.string().optional(),
});

export type IdeMessage = z.infer<typeof IdeMessageSchema>;
