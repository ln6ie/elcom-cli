import type { CommandDefinition } from "../types";

export const pm2Commands = {
  detect: { id: "pm2.detect", timeoutMs: 3000, maxOutputBytes: 1024, build: () => "command -v pm2" },
  version: { id: "pm2.version", timeoutMs: 5000, maxOutputBytes: 4096, build: () => "pm2 -v" },
  list: { id: "pm2.list", timeoutMs: 7000, maxOutputBytes: 131072, build: () => "pm2 jlist" },
  restart: (name: string) => ({ id: "pm2.restart", timeoutMs: 10000, maxOutputBytes: 4096, build: () => `pm2 restart -- ${name}` }),
  reload: (name: string) => ({ id: "pm2.reload", timeoutMs: 10000, maxOutputBytes: 4096, build: () => `pm2 reload -- ${name}` }),
  delete: (name: string) => ({ id: "pm2.delete", timeoutMs: 10000, maxOutputBytes: 4096, build: () => `pm2 delete -- ${name}` }),
  logs: (name: string) => ({ id: "pm2.logs", timeoutMs: 10000, maxOutputBytes: 65536, build: () => `pm2 logs --nostream --lines 200 -- ${name}` }),
} satisfies Record<string, CommandDefinition | ((name: string) => CommandDefinition)>;
