import { useSQLiteContext } from "expo-sqlite";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Alert } from "react-native";
import { database, type ServerRecord } from "@/services/database";
import { getServerCredentials } from "@/infrastructure/storage/secureCredentials";
import { serverRuntimeService } from "@/runtime/ServerRuntimeService";
import { serverLogger } from "@/features/servers/serverLogger";

function toDomainServer(server: ServerRecord) {
  return { id: server.id, name: server.name, host: server.host, port: server.port, username: server.username, authType: server.auth_type, fingerprint: server.fingerprint || undefined, createdAt: server.created_at, updatedAt: server.updated_at };
}

export function useServerRuntime(server: ServerRecord | null) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const cached = useQuery({ queryKey: ["server-runtime", server?.id, "cached"], queryFn: async () => {
    if (!server) return null;
    try {
      const result = await serverRuntimeService.getCached(db, server.id);
      serverLogger.info("Cached runtime loaded", { serverId: server.id, hasSnapshot: Boolean(result) });
      return result;
    } catch (error) {
      serverLogger.error("Failed to load cached runtime", error, { serverId: server.id });
      throw error;
    }
  }, enabled: Boolean(server) });
  const live = useQuery({ queryKey: ["server-runtime", server?.id, "live"], queryFn: async () => {
    if (!server) return null;
    serverLogger.info("Starting live server refresh", { serverId: server.id, host: server.host });
    try {
      const credentials = await getServerCredentials(server.id);
      if (!credentials) throw new Error("SERVER_CREDENTIALS_NOT_FOUND");
      const result = await serverRuntimeService.refresh(db, toDomainServer(server), credentials, false, fingerprint => new Promise(resolve => {
        let settled = false;
        const finish = (accepted: boolean) => {
          if (settled) return;
          settled = true;
          resolve(accepted);
        };
        Alert.alert(
          "Verify SSH host",
          `Fingerprint:\n${fingerprint}\n\nOnly continue if this matches your server.`,
          [
            { text: "Reject", style: "cancel", onPress: () => finish(false) },
            {
              text: "Trust fingerprint",
              onPress: () => {
                void database.updateServerFingerprint(db, server.id, fingerprint)
                  .then(() => {
                    serverLogger.info("SSH fingerprint trusted", { serverId: server.id });
                    finish(true);
                  })
                  .catch(error => {
                    serverLogger.error("Failed to save SSH fingerprint", error, { serverId: server.id });
                    finish(false);
                    Alert.alert("Could not trust VPS", "The SSH fingerprint could not be saved. Please try again.");
                  });
              },
            },
          ],
        );
      }));
      await queryClient.invalidateQueries({ queryKey: ["home-snapshot", server.id] });
      serverLogger.info("Live server refresh completed", { serverId: server.id, capabilities: result.capabilities.length, events: result.events.length, health: result.health.status });
      return result;
    } catch (error) {
      serverLogger.error("Live server refresh failed", error, { serverId: server.id, host: server.host });
      throw error;
    }
  }, enabled: Boolean(server), staleTime: 30_000, retry: false });
  const refresh = useCallback(() => {
    if (server) serverLogger.info("Manual server refresh requested", { serverId: server.id });
    return live.refetch();
  }, [live, server]);
  return { data: live.data ?? cached.data ?? null, isLoading: cached.isLoading || live.isLoading, isRefreshing: live.isFetching, error: live.error || cached.error, refresh };
}
