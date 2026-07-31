import type { ActionResult, Capability, ProviderAction, VPSProvider } from "@/domain/providers/provider.types";
import type { DockerMetrics } from "@/domain/providers/software.types";
import type { SSHSession } from "@/infrastructure/ssh/SSHConnectionManager";
import { dockerCommands } from "@/runtime/commands";
import { shellIdentifier } from "@/runtime/commands/sanitize";

export class DockerProvider implements VPSProvider<DockerMetrics> {
  id = "docker";
  capabilityId = "docker";
  async detect(session: SSHSession): Promise<Capability> { const result = await session.execute(dockerCommands.detect.build(), dockerCommands.detect); return { id: this.capabilityId, name: "Docker", providerId: this.id, status: result.exitCode === 0 ? "available" : "missing", discoveredAt: new Date().toISOString() }; }
  async collect(session: SSHSession): Promise<DockerMetrics> { const [version, list] = await Promise.all([session.execute(dockerCommands.version.build(), dockerCommands.version), session.execute(dockerCommands.list.build(), dockerCommands.list)]); const containers = list.stdout.split("\n").filter(Boolean).map((line, index) => { try { const item = JSON.parse(line) as { ID?: string; Names?: string; Image?: string; State?: string; Status?: string }; return { id: item.ID || String(index), name: item.Names || "unknown", image: item.Image || "unknown", state: item.State || "unknown", status: item.Status || "unknown" }; } catch { return { id: String(index), name: "unreadable", image: "unknown", state: "unknown", status: "unknown" }; } }); return { version: version.stdout.trim(), containers }; }
  actions(): ProviderAction[] { return [{ id: "restart", label: "Restart", kind: "restart" }, { id: "stop", label: "Stop", kind: "stop", destructive: true }, { id: "inspect", label: "Inspect", kind: "inspect" }, { id: "logs", label: "Logs", kind: "logs" }]; }
  async executeAction(session: SSHSession, actionId: string, target?: string): Promise<ActionResult> { if (!target) return { success: false, error: "ACTION_TARGET_REQUIRED" }; const name = shellIdentifier(target); const command = actionId === "restart" ? dockerCommands.restart(name) : actionId === "stop" ? dockerCommands.stop(name) : actionId === "logs" ? dockerCommands.logs(name) : undefined; if (!command) return { success: false, error: "UNSUPPORTED_DOCKER_ACTION" }; const result = await session.execute(command.build(), command); return { success: result.exitCode === 0, output: result.stdout, error: result.exitCode === 0 ? undefined : result.stderr }; }
}
