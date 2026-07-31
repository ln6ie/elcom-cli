import { useRouter } from "expo-router";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";
import { DashboardCard } from "./DashboardCard";
import { EmptyState } from "@/components/EmptyState";
import { useServers } from "@/features/servers/hooks/useServers";

export function HomeScreen() {
  const router = useRouter();
  const { servers, isLoading, refresh } = useServers();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} tintColor={COLORS.primary} />} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>ELCOMCLI / OPERATIONS</Text>
        <Text style={styles.heading}>Home</Text>
        <Text style={styles.subtitle}>Operational status from your connected VPS servers.</Text>
        <View style={styles.grid}>
          <DashboardCard title="SERVERS" value={String(servers.length)} subtitle={servers.length ? "configured" : "not configured"} />
          <DashboardCard title="HEALTH" value="—" subtitle="awaiting first refresh" />
          <DashboardCard title="CPU" subtitle="no live snapshot" />
          <DashboardCard title="MEMORY" subtitle="no live snapshot" />
        </View>
        {!servers.length ? <EmptyState title="No VPS connected" description="Add your first server to start collecting system health and operational metrics directly from your phone." actionLabel="Add first VPS" onAction={() => router.push("/(dashboard)/servers/new")} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: 50 },
  eyebrow: { color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small, marginTop: SPACING.sm },
  heading: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.heading1, marginTop: SPACING.sm },
  subtitle: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.body, marginTop: SPACING.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5, marginTop: SPACING.lg },
});
