import type { Server } from "@/domain/servers/server.types";
import type { ServerCredentials } from "@/infrastructure/storage/secureCredentials";
import { createSSHClient, type CommandResult, type SSHClient, type SSHConnectionOptions } from "./SSHClient";
import * as Crypto from "expo-crypto";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting" | "disconnecting" | "error";

export interface SSHSession {
  serverId: string;
  state: ConnectionState;
  execute(command: string, options?: { timeoutMs?: number; maxOutputBytes?: number; signal?: AbortSignal }): Promise<CommandResult>;
  close(): Promise<void>;
}

export class SSHFingerprintRequiredError extends Error {
  constructor(public readonly serverId: string, public readonly fingerprint: string) {
    super("SSH_FINGERPRINT_CONFIRMATION_REQUIRED");
    this.name = "SSHFingerprintRequiredError";
  }
}

interface ManagedSession {
  server: Server;
  credentials: ServerCredentials;
  client: SSHClient;
  state: ConnectionState;
  connectedAt?: number;
  lastUsedAt: number;
  connectPromise?: Promise<void>;
  executeQueue: Promise<void>;
  activeCommandId?: string;
  idleTimer?: ReturnType<typeof setTimeout>;
  confirmFingerprint?: (fingerprint: string) => Promise<boolean>;
}

export class SSHConnectionManager {
  private readonly sessions = new Map<string, ManagedSession>();

  constructor(private readonly idleTimeoutMs = 60_000) {}

  async acquire(server: Server, credentials: ServerCredentials, options?: { confirmFingerprint?: (fingerprint: string) => Promise<boolean> }): Promise<SSHSession> {
    let managed = this.sessions.get(server.id);
    if (!managed) {
      managed = { server, credentials, client: createSSHClient(), state: "disconnected", lastUsedAt: Date.now(), executeQueue: Promise.resolve() };
      this.sessions.set(server.id, managed);
    }
    managed.server = server;
    managed.credentials = credentials;
    managed.confirmFingerprint = options?.confirmFingerprint;
    await this.ensureConnected(managed);
    managed.lastUsedAt = Date.now();
    this.scheduleIdleDisconnect(managed);

    return {
      serverId: server.id,
      get state() { return managed?.state ?? "disconnected"; },
      execute: (command, options) => this.execute(server.id, command, options),
      close: () => this.release(server.id),
    };
  }

  async execute(serverId: string, command: string, options?: { timeoutMs?: number; maxOutputBytes?: number; signal?: AbortSignal }): Promise<CommandResult> {
    const managed = this.sessions.get(serverId);
    if (!managed) throw new Error("SSH_SESSION_NOT_ACQUIRED");
    const task = managed.executeQueue.then(async () => {
      if (options?.signal?.aborted) throw new Error("SSH_COMMAND_CANCELLED");
      await this.ensureConnected(managed);
      managed.lastUsedAt = Date.now();
      this.scheduleIdleDisconnect(managed);
      const commandId = Crypto.randomUUID();
      managed.activeCommandId = commandId;
      const abortHandler = () => { void managed.client.cancel(commandId); };
      options?.signal?.addEventListener("abort", abortHandler, { once: true });
      try {
        return await managed.client.exec(command, {
          commandId,
          timeoutMs: options?.timeoutMs,
          maxOutputBytes: options?.maxOutputBytes,
          signal: options?.signal,
        });
      } finally {
        options?.signal?.removeEventListener("abort", abortHandler);
        if (managed.activeCommandId === commandId) managed.activeCommandId = undefined;
      }
    });
    managed.executeQueue = task.then(() => undefined, () => undefined);
    return task;
  }

  async cancel(serverId: string, commandId: string): Promise<void> {
    const managed = this.sessions.get(serverId);
    if (!managed || managed.activeCommandId !== commandId) return;
    await managed.client.cancel(commandId);
  }

  async reconnect(serverId: string): Promise<void> {
    const managed = this.sessions.get(serverId);
    if (!managed) throw new Error("SSH_SESSION_NOT_FOUND");
    await this.disconnect(serverId);
    await this.ensureConnected(managed);
  }

  async release(serverId: string): Promise<void> {
    const managed = this.sessions.get(serverId);
    if (!managed) return;
    managed.lastUsedAt = Date.now();
    this.scheduleIdleDisconnect(managed);
  }

  async disconnect(serverId: string): Promise<void> {
    const managed = this.sessions.get(serverId);
    if (!managed) return;
    if (managed.idleTimer) clearTimeout(managed.idleTimer);
    managed.state = "disconnecting";
    await managed.client.disconnect();
    managed.state = "disconnected";
    managed.connectedAt = undefined;
  }

  async disconnectAll(): Promise<void> {
    await Promise.all([...this.sessions.keys()].map(serverId => this.disconnect(serverId)));
    this.sessions.clear();
  }

  getState(serverId: string): ConnectionState {
    return this.sessions.get(serverId)?.state ?? "disconnected";
  }

  private async ensureConnected(managed: ManagedSession): Promise<void> {
    if (managed.state === "connected") return;
    if (managed.connectPromise) return managed.connectPromise;
    managed.state = managed.state === "error" ? "reconnecting" : "connecting";
    const options: SSHConnectionOptions = {
      host: managed.server.host,
      port: managed.server.port,
      username: managed.server.username,
      ...managed.credentials,
      expectedFingerprint: managed.server.fingerprint,
      connectTimeoutMs: 10_000,
    };
    managed.connectPromise = (async () => {
      let fingerprint = managed.server.fingerprint;
      if (!fingerprint) {
        const discovered = await managed.client.getHostFingerprint({ host: managed.server.host, port: managed.server.port, connectTimeoutMs: 10_000 });
        if (!managed.confirmFingerprint) throw new SSHFingerprintRequiredError(managed.server.id, discovered.fingerprint);
        const accepted = await managed.confirmFingerprint(discovered.fingerprint);
        if (!accepted) throw new Error("SSH_FINGERPRINT_REJECTED");
        managed.server = { ...managed.server, fingerprint: discovered.fingerprint };
        fingerprint = discovered.fingerprint;
      }
      const connected = await managed.client.connect({ ...options, expectedFingerprint: fingerprint });
      if (fingerprint && fingerprint !== connected.fingerprint) {
        await managed.client.disconnect();
        throw new Error("SSH_HOST_FINGERPRINT_CHANGED");
      }
      managed.state = "connected";
      managed.connectedAt = Date.now();
    })().catch(error => {
      managed.state = "error";
      throw error;
    }).finally(() => { managed.connectPromise = undefined; });
    return managed.connectPromise;
  }

  private scheduleIdleDisconnect(managed: ManagedSession): void {
    if (managed.idleTimer) clearTimeout(managed.idleTimer);
    managed.idleTimer = setTimeout(() => {
      if (Date.now() - managed.lastUsedAt >= this.idleTimeoutMs) void this.disconnect(managed.server.id);
    }, this.idleTimeoutMs);
  }
}

export const sshConnectionManager = new SSHConnectionManager();
