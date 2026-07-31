import { calculateHealth } from "@/runtime/health/HealthEngine";
import type { ServerSnapshot } from "@/domain/metrics/metric.types";

const snapshot = (memoryUsed: number, memoryTotal: number, diskUsed: number, diskTotal: number): ServerSnapshot => ({
  serverId: "server-1",
  collectedAt: new Date().toISOString(),
  system: { available: true, data: { os: "Linux", kernel: "6", hostname: "vps", memoryTotal, memoryUsed, diskTotal, diskUsed, swapTotal: 0, swapUsed: 0, uptimeSeconds: 100, loadAverage: [0, 0, 0] } },
});

describe("HealthEngine", () => {
  it("returns healthy for normal metrics", () => expect(calculateHealth(snapshot(20, 100, 20, 100)).status).toBe("healthy"));
  it("returns warning for elevated metrics", () => expect(calculateHealth(snapshot(85, 100, 20, 100)).status).toBe("warning"));
  it("returns critical for saturated metrics", () => expect(calculateHealth(snapshot(95, 100, 95, 100)).status).toBe("critical"));
});
