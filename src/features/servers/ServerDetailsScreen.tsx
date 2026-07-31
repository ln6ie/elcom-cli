import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";
import type { ServerRecord } from "@/services/database";
import type { ServerRuntimeResult } from "@/runtime/ServerRuntimeService";
import { DashboardCard } from "@/features/dashboard/DashboardCard";

export function ServerDetailsScreen({ server, runtime, isLoading, isRefreshing, discoveryError, onRefresh }: { server: ServerRecord | null; runtime?: ServerRuntimeResult | null; isLoading?: boolean; isRefreshing?: boolean; discoveryError?: string; onRefresh?: () => void }) {
  const router = useRouter();
  if (!server) return <SafeAreaView style={styles.container}><Text style={styles.text}>Server not found.</Text></SafeAreaView>;
  const capabilities = runtime?.capabilities ?? [];
  const available = new Set(capabilities.filter(capability => capability.status === "available").map(capability => capability.id));
  const system = runtime?.snapshot.system?.data;
  const status = runtime?.health.status.toUpperCase() || "UNKNOWN";
  return <SafeAreaView style={styles.container} edges={["top"]}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.back} onPress={() => router.back()}>‹ SERVERS</Text>
    <Text style={styles.heading}>{server.name}</Text>
    <Text style={styles.host}>{server.username}@{server.host}:{server.port}</Text>
    <Text style={styles.refresh} onPress={onRefresh}>{isRefreshing ? "SYNCING..." : "↻ REFRESH"}</Text>
    <View style={styles.grid}><DashboardCard title="HEALTH" value={status} subtitle={runtime ? `${runtime.health.score}/100` : isLoading ? "loading" : "no snapshot"} /><DashboardCard title="CPU" value={system?.cpuUsage !== undefined ? `${system.cpuUsage}%` : undefined} subtitle={system ? "latest snapshot" : "not collected"} /><DashboardCard title="MEMORY" value={system?.memoryTotal ? `${Math.round((system.memoryUsed / system.memoryTotal) * 100)}%` : undefined} subtitle={system ? "latest snapshot" : "not collected"} /><DashboardCard title="DISK" value={system?.diskTotal ? `${Math.round((system.diskUsed / system.diskTotal) * 100)}%` : undefined} subtitle={system ? "latest snapshot" : "not collected"} /></View>
    <Text style={styles.section}>DISCOVERED CAPABILITIES</Text>
    {capabilities.filter(capability => available.has(capability.id)).map(capability => <View key={capability.id} style={styles.provider}><View><Text style={styles.providerName}>{capability.name}</Text>{capability.version ? <Text style={styles.version}>{capability.version}</Text> : null}</View><Text style={styles.available}>AVAILABLE</Text></View>)}
    {!capabilities.some(capability => available.has(capability.id)) ? <Text style={styles.muted}>{discoveryError ? `Discovery unavailable: ${discoveryError}` : "No discovery snapshot yet. Refreshing this server will detect installed software."}</Text> : null}
    {runtime?.events.length ? <><Text style={styles.section}>RECENT ACTIVITY</Text>{runtime.events.slice(0, 10).map(event => <View key={event.id} style={styles.event}><View style={[styles.dot, event.severity === "critical" ? styles.critical : event.severity === "warning" ? styles.warning : styles.info]} /><View><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.version}>{new Date(event.createdAt).toLocaleString()}</Text></View></View>)}</> : null}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: COLORS.background }, content: { padding: SPACING.md }, back: { color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small, marginBottom: SPACING.lg }, heading: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.heading1 }, host: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.body, marginTop: 8 }, refresh: { color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small, marginTop: SPACING.md }, grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5, marginTop: SPACING.lg }, section: { color: COLORS.textDim, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.label, marginTop: SPACING.lg, marginBottom: 8 }, provider: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, padding: SPACING.md, borderRadius: 8, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, providerName: { color: COLORS.text, fontFamily: FONTS.mono }, version: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.small, marginTop: 4 }, available: { color: COLORS.success, fontFamily: FONTS.mono, fontSize: FONT_SIZES.tiny }, muted: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.body, lineHeight: 22 }, event: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 8, padding: SPACING.md, marginBottom: 8 }, eventTitle: { color: COLORS.text, fontFamily: FONTS.mono, fontSize: FONT_SIZES.body }, dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 }, info: { backgroundColor: COLORS.primary }, warning: { backgroundColor: "#E0A300" }, critical: { backgroundColor: COLORS.error }, text: { color: COLORS.text, padding: SPACING.lg } });
