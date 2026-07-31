import type { ServerSnapshot } from "@/domain/metrics/metric.types";

export type HealthStatus = "healthy" | "warning" | "critical";

export interface HealthResult {
  status: HealthStatus;
  score: number;
  warnings: string[];
  critical: string[];
}

export function calculateHealth(snapshot: ServerSnapshot): HealthResult {
  const warnings: string[] = [];
  const critical: string[] = [];
  const system = snapshot.system?.data;
  if (system?.memoryTotal && system.memoryUsed / system.memoryTotal >= 0.9) critical.push("Memory usage is above 90%");
  else if (system?.memoryTotal && system.memoryUsed / system.memoryTotal >= 0.8) warnings.push("Memory usage is above 80%");
  if (system?.diskTotal && system.diskUsed / system.diskTotal >= 0.9) critical.push("Disk usage is above 90%");
  else if (system?.diskTotal && system.diskUsed / system.diskTotal >= 0.8) warnings.push("Disk usage is above 80%");
  if (snapshot.system?.error) critical.push(snapshot.system.error);
  if (snapshot.network?.error) warnings.push(snapshot.network.error);
  const score = Math.max(0, 100 - critical.length * 35 - warnings.length * 15);
  return { status: critical.length ? "critical" : warnings.length ? "warning" : "healthy", score, warnings, critical };
}
