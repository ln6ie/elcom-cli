import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";
import { SetupScreen, type SetupProvider } from "@/features/auth/SetupScreen";
import { AddVpsStep } from "./AddVpsStep";

export function OnboardingScreen({ onAiConfigured, onFinish }: { onAiConfigured: (key: string, language: "ar" | "en", provider: SetupProvider) => Promise<void>; onFinish: () => Promise<void> }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [serverId, setServerId] = useState<string>();
  const [language, setLanguage] = useState<"ar" | "en">("ar");

  return <SafeAreaView style={styles.container} edges={["top"]}>
    <View style={styles.header}><Text style={styles.brand}>KIMKO CLI</Text><View style={styles.headerRight}><View style={styles.language}><Text style={[styles.languageText, language === "ar" && styles.activeLanguage]} onPress={() => setLanguage("ar")}>ع</Text><Text style={styles.separator}>|</Text><Text style={[styles.languageText, language === "en" && styles.activeLanguage]} onPress={() => setLanguage("en")}>EN</Text></View><Text style={styles.progress}>{step} / 2</Text></View></View>
    {step === 1 ? <AddVpsStep language={language} onSaved={(id) => { setServerId(id); setStep(2); }} onSkip={() => setStep(2)} /> : <View style={styles.aiStep}><Text style={styles.context}>{language === "ar" ? `VPS ${serverId ? "متصل" : "جاهز"}` : `VPS ${serverId ? "CONNECTED" : "READY"}`}</Text><SetupScreen language={language} onLanguageChange={setLanguage} embedded onConnect={onAiConfigured} onSkip={onFinish} /></View>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: SPACING.lg, paddingTop: SPACING.md }, headerRight: { flexDirection: "row", alignItems: "center", gap: SPACING.md }, language: { flexDirection: "row", alignItems: "center", gap: 5 }, languageText: { color: COLORS.textDim, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small }, activeLanguage: { color: COLORS.primary }, separator: { color: COLORS.border },
  brand: { color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small },
  progress: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.small },
  aiStep: { flex: 1 }, context: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.tiny, paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
});
