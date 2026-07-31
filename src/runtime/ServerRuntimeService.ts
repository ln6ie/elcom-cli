import * as Crypto from "expo-crypto";
import type * as SQLite from "expo-sqlite";
import type { Server } from "@/domain/servers/server.types";
import type { ServerSnapshot } from "@/domain/metrics/metric.types";
import type { Capability } from "@/domain/providers/provider.types";
import type { ServerCredentials } from "@/infrastructure/storage/secureCredentials";
import { database } from "@/services/database";
import { snapshotCollector } from "./collection/SnapshotCollector";
import { calculateHealth, type HealthResult } from "./health/HealthEngine";
import { deriveEvents, type RuntimeEvent } from "./events/EventEngine";

export interface ServerRuntimeResult {
  snapshot: ServerSnapshot;
  capabilities: Capability[];
  health: HealthResult;
  events: RuntimeEvent[];
}

export class ServerRuntimeService {
  async refresh(db: SQLite.SQLiteDatabase, server: Server, credentials: ServerCredentials, forceDiscovery = false, confirmFingerprint?: (fingerprint: string) => Promise<boolean>): Promise<ServerRuntimeResult> {
    const previousRecord = await database.getLatestServerSnapshot(db, server.id);
    const previous = previousRecord ? this.parseSnapshot(previousRecord.payload) : null;
    const result = await snapshotCollector.collect(server, credentials, forceDiscovery, confirmFingerprint);
    const health = calculateHealth(result.snapshot);
    const events = deriveEvents(previous, result.snapshot);

    await database.saveServerSnapshot(db, {
      id: Crypto.randomUUID(),
      server_id: server.id,
      payload: JSON.stringify(result.snapshot),
      collected_at: result.snapshot.collectedAt,
    });
    await database.saveCapabilities(db, result.capabilities.map(capability => ({
      server_id: server.id,
      capability_id: capability.id,
      name: capability.name,
      provider_id: capability.providerId || null,
      status: capability.status,
      version: capability.version || null,
      discovered_at: capability.discoveredAt,
    })));
    for (const event of events) {
      await database.saveEvent(db, {
        id: event.id,
        server_id: event.serverId,
        type: event.type,
        severity: event.severity,
        title: event.title,
        details: event.details || null,
        source: "runtime",
        created_at: event.createdAt,
      });
    }
    return { ...result, health, events };
  }

  async getCached(db: SQLite.SQLiteDatabase, serverId: string): Promise<ServerRuntimeResult | null> {
    const [snapshotRecord, capabilityRecords, eventRecords] = await Promise.all([
      database.getLatestServerSnapshot(db, serverId),
      database.getCapabilities(db, serverId),
      database.getServerEvents(db, serverId),
    ]);
    if (!snapshotRecord) return null;
    const snapshot = this.parseSnapshot(snapshotRecord.payload);
    const capabilities: Capability[] = capabilityRecords.map(record => ({ id: record.capability_id, name: record.name, providerId: record.provider_id || undefined, status: record.status, version: record.version || undefined, discoveredAt: record.discovered_at }));
    const events: RuntimeEvent[] = eventRecords.map(record => ({ id: record.id, serverId: record.server_id, type: record.type as RuntimeEvent["type"], severity: record.severity, title: record.title, details: record.details || undefined, createdAt: record.created_at }));
    return { snapshot, capabilities, health: calculateHealth(snapshot), events };
  }

  private parseSnapshot(payload: string): ServerSnapshot {
    try { return JSON.parse(payload) as ServerSnapshot; }
    catch { throw new Error("INVALID_SNAPSHOT_PAYLOAD"); }
  }
}

export const serverRuntimeService = new ServerRuntimeService();
