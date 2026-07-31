import type { CommandDefinition } from "../types";

export const nginxCommands = {
  detect: { id: "nginx.detect", timeoutMs: 3000, maxOutputBytes: 1024, build: () => "command -v nginx" },
  version: { id: "nginx.version", timeoutMs: 5000, maxOutputBytes: 4096, build: () => "nginx -v 2>&1" },
  testConfig: { id: "nginx.test_config", timeoutMs: 10000, maxOutputBytes: 8192, build: () => "nginx -t" },
  reload: { id: "nginx.reload", timeoutMs: 10000, maxOutputBytes: 4096, build: () => "nginx -s reload" },
  accessLogs: { id: "nginx.access_logs", timeoutMs: 10000, maxOutputBytes: 65536, build: () => "tail -n 200 /var/log/nginx/access.log 2>/dev/null" },
  errorLogs: { id: "nginx.error_logs", timeoutMs: 10000, maxOutputBytes: 65536, build: () => "tail -n 200 /var/log/nginx/error.log 2>/dev/null" },
} satisfies Record<string, CommandDefinition>;
