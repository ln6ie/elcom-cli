import type { Capability } from "@/domain/providers/provider.types";
import { sshConnectionManager, type SSHConnectionManager, type SSHSession } from "@/infrastructure/ssh/SSHConnectionManager";
import type { Server } from "@/domain/servers/server.types";
import type { ServerCredentials } from "@/infrastructure/storage/secureCredentials";
import { dockerCommands, nginxCommands, networkCommands, pm2Commands, systemCommands } from "@/runtime/commands";

interface DiscoveryDefinition {
  id: string;
  name: string;
  providerId: string;
  command: { build: () => string; timeoutMs: number; maxOutputBytes: number };
}

const definitions: DiscoveryDefinition[] = [
  { id: "system", name: "System", providerId: "system", command: systemCommands.detect },
  { id: "network", name: "Network", providerId: "network", command: networkCommands.detect },
  { id: "docker", name: "Docker", providerId: "docker", command: dockerCommands.detect },
  { id: "pm2", name: "PM2", providerId: "pm2", command: pm2Commands.detect },
  { id: "nginx", name: "Nginx", providerId: "nginx", command: nginxCommands.detect },
  { id: "docker-compose", name: "Docker Compose", providerId: "docker", command: { build: () => "command -v docker-compose || docker compose version", timeoutMs: 3000, maxOutputBytes: 2048 } },
  { id: "redis", name: "Redis", providerId: "redis", command: { build: () => "command -v redis-server", timeoutMs: 3000, maxOutputBytes: 1024 } },
  { id: "postgresql", name: "PostgreSQL", providerId: "postgresql", command: { build: () => "command -v psql", timeoutMs: 3000, maxOutputBytes: 1024 } },
  { id: "mysql", name: "MySQL", providerId: "mysql", command: { build: () => "command -v mysql", timeoutMs: 3000, maxOutputBytes: 1024 } },
  { id: "node", name: "Node.js", providerId: "node", command: { build: () => "command -v node", timeoutMs: 3000, maxOutputBytes: 1024 } },
  { id: "bun", name: "Bun", providerId: "bun", command: { build: () => "command -v bun", timeoutMs: 3000, maxOutputBytes: 1024 } },
  { id: "python", name: "Python", providerId: "python", command: { build: () => "command -v python3 || command -v python", timeoutMs: 3000, maxOutputBytes: 1024 } },
  { id: "caddy", name: "Caddy", providerId: "caddy", command: { build: () => "command -v caddy", timeoutMs: 3000, maxOutputBytes: 1024 } },
  { id: "traefik", name: "Traefik", providerId: "traefik", command: { build: () => "command -v traefik", timeoutMs: 3000, maxOutputBytes: 1024 } },
  { id: "ufw", name: "UFW", providerId: "ufw", command: { build: () => "command -v ufw", timeoutMs: 3000, maxOutputBytes: 1024 } },
  { id: "fail2ban", name: "Fail2Ban", providerId: "fail2ban", command: { build: () => "command -v fail2ban-client", timeoutMs: 3000, maxOutputBytes: 1024 } },
];

export class DiscoveryService {
  private readonly cache = new Map<string, { expiresAt: number; capabilities: Capability[] }>();

  constructor(private readonly connectionManager: SSHConnectionManager = sshConnectionManager) {}

  async discover(server: Server, credentials: ServerCredentials, force = false): Promise<Capability[]> {
    const cached = this.cache.get(server.id);
    if (!force && cached && cached.expiresAt > Date.now()) return cached.capabilities;
    const session = await this.connectionManager.acquire(server, credentials);
    try {
      return await this.discoverSession(server.id, session, force);
    } finally {
      await session.close();
    }
  }

  invalidate(serverId: string) { this.cache.delete(serverId); }

  async discoverSession(serverId: string, session: SSHSession, force = false): Promise<Capability[]> {
    const cached = this.cache.get(serverId);
    if (!force && cached && cached.expiresAt > Date.now()) return cached.capabilities;
    const capabilities = await this.runDiscovery(serverId, session);
    this.cache.set(serverId, { capabilities, expiresAt: Date.now() + 15 * 60_000 });
    return capabilities;
  }

  private async runDiscovery(_serverId: string, session: SSHSession): Promise<Capability[]> {
    // Discovery is intentionally batched into one shell round trip. The output
    // format is line-oriented and bounded, so each definition remains testable.
    const batch = definitions.map(definition => `printf '%s|' '${definition.id}'; (${definition.command.build()}) >/dev/null 2>&1 && printf 'available\\n' || printf 'missing\\n'`).join("; ");
    const result = await session.execute(batch, { timeoutMs: 30_000, maxOutputBytes: 32_768 });
    const statuses = result.stdout.split("\n").filter(Boolean).map(line => line.split("|"));
    const statusMap = new Map(statuses.map(([id, status]) => [id, status === "available"]));
    return definitions.map(definition => ({
      id: definition.id,
      name: definition.name,
      providerId: definition.providerId,
      status: statusMap.get(definition.id) ? "available" : "missing",
      discoveredAt: new Date().toISOString(),
    }));
  }
}

export const discoveryService = new DiscoveryService();
