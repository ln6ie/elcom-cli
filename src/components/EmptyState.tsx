import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";

export function EmptyState({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? <TouchableOpacity style={styles.button} onPress={onAction}><Text style={styles.buttonText}>{actionLabel}</Text></TouchableOpacity> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", padding: SPACING.xl, minHeight: 260 },
  title: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.heading2, textAlign: "center" },
  description: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.body, textAlign: "center", marginTop: SPACING.md, lineHeight: 22 },
  button: { marginTop: SPACING.lg, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: 8 },
  buttonText: { color: "#001018", fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.label },
});
