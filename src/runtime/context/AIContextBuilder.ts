import type { Capability } from "@/domain/providers/provider.types";
import type { ServerSnapshot } from "@/domain/metrics/metric.types";
import type { RuntimeEvent } from "@/runtime/events/EventEngine";

export interface AIContext {
  serverId: string;
  capabilities: Capability[];
  snapshot: ServerSnapshot | null;
  events: RuntimeEvent[];
}

/** AI receives this normalized object only. It never receives an SSH client or credentials. */
export function buildAIContext(input: AIContext): AIContext {
  return {
    serverId: input.serverId,
    capabilities: input.capabilities.map(({ id, name, status, version, providerId, discoveredAt }) => ({ id, name, status, version, providerId, discoveredAt })),
    snapshot: input.snapshot,
    events: input.events,
  };
}
