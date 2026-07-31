import type { SSHSession } from "@/infrastructure/ssh/SSHConnectionManager";

export type ProviderId = string;
export type ProviderActionKind = "restart" | "reload" | "delete" | "stop" | "inspect" | "logs" | "test_config";

export interface ProviderAction {
  id: string;
  label: string;
  kind: ProviderActionKind;
  destructive?: boolean;
}

export interface ActionResult {
  success: boolean;
  output?: string;
  error?: string;
}

export interface Capability {
  id: string;
  name: string;
  status: "available" | "missing";
  version?: string;
  providerId?: ProviderId;
  discoveredAt: string;
}

export interface VPSProvider<TData> {
  id: ProviderId;
  capabilityId: string;
  detect(session: SSHSession): Promise<Capability>;
  collect(session: SSHSession): Promise<TData>;
  actions(): ProviderAction[];
  executeAction(session: SSHSession, actionId: string, target?: string): Promise<ActionResult>;
}
