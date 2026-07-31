import { useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useQuery } from "@tanstack/react-query";
import { ServerDetailsScreen } from "@/features/servers/ServerDetailsScreen";
import { database } from "@/services/database";
import { useServerRuntime } from "@/features/servers/hooks/useServerRuntime";

export default function ServerDetailsRoute() {
  const { serverId } = useLocalSearchParams<{ serverId: string }>();
  const db = useSQLiteContext();
  const { data } = useQuery({ queryKey: ["server", serverId], queryFn: () => database.getServerById(db, serverId), enabled: Boolean(serverId) });
  const runtime = useServerRuntime(data ?? null);
  return <ServerDetailsScreen server={data ?? null} runtime={runtime.data} isLoading={runtime.isLoading} isRefreshing={runtime.isRefreshing} discoveryError={runtime.error instanceof Error ? runtime.error.message : undefined} onRefresh={() => { void runtime.refresh(); }} />;
}
