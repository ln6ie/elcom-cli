import type { ActionResult, Capability, ProviderAction, VPSProvider } from "@/domain/providers/provider.types";
import type { PM2Metrics } from "@/domain/providers/software.types";
import type { SSHSession } from "@/infrastructure/ssh/SSHConnectionManager";
import { pm2Commands } from "@/runtime/commands";
import { shellIdentifier } from "@/runtime/commands/sanitize";

export class PM2Provider implements VPSProvider<PM2Metrics> {
  id = "pm2";
  capabilityId = "pm2";
  async detect(session: SSHSession): Promise<Capability> { const result = await session.execute(pm2Commands.detect.build(), pm2Commands.detect); return { id: this.capabilityId, name: "PM2", providerId: this.id, status: result.exitCode === 0 ? "available" : "missing", discoveredAt: new Date().toISOString() }; }
  async collect(session: SSHSession): Promise<PM2Metrics> { const version = await session.execute(pm2Commands.version.build(), pm2Commands.version); const list = await session.execute(pm2Commands.list.build(), pm2Commands.list); const logs = await session.execute(pm2Commands.allLogs.build(), pm2Commands.allLogs); let processes: PM2Metrics["processes"] = []; try { const raw = JSON.parse(list.stdout) as Array<{ pm_id?: number; name?: string; pm2_env?: { status?: string; restart_time?: number }; monit?: { cpu?: number; memory?: number } }>; processes = raw.map(item => ({ id: item.pm_id ?? 0, name: item.name ?? "unknown", status: item.pm2_env?.status ?? "unknown", cpu: item.monit?.cpu ?? 0, memory: item.monit?.memory ?? 0, restarts: item.pm2_env?.restart_time ?? 0 })); } catch { /* provider remains usable with an empty normalized list */ } return { version: version.stdout.trim(), processes, logs: logs.stdout.split("\n").slice(-1500).reverse() }; }
  actions(): ProviderAction[] { return [{ id: "restart", label: "Restart", kind: "restart" }, { id: "reload", label: "Reload", kind: "reload" }, { id: "delete", label: "Delete", kind: "delete", destructive: true }, { id: "logs", label: "Logs", kind: "logs" }]; }
  async executeAction(session: SSHSession, actionId: string, target?: string): Promise<ActionResult> { if (!target) return { success: false, error: "ACTION_TARGET_REQUIRED" }; const name = shellIdentifier(target); const command = actionId === "restart" ? pm2Commands.restart(name) : actionId === "reload" ? pm2Commands.reload(name) : actionId === "delete" ? pm2Commands.delete(name) : actionId === "logs" ? pm2Commands.logs(name) : undefined; if (!command) return { success: false, error: "UNSUPPORTED_PM2_ACTION" }; const result = await session.execute(command.build(), command); return { success: result.exitCode === 0, output: result.stdout, error: result.exitCode === 0 ? undefined : result.stderr }; }
}
