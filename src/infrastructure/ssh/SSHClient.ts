import { Platform } from "react-native";
import { requireNativeModule } from "expo-modules-core";

export interface SSHConnectionOptions {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  expectedFingerprint?: string;
  connectTimeoutMs?: number;
}

export type SSHHostOptions = Pick<SSHConnectionOptions, "host" | "port" | "connectTimeoutMs">;

export interface CommandResult { stdout: string; stderr: string; exitCode: number; }

interface NativeSSHModule {
  getHostFingerprint(options: SSHHostOptions): Promise<{ fingerprint: string; algorithm: "sha256" }>;
  connect(options: SSHConnectionOptions): Promise<{ sessionId: string; fingerprint: string }>;
  execute(sessionId: string, command: string, options?: { commandId?: string; timeoutMs?: number; maxOutputBytes?: number }): Promise<CommandResult>;
  cancel(sessionId: string, commandId: string): Promise<void>;
  disconnect(sessionId: string): Promise<void>;
}

export interface SSHClient {
  getHostFingerprint(options: SSHHostOptions): Promise<{ fingerprint: string; algorithm: "sha256" }>;
  connect(options: SSHConnectionOptions): Promise<{ fingerprint: string }>;
  exec(command: string, options?: { commandId?: string; timeoutMs?: number; maxOutputBytes?: number; signal?: AbortSignal }): Promise<CommandResult>;
  cancel(commandId: string): Promise<void>;
  disconnect(): Promise<void>;
}

function unavailableClient(error: unknown): SSHClient {
  const reason = error instanceof Error ? error.message : "SSH_NATIVE_MODULE_UNAVAILABLE";
  return {
    async getHostFingerprint() { throw new Error(`SSH_NATIVE_MODULE_UNAVAILABLE:${reason}`); },
    async connect() { throw new Error(`SSH_NATIVE_MODULE_UNAVAILABLE:${reason}`); },
    async exec() { throw new Error(`SSH_NATIVE_MODULE_UNAVAILABLE:${reason}`); },
    async cancel() { throw new Error(`SSH_NATIVE_MODULE_UNAVAILABLE:${reason}`); },
    async disconnect() {},
  };
}

export function createSSHClient(): SSHClient {
  if (Platform.OS === "web") return unavailableClient(new Error("SSH_IS_NATIVE_ONLY"));
  try {
    const native = requireNativeModule<NativeSSHModule>("SSHClientModule");
    let nativeSessionId = "";
    return {
      getHostFingerprint: options => native.getHostFingerprint(options),
      connect: async options => { const result = await native.connect(options); nativeSessionId = result.sessionId; return result; },
      exec: (command, options) => native.execute(nativeSessionId, command, {
        ...(options?.commandId ? { commandId: options.commandId } : {}),
        ...(options?.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
        ...(options?.maxOutputBytes !== undefined ? { maxOutputBytes: options.maxOutputBytes } : {}),
      }),
      cancel: commandId => native.cancel(nativeSessionId, commandId),
      disconnect: async () => { if (nativeSessionId) await native.disconnect(nativeSessionId); nativeSessionId = ""; },
    };
  } catch (error) {
    return unavailableClient(error);
  }
}
