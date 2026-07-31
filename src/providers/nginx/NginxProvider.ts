import type { ActionResult, Capability, ProviderAction, VPSProvider } from "@/domain/providers/provider.types";
import type { NginxMetrics } from "@/domain/providers/software.types";
import type { SSHSession } from "@/infrastructure/ssh/SSHConnectionManager";
import { nginxCommands } from "@/runtime/commands";

export class NginxProvider implements VPSProvider<NginxMetrics> {
  id = "nginx";
  capabilityId = "nginx";
  async detect(session: SSHSession): Promise<Capability> { const result = await session.execute(nginxCommands.detect.build(), nginxCommands.detect); return { id: this.capabilityId, name: "Nginx", providerId: this.id, status: result.exitCode === 0 ? "available" : "missing", discoveredAt: new Date().toISOString() }; }
  async collect(session: SSHSession): Promise<NginxMetrics> { const [version, config] = await Promise.all([session.execute(nginxCommands.version.build(), nginxCommands.version), session.execute(nginxCommands.testConfig.build(), nginxCommands.testConfig)]); return { version: version.stdout.trim(), running: config.exitCode === 0, configValid: config.exitCode === 0 }; }
  actions(): ProviderAction[] { return [{ id: "reload", label: "Reload", kind: "reload" }, { id: "test_config", label: "Test configuration", kind: "test_config" }, { id: "access_logs", label: "Access logs", kind: "logs" }, { id: "error_logs", label: "Error logs", kind: "logs" }]; }
  async executeAction(session: SSHSession, actionId: string): Promise<ActionResult> { const command = actionId === "reload" ? nginxCommands.reload : actionId === "test_config" ? nginxCommands.testConfig : actionId === "access_logs" ? nginxCommands.accessLogs : actionId === "error_logs" ? nginxCommands.errorLogs : undefined; if (!command) return { success: false, error: "UNSUPPORTED_NGINX_ACTION" }; const result = await session.execute(command.build(), command); return { success: result.exitCode === 0, output: result.stdout, error: result.exitCode === 0 ? undefined : result.stderr }; }
}
