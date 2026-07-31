import { useSQLiteContext } from "expo-sqlite";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import * as Crypto from "expo-crypto";
import { database, type ServerRecord } from "@/services/database";
import { deleteServerCredentials, saveServerCredentials, type ServerCredentials } from "@/infrastructure/storage/secureCredentials";

export function useServers() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["servers"],
    queryFn: () => database.getServers(db),
  });

  const createMutation = useMutation({
    mutationFn: async (input: Omit<ServerRecord, "id" | "created_at" | "updated_at"> & { credentials: ServerCredentials }) => {
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
      await saveServerCredentials(server.id, input.credentials);
      return server;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["servers"] }),
  });

  const removeMutation = useMutation({
    mutationFn: async (serverId: string) => {
      await database.deleteServer(db, serverId);
      await deleteServerCredentials(serverId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["servers"] }),
  });

  const refresh = useCallback(() => queryClient.invalidateQueries({ queryKey: ["servers"] }), [queryClient]);

  return { ...query, servers: query.data ?? [], createServer: createMutation.mutateAsync, removeServer: removeMutation.mutateAsync, refresh };
}
