import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_OPENROUTER_URL: z.string().url(),
  EXPO_PUBLIC_UPDATE_URL: z.string().url(),
  EXPO_PUBLIC_OPENROUTER_KEYS_URL: z.string().url(),
  EXPO_PUBLIC_LANDING_PAGE_URL: z.string().url(),
});

const _env = envSchema.safeParse({
  EXPO_PUBLIC_OPENROUTER_URL: process.env.EXPO_PUBLIC_OPENROUTER_URL,
  EXPO_PUBLIC_UPDATE_URL: process.env.EXPO_PUBLIC_UPDATE_URL,
  EXPO_PUBLIC_OPENROUTER_KEYS_URL: process.env.EXPO_PUBLIC_OPENROUTER_KEYS_URL,
  EXPO_PUBLIC_LANDING_PAGE_URL: process.env.EXPO_PUBLIC_LANDING_PAGE_URL,
});

if (!_env.success) {
  console.error("❌ FATAL: INVALID_ENVIRONMENT_VARIABLES", _env.error.format());
  throw new Error(
    "SYSTEM_BOOT_FAILED: Please check your .env file or configuration.",
  );
}

export const env = _env.data;
