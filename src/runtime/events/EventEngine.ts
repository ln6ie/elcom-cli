import type { ServerSnapshot } from "@/domain/metrics/metric.types";

export type EventType = "provider_changed" | "threshold_warning" | "system_rebooted" | "service_failed";

export interface RuntimeEvent {
  id: string;
  serverId: string;
  type: EventType;
  severity: "info" | "warning" | "critical";
  title: string;
  details?: string;
  createdAt: string;
}

export function deriveEvents(previous: ServerSnapshot | null, current: ServerSnapshot): RuntimeEvent[] {
  const events: RuntimeEvent[] = [];
  const system = current.system?.data;
  if (system?.memoryTotal && system.memoryUsed / system.memoryTotal >= 0.9) {
    events.push({ id: `${current.serverId}:memory:${current.collectedAt}`, serverId: current.serverId, type: "threshold_warning", severity: "critical", title: "Memory usage reached 90%", createdAt: current.collectedAt });
  }
  if (system?.diskTotal && system.diskUsed / system.diskTotal >= 0.9) {
    events.push({ id: `${current.serverId}:disk:${current.collectedAt}`, serverId: current.serverId, type: "threshold_warning", severity: "critical", title: "Disk is almost full", createdAt: current.collectedAt });
  }
  if (previous?.system?.data?.uptimeSeconds && system?.uptimeSeconds && system.uptimeSeconds < previous.system.data.uptimeSeconds) {
    events.push({ id: `${current.serverId}:reboot:${current.collectedAt}`, serverId: current.serverId, type: "system_rebooted", severity: "warning", title: "System rebooted", createdAt: current.collectedAt });
  }
  return events;
}
