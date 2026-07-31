import type { CommandDefinition } from "../types";
import { shellIdentifier } from "../sanitize";

export const dockerCommands = {
  detect: { id: "docker.detect", timeoutMs: 3000, maxOutputBytes: 1024, build: () => "command -v docker" },
  version: { id: "docker.version", timeoutMs: 5000, maxOutputBytes: 4096, build: () => "docker version --format '{{.Server.Version}}'" },
  list: { id: "docker.list", timeoutMs: 7000, maxOutputBytes: 65536, build: () => "docker ps -a --format '{{json .}}'" },
  restart: (name: string) => ({ id: "docker.restart", timeoutMs: 10000, maxOutputBytes: 4096, build: () => `docker restart -- ${shellIdentifier(name)}` }),
  stop: (name: string) => ({ id: "docker.stop", timeoutMs: 10000, maxOutputBytes: 4096, build: () => `docker stop -- ${shellIdentifier(name)}` }),
  logs: (name: string) => ({ id: "docker.logs", timeoutMs: 10000, maxOutputBytes: 65536, build: () => `docker logs --tail 200 -- ${shellIdentifier(name)}` }),
} satisfies Record<string, CommandDefinition | ((name: string) => CommandDefinition)>;
