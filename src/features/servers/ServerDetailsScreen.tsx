// @ts-nocheck
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native";
import * as Crypto from "expo-crypto";
import { useSQLiteContext } from "expo-sqlite";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";
import { database, type ServerRecord } from "@/services/database";
import type { ServerRuntimeResult } from "@/runtime/ServerRuntimeService";
import { DashboardStatRow } from "@/features/dashboard/DashboardStatRow";
import { ServerProviderCards } from "./components/ServerProviderCards";
import { CollapsibleProviderCard } from "./components/CollapsibleProviderCard";
import { useSettings } from "@/hooks/useSettings";
import { TRANSLATIONS } from "@/constants/translations";
import { DirectQueryCard } from "./components/DirectQueryCard";
import { QueryActionCard } from "./components/QueryActionCard";
import { executeServerQuery } from "./serverQueryService";
import { ElcomLoader } from "@/components/ElcomLoader";

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

export function ServerDetailsScreen({ server, runtime, isLoading, isRefreshing, discoveryError, onRefresh, onClose }: { server: ServerRecord | null; runtime?: ServerRuntimeResult | null; isLoading?: boolean; isRefreshing?: boolean; discoveryError?: string; onRefresh?: () => void; onClose?: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const t = TRANSLATIONS[settings.language || "ar"];
  const rtl = settings.language === "ar";
  const [selectedQuery, setSelectedQuery] = useState<{ id: string; name: string; kind: "query" | "service" } | null>(null);
  const savedQueries = useQuery({ queryKey: ["server-queries", server?.id], queryFn: () => server ? database.getServerQueries(db, server.id) : Promise.resolve([]), enabled: Boolean(server) });
  if (!server) return <View style={[styles.container, { paddingTop: insets.top }]}><Text style={[styles.text, rtl && styles.rtlText]}>{rtl ? "الخادم غير موجود." : "Server not found."}</Text></View>;
  const capabilities = runtime?.capabilities ?? [];
  const available = new Set(capabilities.filter(capability => capability.status === "available").map(capability => capability.id));
  const system = runtime?.snapshot.system?.data;
  const network = runtime?.snapshot.network?.data;
  const status = runtime?.health.status.toUpperCase() || "UNKNOWN";
  const saveQuery = async (name: string, command: string, output: string) => {
    const normalizedName = name.trim().toLocaleLowerCase();
    const normalizedCommand = command.trim();
    const duplicate = (savedQueries.data ?? []).find(query => query.name.trim().toLocaleLowerCase() === normalizedName || query.command.trim() === normalizedCommand);
    if (duplicate) {
      Alert.alert(rtl ? "الاستعلام موجود" : "Query already exists", rtl ? "يوجد استعلام بنفس الاسم أو الأمر محفوظ مسبقًا." : "A query with the same name or command is already saved.");
      return;
    }
    const now = new Date().toISOString();
    await database.saveServerQuery(db, { id: Crypto.randomUUID(), server_id: server.id, name: name.trim(), command: normalizedCommand, created_at: now, updated_at: now, last_output: output, last_error: null, last_run_at: now });
    await queryClient.invalidateQueries({ queryKey: ["server-queries", server.id] });
  };
  return <View style={styles.container}><Text style={[styles.back, { top: insets.top + 8 }, rtl && styles.rtlText]} onPress={onClose ?? (() => router.back())}>{rtl ? `${t.server_back} ›` : `‹ ${t.server_back}`}</Text><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: insets.top + 48 }]}> 
    <Text style={[styles.heading, rtl && styles.rtlText]}>{server.name}</Text>
    <Text style={styles.host}>{server.username}@{server.host}:{server.port}</Text>
    <DirectQueryCard onExecute={(command, signal, sudoPassword) => executeServerQuery(server, command, signal, sudoPassword)} onSave={(name, command, output) => { void saveQuery(name, command, output); }} />
    <View style={styles.grid}><DashboardStatRow left={{ title: "HEALTH", value: status, subtitle: runtime ? `${runtime.health.score}/100` : isLoading ? "loading" : "no snapshot" }} right={{ title: "CPU", value: system?.cpuUsage !== undefined ? `${system.cpuUsage}%` : undefined, subtitle: system ? "latest snapshot" : "not collected" }} /><DashboardStatRow left={{ title: "MEMORY", value: system?.memoryTotal ? `${Math.round((system.memoryUsed / system.memoryTotal) * 100)}%` : undefined, subtitle: system ? "latest snapshot" : "not collected" }} right={{ title: "DISK", value: system?.diskTotal ? `${Math.round((system.diskUsed / system.diskTotal) * 100)}%` : undefined, subtitle: system ? "latest snapshot" : "not collected" }} /><DashboardStatRow left={{ title: "DOWNLOAD", value: network ? formatBytes(network.downloadBytes) : undefined, subtitle: network ? "traffic" : "not collected" }} right={{ title: "UPLOAD", value: network ? formatBytes(network.uploadBytes) : undefined, subtitle: network ? "traffic" : "not collected" }} /><DashboardStatRow left={{ title: "CONNECTIONS", value: network?.activeConnections !== undefined ? String(network.activeConnections) : undefined, subtitle: network ? "active" : "not collected" }} right={{ title: "LATENCY", value: network?.latencyMs !== undefined ? `${network.latencyMs} ms` : undefined, subtitle: network ? "round trip" : "not collected" }} /></View>
    <Text style={[styles.section, rtl && styles.rtlText]}>{t.server_services}</Text>
    {runtime ? <ServerProviderCards snapshot={runtime.snapshot} capabilities={capabilities} onLongPress={(id, name) => { console.info("[Servers] Service deletion requested", { serverId: server.id, id, name }); setSelectedQuery({ id, name, kind: "service" }); }} /> : <Text style={styles.muted}>{discoveryError ? `Discovery unavailable: ${discoveryError}` : "No runtime snapshot yet. Refresh this server to collect metrics."}</Text>}
    {savedQueries.data?.map(query => <CollapsibleProviderCard key={query.id} title={query.name} status="AVAILABLE" subtitle="SAVED QUERY LOG" rows={[]} logs={query.last_output ? query.last_output.split("\n") : [`$ ${query.command}`]} onLongPress={() => setSelectedQuery({ id: query.id, name: query.name, kind: "query" })} />)}
    {runtime?.events.length ? <><Text style={[styles.section, rtl && styles.rtlText]}>{t.server_activity}</Text>{runtime.events.slice(0, 10).map(event => <View key={event.id} style={styles.event}><View style={[styles.dot, event.severity === "critical" ? styles.critical : event.severity === "warning" ? styles.warning : styles.info]} /><View><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.version}>{new Date(event.createdAt).toLocaleString()}</Text></View></View>)}</> : null}
  </ScrollView>{isRefreshing ? <View pointerEvents="none" style={[styles.refreshLoader, { top: insets.top + 54 }]}><ElcomLoader size="small" /></View> : null}<QueryActionCard visible={Boolean(selectedQuery)} name={selectedQuery?.name || ""} onClose={() => setSelectedQuery(null)} onDelete={() => { if (!selectedQuery) return; const remove = () => { const target = selectedQuery; const deletion = target.kind === "query" ? database.deleteServerQuery(db, target.id) : database.deleteCapability(db, server.id, target.id); void deletion.then(() => { setSelectedQuery(null); if (target.kind === "query") return queryClient.invalidateQueries({ queryKey: ["server-queries", server.id] }); const filter = (value: ServerRuntimeResult | null | undefined) => value ? { ...value, capabilities: value.capabilities.filter(capability => capability.id !== target.id && capability.providerId !== target.id) } : value; queryClient.setQueryData(["server-runtime", server.id, "live"], filter); queryClient.setQueryData(["server-runtime", server.id, "cached"], filter); }); }; if (Platform.OS === "ios") { remove(); return; } Alert.alert(rtl ? "تأكيد الحذف" : "Confirm deletion", rtl ? "هل تريد حذف هذا العنصر من قاعدة البيانات؟" : "Delete this item from the database?", [{ text: rtl ? "إلغاء" : "Cancel", style: "cancel" }, { text: rtl ? "حذف" : "Delete", style: "destructive", onPress: remove }]); }} /></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: COLORS.background }, content: { padding: SPACING.md }, back: { position: "absolute", zIndex: 10, elevation: 10, left: SPACING.md, color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small, paddingVertical: 6, paddingRight: 12 }, heading: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.heading1 }, host: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.body, marginTop: 8 }, refresh: { color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small, marginTop: SPACING.md }, grid: { marginTop: SPACING.lg }, section: { color: COLORS.textDim, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.label, marginTop: SPACING.lg, marginBottom: 8 }, provider: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, padding: SPACING.md, borderRadius: 8, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, providerName: { color: COLORS.text, fontFamily: FONTS.mono }, version: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.small, marginTop: 4 }, available: { color: COLORS.success, fontFamily: FONTS.mono, fontSize: FONT_SIZES.tiny }, muted: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.body, lineHeight: 22 }, event: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 8, padding: SPACING.md, marginBottom: 8 }, eventTitle: { color: COLORS.text, fontFamily: FONTS.mono, fontSize: FONT_SIZES.body }, dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 }, info: { backgroundColor: COLORS.primary }, warning: { backgroundColor: "#E0A300" }, critical: { backgroundColor: COLORS.error }, text: { color: COLORS.text, padding: SPACING.lg }, rtlText: { writingDirection: "rtl", textAlign: "right" } });
Object.assign(styles, { refreshLoader: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 20 } });
