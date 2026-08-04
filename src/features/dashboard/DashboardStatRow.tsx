import { StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";

export interface DashboardStat { title: string; value?: string; subtitle?: string }

export function DashboardStatRow({ left, right }: { left: DashboardStat; right: DashboardStat }) {
  return <View style={styles.row}><StatCell stat={left} /><View style={styles.divider} /><StatCell stat={right} /></View>;
}

function StatCell({ stat }: { stat: DashboardStat }) {
  return <View style={styles.cell}><Text style={styles.title}>{stat.title}</Text><Text style={stat.value ? styles.value : styles.empty}>{stat.value || "—"}</Text>{stat.subtitle ? <Text style={styles.subtitle}>{stat.subtitle}</Text> : null}</View>;
}

const styles = StyleSheet.create({ row: { flexDirection: "row", width: "auto", minHeight: 76, backgroundColor: COLORS.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, marginVertical: 3, marginHorizontal: -SPACING.md }, cell: { flex: 1, justifyContent: "center", paddingHorizontal: SPACING.md }, divider: { width: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm }, title: { color: COLORS.textDim, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.tiny }, value: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.heading2, marginTop: 5 }, empty: { color: COLORS.textDim, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.heading2, marginTop: 5 }, subtitle: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.tiny, marginTop: 3 } });
