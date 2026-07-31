import type { VPSProvider } from "@/domain/providers/provider.types";
import { NetworkProvider } from "./network/NetworkProvider";
import { SystemProvider } from "./system/SystemProvider";
import { DockerProvider } from "./docker/DockerProvider";
import { PM2Provider } from "./pm2/PM2Provider";
import { NginxProvider } from "./nginx/NginxProvider";

const providers: VPSProvider<unknown>[] = [new SystemProvider(), new NetworkProvider(), new DockerProvider(), new PM2Provider(), new NginxProvider()];

export function getProvider(providerId: string): VPSProvider<unknown> | undefined {
  return providers.find(provider => provider.id === providerId);
}

export function getProviders(): VPSProvider<unknown>[] {
  return [...providers];
}
