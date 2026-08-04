import type { ServerSnapshot } from "@/domain/metrics/metric.types";
import type { Capability } from "@/domain/providers/provider.types";
import type { DockerMetrics, NginxMetrics, PM2Metrics } from "@/domain/providers/software.types";
import type { ReactNode } from "react";
import React from "react";
import { CollapsibleProviderCard, type ProviderCardRow } from "./CollapsibleProviderCard";

const text = (value: unknown, fallback = "—") => value === undefined || value === null || value === "" ? fallback : String(value);
const bytes = (value: number) => { if (!value) return "0 B"; const units = ["B", "KB", "MB", "GB", "TB"]; const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1); return `${(value / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`; };
const percent = (used: number, total: number) => total > 0 ? `${Math.round((used / total) * 100)}%` : "—";
const status = (data: unknown, error?: string): "AVAILABLE" | "ERROR" | "NOT DETECTED" => error ? "ERROR" : data ? "AVAILABLE" : "NOT DETECTED";

export function ServerProviderCards({ snapshot, capabilities, onLongPress }: { snapshot?: ServerSnapshot; capabilities: Capability[]; onLongPress?: (id: string, name: string) => void }) {
  const cards: ReactNode[] = [];
  const has = (id: string) => capabilities.some(capability => capability.status === "available" && (capability.id === id || capability.providerId === id));
  snapshot = snapshot ? { ...snapshot, pm2: has("pm2") ? snapshot.pm2 : undefined, docker: has("docker") ? snapshot.docker : undefined, nginx: has("nginx") ? snapshot.nginx : undefined } : snapshot;
  const system = snapshot?.system?.data;
  if (has("system")) cards.push(<CollapsibleProviderCard key="system" title="SYSTEM" status={status(system, snapshot?.system?.error)} subtitle={system?.hostname} error={snapshot?.system?.error} rows={system ? [{ label: "OS", value: system.os }, { label: "Kernel", value: system.kernel }, { label: "CPU", value: text(system.cpuUsage, "0") + "%" }, { label: "Memory", value: percent(system.memoryUsed, system.memoryTotal) }, { label: "Disk", value: percent(system.diskUsed, system.diskTotal) }, { label: "Load", value: system.loadAverage.map(item => item.toFixed(2)).join(" / ") }, { label: "Uptime", value: `${Math.round(system.uptimeSeconds / 3600)}h` }] : []} />);

  const network = snapshot?.network?.data;
  if (has("network")) cards.push(<CollapsibleProviderCard key="network" title="NETWORK" status={status(network, snapshot?.network?.error)} error={snapshot?.network?.error} rows={network ? [{ label: "Active connections", value: text(network.activeConnections, "0") }, { label: "Latency", value: network.latencyMs === undefined ? "—" : `${network.latencyMs} ms` }, { label: "Inbound traffic", value: bytes(network.downloadBytes) }, { label: "Outbound traffic", value: bytes(network.uploadBytes) }] : []} />);

  const pm2 = snapshot?.pm2?.data as PM2Metrics | undefined;
  if (pm2 || snapshot?.pm2) cards.push(<CollapsibleProviderCard key="pm2" title="PM2" status={status(pm2, snapshot?.pm2?.error)} subtitle={pm2?.version} error={snapshot?.pm2?.error} rows={pm2 ? [{ label: "Running", value: String(pm2.processes.filter(process => process.status === "online").length) }, { label: "Stopped", value: String(pm2.processes.filter(process => process.status !== "online").length) }, { label: "Total processes", value: String(pm2.processes.length) }, { label: "Total restarts", value: String(pm2.processes.reduce((sum, process) => sum + process.restarts, 0)) }] : []} logs={pm2?.logs ?? []} />);

  const docker = snapshot?.docker?.data as DockerMetrics | undefined;
  if (docker || snapshot?.docker) cards.push(<CollapsibleProviderCard key="docker" title="DOCKER" status={status(docker, snapshot?.docker?.error)} subtitle={docker?.version} error={snapshot?.docker?.error} rows={docker ? [{ label: "Running containers", value: String(docker.containers.filter(container => container.state === "running").length) }, { label: "Stopped containers", value: String(docker.containers.filter(container => container.state !== "running").length) }, { label: "Total containers", value: String(docker.containers.length) }] : []} logs={docker?.logs ?? []} />);

  const nginx = snapshot?.nginx?.data as NginxMetrics | undefined;
  if (nginx || snapshot?.nginx) cards.push(<CollapsibleProviderCard key="nginx" title="NGINX" status={status(nginx, snapshot?.nginx?.error)} subtitle={nginx?.version} error={snapshot?.nginx?.error} rows={nginx ? [{ label: "Status", value: nginx.running ? "Running" : "Stopped" }, { label: "Configuration", value: nginx.configValid ? "Valid" : "Invalid" }] : []} logs={nginx?.logs ?? []} />);

  const rendered = new Set(["system", "network", "pm2", "docker", "nginx"]);
  capabilities.filter(capability => capability.status === "available" && !rendered.has(capability.providerId || capability.id)).forEach(capability => cards.push(<CollapsibleProviderCard key={capability.id} title={capability.name.toUpperCase()} status="AVAILABLE" subtitle="Detected capability" rows={[{ label: "Status", value: "Available" }]} />));
  return <>{cards.map(card => React.isValidElement(card) ? React.cloneElement(card as React.ReactElement<{ onLongPress?: () => void }>, { onLongPress: () => { const id = String(card.key).replace(".$", ""); console.info("[Servers] Provider long press", { id, key: String(card.key) }); onLongPress?.(id, id.toUpperCase()); } }) : card)}</>;
}
