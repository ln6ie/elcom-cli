import type { VPSProvider, Capability, ProviderAction, ActionResult } from "@/domain/providers/provider.types";
import type { NetworkMetrics } from "@/domain/metrics/metric.types";
import type { SSHSession } from "@/infrastructure/ssh/SSHConnectionManager";
import { networkCommands } from "@/runtime/commands";

export class NetworkProvider implements VPSProvider<NetworkMetrics> {
  id = "network" as const;
  capabilityId = "network";

  async detect(session: SSHSession): Promise<Capability> {
    const result = await session.execute(networkCommands.detect.build(), networkCommands.detect);
    return { id: this.capabilityId, name: "Network", providerId: this.id, status: result.exitCode === 0 ? "available" : "missing", discoveredAt: new Date().toISOString() };
  }

  async collect(session: SSHSession): Promise<NetworkMetrics> {
    const result = await session.execute(networkCommands.snapshot.build(), networkCommands.snapshot);
    const values = new Map(result.stdout.split("\n").map(line => { const separator = line.indexOf("="); return separator > -1 ? [line.slice(0, separator), line.slice(separator + 1).trim()] as const : [line, ""] as const; }));
    const [downloadBytes, uploadBytes] = (values.get("traffic") || "0,0").split(",").map(Number);
    const activeConnections = Number(values.get("connections") || 0);
    const parsedLatency = Number.parseFloat(values.get("latency") || "");
    return { uploadBytes: Number.isFinite(uploadBytes) ? uploadBytes : 0, downloadBytes: Number.isFinite(downloadBytes) ? downloadBytes : 0, activeConnections: Number.isFinite(activeConnections) ? activeConnections : 0, latencyMs: Number.isFinite(parsedLatency) ? parsedLatency : undefined };
  }

  actions(): ProviderAction[] { return []; }
  async executeAction(): Promise<ActionResult> { return { success: false, error: "NETWORK_PROVIDER_HAS_NO_ACTIONS" }; }
}
