import { getServerCredentials } from "@/infrastructure/storage/secureCredentials";
import { sshConnectionManager } from "@/infrastructure/ssh/SSHConnectionManager";
import type { ServerRecord } from "@/services/database";

const dangerous = /(^|\s)(rm\s+-rf|reboot|shutdown|poweroff|halt|kill|pkill|systemctl\s+(stop|disable)|docker\s+(rm|rmi|system\s+prune)|DROP\s+DATABASE)(\s|$)/i;

export function isDangerousServerCommand(command: string): boolean {
  return dangerous.test(command.trim());
}

export function commandNeedsSudo(command: string): boolean {
  return /(^|[;&|]\s*)sudo\s+/i.test(command.trim());
}

function shellQuote(command: string): string {
  return `'${command.replace(/'/g, `'"'"'`)}'`;
}

function removeSudoPrefixes(command: string): string {
  return command
    .replace(/(^|\s*&&\s*)sudo\s+-k\s*&&\s*/gi, "$1")
    .replace(/(^|[;&|]\s*)sudo\s+/gi, "$1");
}

export async function executeServerQuery(server: ServerRecord, command: string, signal?: AbortSignal, sudoPassword?: string) {
  const credentials = await getServerCredentials(server.id);
  if (!credentials) throw new Error("SERVER_CREDENTIALS_NOT_FOUND");
  const session = await sshConnectionManager.acquire({ id: server.id, name: server.name, host: server.host, port: server.port, username: server.username, authType: server.auth_type, fingerprint: server.fingerprint || undefined, createdAt: server.created_at, updatedAt: server.updated_at }, credentials);
  // Force a POSIX shell so pipes, redirects, loops, grep, and command substitution
  // behave consistently across SSH servers and user login shells.
  const wrapped = sudoPassword
    ? `printf '%s\\n' ${shellQuote(sudoPassword)} | sudo -S -p '' sh -lc ${shellQuote(removeSudoPrefixes(command))}`
    : `sh -lc ${shellQuote(command)}`;
  return session.execute(wrapped, { timeoutMs: 30_000, maxOutputBytes: 512_000, signal });
}
