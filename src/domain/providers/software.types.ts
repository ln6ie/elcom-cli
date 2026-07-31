export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
}

export interface DockerMetrics { version?: string; containers: DockerContainer[]; }
export interface PM2Process { id: number; name: string; status: string; cpu: number; memory: number; restarts: number; }
export interface PM2Metrics { version?: string; processes: PM2Process[]; }
export interface NginxMetrics { version?: string; running: boolean; configValid?: boolean; }
