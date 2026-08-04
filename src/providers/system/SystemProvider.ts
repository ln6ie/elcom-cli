import type { VPSProvider, Capability, ProviderAction, ActionResult } from "@/domain/providers/provider.types";
import type { SystemMetrics } from "@/domain/metrics/metric.types";
import type { SSHSession } from "@/infrastructure/ssh/SSHConnectionManager";
import { systemCommands } from "@/runtime/commands";
import { serverLogger } from "@/features/servers/serverLogger";

function numberValue(value: string | undefined): number { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }

export class SystemProvider implements VPSProvider<SystemMetrics> {
  id = "system" as const;
  capabilityId = "system";

  async detect(session: SSHSession): Promise<Capability> {
    const result = await session.execute(systemCommands.detect.build(), systemCommands.detect);
    return { id: this.capabilityId, name: "System", providerId: this.id, status: result.exitCode === 0 ? "available" : "missing", discoveredAt: new Date().toISOString() };
  }

  async collect(session: SSHSession): Promise<SystemMetrics> {
    const result = await session.execute(systemCommands.snapshot.build(), systemCommands.snapshot);
    const values = new Map(result.stdout.split("\n").map(line => { const separator = line.indexOf("="); return separator > -1 ? [line.slice(0, separator), line.slice(separator + 1).trim()] as const : [line, ""] as const; }));
    const memoryTotal = numberValue(values.get("mem_total"));
    const memoryAvailable = numberValue(values.get("mem_available"));
    const [diskTotal, diskUsed] = (values.get("disk") || "0,0").split(",").map(numberValue);
    const [swapTotal, swapUsed] = (values.get("swap") || "0,0").split(",").map(numberValue);
    const cpuUsage = numberValue(values.get("cpu"));
    const load = (values.get("load") || "0,0,0").split(",").map(numberValue);
    serverLogger.info("System metrics parsed", { memoryTotal, memoryAvailable, memoryUsed: Math.max(0, memoryTotal - memoryAvailable), diskTotal, diskUsed, swapTotal, swapUsed, cpuUsage, keys: Array.from(values.keys()) });
    return {
      os: values.get("os") || "Linux",
      kernel: values.get("kernel") || "Unknown",
      hostname: values.get("hostname") || "Unknown",
      cpuUsage,
      memoryTotal, memoryUsed: Math.max(0, memoryTotal - memoryAvailable),
      diskTotal, diskUsed, swapTotal, swapUsed,
      uptimeSeconds: numberValue(values.get("uptime")),
      loadAverage: [load[0] || 0, load[1] || 0, load[2] || 0],
    };
  }

  actions(): ProviderAction[] { return []; }
  async executeAction(): Promise<ActionResult> { return { success: false, error: "SYSTEM_PROVIDER_HAS_NO_ACTIONS" }; }
}
