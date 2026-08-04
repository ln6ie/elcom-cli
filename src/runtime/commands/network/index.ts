import type { CommandDefinition } from "../types";

export const networkCommands = {
  detect: { id: "network.detect", timeoutMs: 3000, maxOutputBytes: 1024, build: () => "command -v ip" },
  snapshot: { id: "network.snapshot", timeoutMs: 8000, maxOutputBytes: 16384, build: () => `awk 'NR > 2 && $1 !~ /lo:/ {rx += $2; tx += $10} END {printf "traffic=%d,%d\\n", rx+0, tx+0}' /proc/net/dev 2>/dev/null; printf 'connections='; ss -Htan 2>/dev/null | wc -l; latency=$(ping -c 1 -W 2 1.1.1.1 2>/dev/null | awk -F'time=' '/time=/{split($2,a," "); print a[1]; exit}'); printf 'latency=%s\\n' "\${latency:-}"` },
} satisfies Record<string, CommandDefinition>;
