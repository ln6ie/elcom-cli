import { useSQLiteContext } from "expo-sqlite";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { Alert } from "react-native";
import { database, type ServerRecord } from "@/services/database";
import { getServerCredentials } from "@/infrastructure/storage/secureCredentials";
import { serverRuntimeService } from "@/runtime/ServerRuntimeService";

function toDomainServer(server: ServerRecord) {
  return { id: server.id, name: server.name, host: server.host, port: server.port, username: server.username, authType: server.auth_type, fingerprint: server.fingerprint || undefined, createdAt: server.created_at, updatedAt: server.updated_at };
}

export function useServerRuntime(server: ServerRecord | null) {
  const db = useSQLiteContext();
  const cached = useQuery({ queryKey: ["server-runtime", server?.id, "cached"], queryFn: () => server ? serverRuntimeService.getCached(db, server.id) : null, enabled: Boolean(server) });
  const live = useQuery({ queryKey: ["server-runtime", server?.id, "live"], queryFn: async () => { if (!server) return null; const credentials = await getServerCredentials(server.id); if (!credentials) throw new Error("SERVER_CREDENTIALS_NOT_FOUND"); return serverRuntimeService.refresh(db, toDomainServer(server), credentials, false, fingerprint => new Promise(resolve => Alert.alert("Verify SSH host", `Fingerprint:\n${fingerprint}\n\nOnly continue if this matches your server.`, [{ text: "Reject", style: "cancel", onPress: () => resolve(false) }, { text: "Trust fingerprint", onPress: async () => { await database.updateServerFingerprint(db, server.id, fingerprint); resolve(true); } }]))); }, enabled: Boolean(server), staleTime: 30_000, retry: false });
  const refresh = useCallback(() => live.refetch(), [live]);
  return { data: live.data ?? cached.data ?? null, isLoading: cached.isLoading || live.isLoading, isRefreshing: live.isFetching, error: live.error || cached.error, refresh };
}
