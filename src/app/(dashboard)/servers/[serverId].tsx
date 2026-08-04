import { useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useQuery } from "@tanstack/react-query";
import { database } from "@/services/database";
import { useServerRuntime } from "@/features/servers/hooks/useServerRuntime";
import { ServerDetailsScreen } from "@/features/servers/ServerDetailsScreen";

export default function ServerDetailsRoute() {
  const { serverId } = useLocalSearchParams<{ serverId: string }>();
  const db = useSQLiteContext();
  const serverQuery = useQuery({
    queryKey: ["server", serverId],
    queryFn: () => database.getServerById(db, serverId),
    enabled: Boolean(serverId),
  });
  const runtime = useServerRuntime(serverQuery.data ?? null);

  return <ServerDetailsScreen
    server={serverQuery.data ?? null}
    runtime={runtime.data}
    isLoading={serverQuery.isLoading || runtime.isLoading}
    isRefreshing={runtime.isRefreshing}
    discoveryError={runtime.error instanceof Error ? runtime.error.message : undefined}
    onRefresh={() => { void runtime.refresh(); }}
  />;
}
