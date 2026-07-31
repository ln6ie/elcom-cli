import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";

export function OnboardingScreen({ onComplete }: { onComplete: () => Promise<void> }) {
  const router = useRouter();
  const complete = async () => { await onComplete(); router.replace("/(dashboard)/home"); };
  return <View style={styles.container}><Text style={styles.eyebrow}>ELCOMCLI V2</Text><Text style={styles.title}>Your VPS, operationally clear.</Text><Text style={styles.description}>Connect directly from your phone, collect health snapshots on demand, and keep AI separate from server operations.</Text><TouchableOpacity style={styles.primary} onPress={() => router.push("/(dashboard)/servers/new")}><Text style={styles.primaryText}>ADD FIRST VPS</Text></TouchableOpacity><TouchableOpacity style={styles.secondary} onPress={() => router.push("/setup")}><Text style={styles.secondaryText}>CONFIGURE AI</Text></TouchableOpacity><TouchableOpacity onPress={complete}><Text style={styles.skip}>SKIP FOR NOW</Text></TouchableOpacity></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: COLORS.background, justifyContent: "center", padding: SPACING.lg }, eyebrow: { color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small }, title: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.heading1, marginTop: SPACING.md, lineHeight: 32 }, description: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.body, lineHeight: 24, marginTop: SPACING.md }, primary: { backgroundColor: COLORS.primary, padding: SPACING.md, alignItems: "center", borderRadius: 8, marginTop: SPACING.xl }, primaryText: { color: "#001018", fontFamily: FONTS.monoBold }, secondary: { borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, alignItems: "center", borderRadius: 8, marginTop: SPACING.md }, secondaryText: { color: COLORS.text, fontFamily: FONTS.monoBold }, skip: { color: COLORS.textDim, fontFamily: FONTS.mono, textAlign: "center", marginTop: SPACING.lg } });
