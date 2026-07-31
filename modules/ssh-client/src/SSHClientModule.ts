import { NativeModule, requireNativeModule } from "expo";

export interface NativeSSHClientModule extends NativeModule {
  getHostFingerprint(options: Record<string, string | number | undefined>): Promise<{ fingerprint: string; algorithm: "sha256" }>;
  connect(options: Record<string, string | number | undefined>): Promise<{ sessionId: string; fingerprint: string }>;
  execute(sessionId: string, command: string, options?: Record<string, string | number>): Promise<{ stdout: string; stderr: string; exitCode: number }>;
  cancel(sessionId: string, commandId: string): Promise<void>;
  disconnect(sessionId: string): Promise<void>;
}

export const NativeSSHClient = requireNativeModule<NativeSSHClientModule>("SSHClientModule");
