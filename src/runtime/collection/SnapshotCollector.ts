import type { Server } from "@/domain/servers/server.types";
import type { ServerSnapshot, ProviderStatus } from "@/domain/metrics/metric.types";
import type { ServerCredentials } from "@/infrastructure/storage/secureCredentials";
import { sshConnectionManager, type SSHConnectionManager } from "@/infrastructure/ssh/SSHConnectionManager";
import { discoveryService, type DiscoveryService } from "@/runtime/discovery/DiscoveryService";
import { getProvider } from "@/providers/ProviderRegistry";

export class SnapshotCollector {
  constructor(private readonly connectionManager: SSHConnectionManager = sshConnectionManager, private readonly discovery: DiscoveryService = discoveryService) {}

  async collect(server: Server, credentials: ServerCredentials, forceDiscovery = false, confirmFingerprint?: (fingerprint: string) => Promise<boolean>): Promise<{ snapshot: ServerSnapshot; capabilities: Awaited<ReturnType<DiscoveryService["discover"]>> }> {
    const session = await this.connectionManager.acquire(server, credentials, { confirmFingerprint });
    try {
      const capabilities = await this.discovery.discoverSession(server.id, session, forceDiscovery);
      const available = capabilities.filter(capability => capability.status === "available");
      const results = await Promise.all(available.map(async capability => {
        const provider = getProvider(capability.providerId || capability.id);
        if (!provider) return [capability.id, { available: true }] as const;
        try { return [capability.id, { available: true, data: await provider.collect(session) }] as const; }
        catch (error) { return [capability.id, { available: true, error: error instanceof Error ? error.message : "Provider collection failed" }] as const; }
      }));
      const byId = Object.fromEntries(results) as Record<string, ProviderStatus<unknown>>;
      return { capabilities, snapshot: { serverId: server.id, collectedAt: new Date().toISOString(), system: byId.system as ServerSnapshot["system"], network: byId.network as ServerSnapshot["network"], docker: byId.docker, pm2: byId.pm2, nginx: byId.nginx } };
    } finally { await session.close(); }
  }
}

export const snapshotCollector = new SnapshotCollector();
