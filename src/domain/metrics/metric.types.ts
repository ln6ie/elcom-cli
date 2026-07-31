export interface SystemMetrics {
  os: string;
  kernel: string;
  hostname: string;
  publicIp?: string;
  privateIp?: string;
  cpuUsage?: number;
  memoryTotal: number;
  memoryUsed: number;
  diskTotal: number;
  diskUsed: number;
  swapTotal: number;
  swapUsed: number;
  uptimeSeconds: number;
  loadAverage: [number, number, number];
}

export interface NetworkMetrics {
  uploadBytes: number;
  downloadBytes: number;
  activeConnections?: number;
  latencyMs?: number;
}

export interface ProviderStatus<T> {
  available: boolean;
  data?: T;
  error?: string;
}

export interface ServerSnapshot {
  serverId: string;
  collectedAt: string;
  system?: ProviderStatus<SystemMetrics>;
  network?: ProviderStatus<NetworkMetrics>;
  docker?: ProviderStatus<unknown>;
  pm2?: ProviderStatus<unknown>;
  nginx?: ProviderStatus<unknown>;
  services?: ProviderStatus<unknown>;
}
