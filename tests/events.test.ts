import { deriveEvents } from "@/runtime/events/EventEngine";
import type { ServerSnapshot } from "@/domain/metrics/metric.types";

const makeSnapshot = (uptimeSeconds: number): ServerSnapshot => ({ serverId: "server-1", collectedAt: "2026-01-01T00:00:00.000Z", system: { available: true, data: { os: "Linux", kernel: "6", hostname: "vps", memoryTotal: 100, memoryUsed: 95, diskTotal: 100, diskUsed: 95, swapTotal: 0, swapUsed: 0, uptimeSeconds, loadAverage: [0, 0, 0] } } });

describe("EventEngine", () => {
  it("detects thresholds and reboot", () => {
    const events = deriveEvents(makeSnapshot(200), makeSnapshot(10));
    expect(events.map(event => event.type)).toEqual(expect.arrayContaining(["threshold_warning", "system_rebooted"]));
  });
});
