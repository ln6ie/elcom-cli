import { useSQLiteContext } from "expo-sqlite";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import * as Crypto from "expo-crypto";
import { database, type ServerRecord } from "@/services/database";
import { deleteServerCredentials, saveServerCredentials, type ServerCredentials } from "@/infrastructure/storage/secureCredentials";
import { serverLogger } from "@/features/servers/serverLogger";

export function useServers() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["servers"],
    queryFn: async () => {
      serverLogger.info("Loading server inventory");
      try {
        const servers = await database.getServers(db);
        serverLogger.info("Server inventory loaded", { count: servers.length });
        return servers;
      } catch (error) {
        serverLogger.error("Failed to load server inventory", error);
        throw error;
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: Omit<ServerRecord, "id" | "created_at" | "updated_at"> & { credentials: ServerCredentials }) => {
      serverLogger.info("Saving server", { name: input.name, host: input.host, authType: input.auth_type });
      const now = new Date().toISOString();
      const server: ServerRecord = {
        id: Crypto.randomUUID(),
        created_at: now,
        updated_at: now,
        name: input.name,
        host: input.host,
        port: input.port,
        username: input.username,
        auth_type: input.auth_type,
        fingerprint: input.fingerprint,
      };
      await database.saveServer(db, server);
      try {
        await saveServerCredentials(server.id, input.credentials);
        serverLogger.info("Server saved", { serverId: server.id, host: server.host });
        return server;
      } catch (error) {
        serverLogger.error("Failed to save server credentials", error, { serverId: server.id });
        throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["servers"] }),
  });

  const removeMutation = useMutation({
    mutationFn: async (serverId: string) => {
      serverLogger.info("Removing server", { serverId });
      try {
        await database.deleteServer(db, serverId);
        await deleteServerCredentials(serverId);
      } catch (error) {
        serverLogger.error("Failed to remove server", error, { serverId });
        throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["servers"] }),
  });

  const refresh = useCallback(() => queryClient.invalidateQueries({ queryKey: ["servers"] }), [queryClient]);

  return { ...query, servers: query.data ?? [], createServer: createMutation.mutateAsync, removeServer: removeMutation.mutateAsync, refresh };
}
