import { ReactNode } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";

export function OnboardingInput({ label, value, onChangeText, placeholder, secureTextEntry = false, rightAccessory, language = "en" }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; secureTextEntry?: boolean; rightAccessory?: ReactNode; language?: "ar" | "en" }) {
  return <View style={styles.group}><Text style={[styles.label, language === "ar" && styles.rtl]}>{label}</Text><View style={styles.field}><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={COLORS.textDim} secureTextEntry={secureTextEntry} autoCapitalize="none" autoCorrect={false} spellCheck={false} textAlign={language === "ar" ? "right" : "left"} style={[styles.input, language === "ar" && styles.rtl]} />{rightAccessory}</View></View>;
}

const styles = StyleSheet.create({
  group: { marginBottom: SPACING.sm },
  label: { color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.tiny, marginBottom: 6 },
  field: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 999, minHeight: 42, paddingHorizontal: SPACING.md, paddingVertical: 4 },
  input: { flex: 1, color: COLORS.text, fontFamily: FONTS.mono, fontSize: FONT_SIZES.body, minHeight: 32, padding: 0 },
  rtl: { writingDirection: "rtl", textAlign: "right" },
});
