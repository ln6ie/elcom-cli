import type { CommandDefinition } from "../types";

export const networkCommands = {
  detect: { id: "network.detect", timeoutMs: 3000, maxOutputBytes: 1024, build: () => "command -v ip" },
  snapshot: { id: "network.snapshot", timeoutMs: 5000, maxOutputBytes: 16384, build: () => "ip -s link 2>/dev/null; ss -Htan 2>/dev/null | wc -l" },
} satisfies Record<string, CommandDefinition>;
