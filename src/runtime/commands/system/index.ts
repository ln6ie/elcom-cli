import type { CommandBatch, CommandDefinition } from "../types";

export const systemCommands: Record<string, CommandDefinition | CommandBatch> = {
  detect: { id: "system.detect", timeoutMs: 3000, maxOutputBytes: 1024, build: () => "command -v uname" },
  snapshot: { id: "system.snapshot", timeoutMs: 7000, maxOutputBytes: 32768, build: () => [
    "printf 'kernel='; uname -s -r",
    "printf '\\nhostname='; hostname",
    "printf '\\nos='; . /etc/os-release 2>/dev/null; printf '%s' \"${PRETTY_NAME:-Linux}\"",
    "printf '\\nload='; awk '{print $1\",\"$2\",\"$3}' /proc/loadavg 2>/dev/null",
    "printf '\\nmem_total='; awk '/MemTotal/{print $2 * 1024}' /proc/meminfo 2>/dev/null",
    "printf '\\nmem_available='; awk '/MemAvailable/{print $2 * 1024}' /proc/meminfo 2>/dev/null",
    "printf '\\ndisk='; df -Pk / 2>/dev/null | awk 'NR==2 {print $2 * 1024 \",\" $3 * 1024}'",
    "printf '\\nswap='; free -b 2>/dev/null | awk '/Swap:/{print $2 \",\" $3}'",
    "printf '\\nuptime='; awk '{print int($1)}' /proc/uptime 2>/dev/null",
  ].join("; ") },
};
