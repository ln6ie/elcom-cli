import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";
import { EmptyState } from "@/components/EmptyState";
import { useServers } from "./hooks/useServers";

export function ServersScreen() {
  const router = useRouter();
  const { servers, isLoading } = useServers();
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}><View><Text style={styles.eyebrow}>INFRASTRUCTURE</Text><Text style={styles.heading}>Servers</Text></View><TouchableOpacity style={styles.add} onPress={() => router.push("/(dashboard)/servers/new")}><Text style={styles.addText}>+ ADD</Text></TouchableOpacity></View>
      <FlatList data={servers} keyExtractor={item => item.id} contentContainerStyle={styles.list} refreshing={isLoading} renderItem={({ item }) => <TouchableOpacity style={styles.row} onPress={() => router.push(`/(dashboard)/servers/${item.id}`)}><View><Text style={styles.name}>{item.name}</Text><Text style={styles.host}>{item.username}@{item.host}:{item.port}</Text></View><Text style={styles.status}>NOT SYNCED</Text></TouchableOpacity>} ListEmptyComponent={<EmptyState title="No servers yet" description="Your VPS inventory will appear here after you add a server." actionLabel="Add VPS" onAction={() => router.push("/(dashboard)/servers/new")} />} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small },
  heading: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.heading1, marginTop: 6 },
  add: { borderWidth: 1, borderColor: COLORS.primary, padding: 10, borderRadius: 6 },
  addText: { color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small },
  list: { padding: SPACING.md, flexGrow: 1 },
  row: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 8, padding: SPACING.md, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.body },
  host: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.small, marginTop: 6 },
  status: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.tiny },
});
