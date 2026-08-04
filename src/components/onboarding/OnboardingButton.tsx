import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";

export function OnboardingButton({ label, onPress, disabled = false, variant = "primary", icon }: { label: string; onPress: () => void; disabled?: boolean; variant?: "primary" | "ghost"; icon?: ReactNode }) {
  return <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.button, variant === "ghost" && styles.ghost, disabled && styles.disabled]}>{icon}{<Text style={[styles.text, variant === "ghost" && styles.ghostText]}>{label}</Text>}</TouchableOpacity>;
}

const styles = StyleSheet.create({ button: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: 10, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 999, marginTop: SPACING.md, flexDirection: "row" }, ghost: { backgroundColor: "transparent", marginTop: 4 }, disabled: { opacity: 0.35 }, text: { color: "#001018", fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small }, ghostText: { color: COLORS.textDim } });
