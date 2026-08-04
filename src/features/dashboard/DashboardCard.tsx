import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";

export function DashboardCard({ title, value, subtitle, icon, titleOutside = false }: { title: string; value?: string; subtitle?: string; icon?: ReactNode; titleOutside?: boolean }) {
  if (titleOutside) return <View style={styles.outerCard}><View style={styles.outerHeader}><Text style={styles.title}>{title}</Text>{icon}</View><View style={[styles.card, styles.outerBody]}><Text style={value ? styles.value : styles.empty}>{value || "—"}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View></View>;
  return (
    <View style={styles.card}>
      <View style={styles.header}><Text style={styles.title}>{title}</Text>{icon}</View>
      {value ? <Text style={styles.value}>{value}</Text> : <Text style={styles.empty}>—</Text>}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outerCard: { flexBasis: "100%", width: "100%", marginVertical: 3, marginHorizontal: -SPACING.md },
  outerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 0, paddingHorizontal: SPACING.md },
  card: { flex: 1, minWidth: 145, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, borderRadius: 10 },
  outerBody: { flex: 0, minHeight: 58, justifyContent: "center", backgroundColor: COLORS.surface, borderRadius: 0, borderLeftWidth: 0, borderRightWidth: 0, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.label },
  value: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.heading2, marginTop: 12 },
  empty: { color: COLORS.textDim, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.heading2, marginTop: 12 },
  subtitle: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.small, marginTop: 6 },
});
