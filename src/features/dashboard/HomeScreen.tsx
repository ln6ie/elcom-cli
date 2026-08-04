import { useRouter } from "expo-router";
import { Animated, PanResponder, ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useRef, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useQueries, useQuery } from "@tanstack/react-query";
import { database, type ServerRecord } from "@/services/database";
import { Plus, Settings } from "lucide-react-native";
import AiIcon from "../../../assets/icon.svg";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";
import { DashboardStatRow } from "./DashboardStatRow";
import { EmptyState } from "@/components/EmptyState";
import { ElcomLoader } from "@/components/ElcomLoader";
import { useServers } from "@/features/servers/hooks/useServers";
import { SettingsDrawerOverlay } from "@/features/settings/SettingsDrawerOverlay";
import { SettingsScreen } from "@/features/settings/SettingsScreen";
import { TRANSLATIONS } from "@/constants/translations";
import { useSettings } from "@/hooks/useSettings";
import { useServerRuntime } from "@/features/servers/hooks/useServerRuntime";

type RecentConversation = { id: string; title: string | null; last_message_at?: string };

function HomeServerRuntimeLoader({ server }: { server: ServerRecord }) {
  useServerRuntime(server);
  return null;
}

export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { servers, isLoading, refresh } = useServers();
  const appSettings = useSettings();
  const t = TRANSLATIONS[appSettings.settings.language || "ar"];
  const db = useSQLiteContext();
  const snapshots = useQueries({ queries: servers.map(server => ({ queryKey: ["home-snapshot", server.id], queryFn: () => database.getLatestServerSnapshot(db, server.id) })) });
  const conversations = useQuery({ queryKey: ["home-conversations"], queryFn: () => database.getAllConversations(db) });
  const [refreshing, setRefreshing] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const pullDistance = useRef(new Animated.Value(0)).current;
  const scrollOffset = useRef(0);
  const refreshingRef = useRef(refreshing);
  const loadingRef = useRef(isLoading);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
      Animated.spring(pullDistance, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
    }
  };
  useEffect(() => { refreshingRef.current = refreshing; }, [refreshing]);
  useEffect(() => { loadingRef.current = isLoading; }, [isLoading]);
  const pullResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponderCapture: (_, gesture) => {
      if (refreshingRef.current || loadingRef.current) return false;
      return scrollOffset.current <= 1 && gesture.dy > 10 && gesture.dy > Math.abs(gesture.dx) * 1.2;
    },
    onPanResponderMove: (_, gesture) => {
      pullDistance.setValue(Math.min(88, Math.max(0, gesture.dy * 0.45)));
    },
    onPanResponderRelease: (_, gesture) => {
      const distance = Math.min(88, Math.max(0, gesture.dy * 0.45));
      if (distance >= 52) {
        Animated.timing(pullDistance, { toValue: 38, duration: 140, useNativeDriver: true }).start();
        void onRefresh();
      } else {
        Animated.spring(pullDistance, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
      }
    },
    onPanResponderTerminate: () => {
      Animated.spring(pullDistance, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
    },
  })).current;
  const metrics = snapshots.map(query => { if (!query.data) return null; try { return JSON.parse(query.data.payload) as { system?: { data?: { cpuUsage?: number; memoryTotal?: number; memoryUsed?: number; diskTotal?: number; diskUsed?: number } } }; } catch { return null; } }).filter(Boolean);
  const systems = metrics.map(item => item?.system?.data).filter(Boolean);
  const average = (values: number[]) => values.length ? `${Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)}%` : undefined;
  const cpu = average(systems.map(system => system?.cpuUsage ?? 0));
  const memory = average(systems.filter(system => system?.memoryTotal).map(system => ((system?.memoryUsed ?? 0) / (system?.memoryTotal ?? 1)) * 100));
  const disk = average(systems.filter(system => system?.diskTotal).map(system => ((system?.diskUsed ?? 0) / (system?.diskTotal ?? 1)) * 100));

  return (
    <SettingsDrawerOverlay
      visible={settingsVisible}
      onOpen={() => setSettingsVisible(true)}
      onClose={() => { setSettingsVisible(false); void appSettings.refresh(); }}
      drawerContent={<SettingsScreen
        settings={appSettings.settings}
        customModels={appSettings.customModels}
        modelPresets={appSettings.modelPresets}
        openRouterModels={appSettings.openRouterModels}
        openCodeModels={appSettings.openCodeModels}
        modelsLoading={appSettings.modelsLoading}
        modelsError={appSettings.modelsError}
        onSave={appSettings.updateMultipleSettings}
        onAddCustomModel={appSettings.addCustomModel}
        onRemoveCustomModel={appSettings.removeCustomModel}
        onRenameCustomModel={appSettings.renameCustomModel}
        onBack={() => setSettingsVisible(false)}
        onRetryModels={appSettings.refreshModels}
      />}
    >
      <View style={styles.container}>
      {servers.map(server => <HomeServerRuntimeLoader key={`runtime-${server.id}`} server={server} />)}
      <Animated.View
        {...pullResponder.panHandlers}
        style={[styles.pullLayer, { transform: [{ translateY: pullDistance }] }]}
      >
      <ScrollView showsVerticalScrollIndicator={false} onScroll={(event) => { scrollOffset.current = event.nativeEvent.contentOffset.y; }} scrollEventThrottle={16} contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.md }]}>
        <Text style={[styles.eyebrow, appSettings.settings.language === "ar" && styles.rtlText]}>{t.dashboard_eyebrow}</Text>
        <Text style={[styles.heading, appSettings.settings.language === "ar" && styles.rtlText]}>{t.dashboard_overview}</Text>
        <Text style={[styles.subtitle, appSettings.settings.language === "ar" && styles.rtlText]}>{t.dashboard_subtitle}</Text>
        <View style={styles.stats}><DashboardStatRow left={{ title: "SERVERS", value: String(servers.length), subtitle: servers.length ? "configured" : "not configured" }} right={{ title: "HEALTH", value: systems.length ? "ONLINE" : "—", subtitle: systems.length ? `${systems.length} snapshot(s)` : "awaiting refresh" }} /><DashboardStatRow left={{ title: "CPU", value: cpu, subtitle: cpu ? "average usage" : "no snapshot" }} right={{ title: "MEMORY", value: memory, subtitle: memory ? "average usage" : "no snapshot" }} /><DashboardStatRow left={{ title: "DISK", value: disk, subtitle: disk ? "average usage" : "no snapshot" }} right={{ title: "VPS", value: String(servers.length), subtitle: "inventory" }} /></View>
        {servers.length ? <><View style={styles.sectionHeader}><Text style={styles.section}>VPS INVENTORY</Text><TouchableOpacity style={styles.addIcon} onPress={() => router.push("/(dashboard)/servers/new")}><Plus size={18} color="#001018" /></TouchableOpacity></View>{servers.map(server => <TouchableOpacity key={server.id} style={styles.serverRow} onPress={() => router.push(`/(dashboard)/servers/${server.id}`)}><View><Text style={styles.serverName}>{server.name}</Text><Text style={styles.serverHost}>{server.username}@{server.host}</Text></View><Text style={styles.serverStatus}>{snapshots.find(query => query.data && query.data.server_id === server.id) ? "SYNCED" : "NO SNAPSHOT"}</Text></TouchableOpacity>)}</> : <EmptyState title="No VPS connected" description="Add your first server to start collecting system health and operational metrics directly from your phone." actionLabel="Add first VPS" onAction={() => router.push("/(dashboard)/servers/new")} />}
        <Text style={[styles.section, appSettings.settings.language === "ar" && styles.rtlText]}>{t.dashboard_recent_chats}</Text>
        {((conversations.data ?? []) as RecentConversation[]).slice(0, 5).map((conversation) => <TouchableOpacity key={conversation.id} style={styles.chatRow} onPress={() => router.push(`/(main)/chat?conversationId=${conversation.id}`)}><Text style={styles.chatTitle} numberOfLines={1}>{conversation.title || "Untitled conversation"}</Text><Text style={styles.chatDate}>{conversation.last_message_at || ""}</Text></TouchableOpacity>)}
        {!conversations.data?.length ? <Text style={styles.emptyText}>No AI conversations yet.</Text> : null}
      </ScrollView>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.refreshLoader, { opacity: refreshing || isLoading ? 1 : pullDistance.interpolate({ inputRange: [0, 52], outputRange: [0, 1], extrapolate: "clamp" }) }]}><ElcomLoader size="small" /></Animated.View>
      <TouchableOpacity accessibilityLabel={t.settings} style={[styles.settingsFab, { top: insets.top + 8 }, rtlFabStyle(appSettings.settings.language === "ar", 20)]} onPress={() => setSettingsVisible(true)}><Settings size={19} color="#001018" /></TouchableOpacity>
      <TouchableOpacity accessibilityLabel="Open AI chat" style={[styles.fab, { top: insets.top + 8 }, rtlFabStyle(appSettings.settings.language === "ar", 58)]} onPress={() => router.push("/(main)/chat")}><AiIcon width={22} height={22} /></TouchableOpacity>
      </View>
    </SettingsDrawerOverlay>
  );
}

function rtlFabStyle(isArabic: boolean, offset: number) {
  return isArabic ? { right: undefined, left: offset } : { right: offset, left: undefined };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  pullLayer: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: 50 },
  eyebrow: { color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small, marginTop: SPACING.sm },
  heading: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.heading1, marginTop: SPACING.sm },
  subtitle: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.body, marginTop: SPACING.sm },
  stats: { marginTop: SPACING.lg },
  section: { color: COLORS.textDim, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.label, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: SPACING.lg, marginBottom: SPACING.sm },
  addIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  serverRow: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderTopWidth: 1, borderBottomWidth: 1, padding: SPACING.md, marginHorizontal: -SPACING.md, marginVertical: 3, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  serverName: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.body }, serverHost: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.small, marginTop: 4 }, serverStatus: { color: COLORS.success, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.tiny },
  chatRow: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderTopWidth: 1, borderBottomWidth: 1, padding: SPACING.md, marginHorizontal: -SPACING.md, marginVertical: 3, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, chatTitle: { color: COLORS.text, fontFamily: FONTS.mono, flex: 1 }, chatDate: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.tiny, marginLeft: 8 }, emptyText: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.small }, settingsFab: { position: "absolute", right: 20, width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" }, fab: { position: "absolute", right: 58, width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.neutralButton, alignItems: "center", justifyContent: "center" },
  refreshLoader: { position: "absolute", top: 88, left: 0, right: 0, alignItems: "center", zIndex: 5 },
  rtlText: { writingDirection: "rtl", textAlign: "right" },
});
