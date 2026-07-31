import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";

export function DashboardCard({ title, value, subtitle, icon }: { title: string; value?: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}><Text style={styles.title}>{title}</Text>{icon}</View>
      {value ? <Text style={styles.value}>{value}</Text> : <Text style={styles.empty}>—</Text>}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 145, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, margin: 5, borderRadius: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.label },
  value: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.heading2, marginTop: 12 },
  empty: { color: COLORS.textDim, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.heading2, marginTop: 12 },
  subtitle: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.small, marginTop: 6 },
});
