import type { Server } from "@/domain/servers/server.types";
import type { ServerSnapshot, ProviderStatus } from "@/domain/metrics/metric.types";
import type { ServerCredentials } from "@/infrastructure/storage/secureCredentials";
import { sshConnectionManager, type SSHConnectionManager } from "@/infrastructure/ssh/SSHConnectionManager";
import { discoveryService, type DiscoveryService } from "@/runtime/discovery/DiscoveryService";
import { getProvider } from "@/providers/ProviderRegistry";
import { serverLogger } from "@/features/servers/serverLogger";

export class SnapshotCollector {
  constructor(private readonly connectionManager: SSHConnectionManager = sshConnectionManager, private readonly discovery: DiscoveryService = discoveryService) {}

  async collect(server: Server, credentials: ServerCredentials, forceDiscovery = false, confirmFingerprint?: (fingerprint: string) => Promise<boolean>, deletedCapabilityIds: ReadonlySet<string> = new Set()): Promise<{ snapshot: ServerSnapshot; capabilities: Awaited<ReturnType<DiscoveryService["discover"]>> }> {
    const session = await this.connectionManager.acquire(server, credentials, { confirmFingerprint });
    serverLogger.info("SSH session acquired", { serverId: server.id });
    try {
      const discovered = await this.discovery.discoverSession(server.id, session, forceDiscovery);
      const capabilities = discovered.filter(capability => !deletedCapabilityIds.has(capability.id) && !deletedCapabilityIds.has(capability.providerId || ""));
      serverLogger.info("Discovery capabilities filtered", { serverId: server.id, discovered: discovered.length, active: capabilities.length, deleted: deletedCapabilityIds.size });
      serverLogger.info("Discovery completed", { serverId: server.id, available: capabilities.filter(capability => capability.status === "available").length });
      const availableProviders = new Map<string, typeof capabilities[number]>();
      for (const capability of capabilities) {
        if (capability.status !== "available") continue;
        const providerId = capability.providerId || capability.id;
        if (!availableProviders.has(providerId)) availableProviders.set(providerId, capability);
      }
      const results: Array<readonly [string, ProviderStatus<unknown>]> = [];
      for (const [providerId, capability] of availableProviders.entries()) {
        const provider = getProvider(providerId);
        if (!provider) {
          results.push([providerId, { available: true }]);
          continue;
        }
        try {
          serverLogger.info("Provider collection started", { serverId: server.id, provider: provider.id });
          const data = await provider.collect(session);
          serverLogger.info("Provider collected", { serverId: server.id, provider: provider.id });
          results.push([providerId, { available: true, data }]);
        } catch (error) {
          serverLogger.error("Provider collection failed", error, { serverId: server.id, provider: provider.id });
          results.push([providerId, { available: true, error: error instanceof Error ? error.message : "Provider collection failed" }]);
        }
      }
      const byId = Object.fromEntries(results) as Record<string, ProviderStatus<unknown>>;
      return { capabilities, snapshot: { serverId: server.id, collectedAt: new Date().toISOString(), system: byId.system as ServerSnapshot["system"], network: byId.network as ServerSnapshot["network"], docker: byId.docker, pm2: byId.pm2, nginx: byId.nginx } };
    } finally { await session.close(); }
  }
}

export const snapshotCollector = new SnapshotCollector();
