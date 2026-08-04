import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";
import { useServers } from "@/features/servers/hooks/useServers";
import type { ServerAuthType } from "@/services/database";
import { serverLogger } from "@/features/servers/serverLogger";
import { OnboardingButton } from "@/components/onboarding/OnboardingButton";
import { OnboardingInput } from "@/components/onboarding/OnboardingInput";
import { OnboardingOptionGroup } from "@/components/onboarding/OnboardingOptionGroup";

export function AddVpsStep({ onSaved, onSkip, language = "ar", inBottomSheet = false }: { onSaved: (serverId: string) => void; onSkip?: () => void; language?: "ar" | "en"; inBottomSheet?: boolean }) {
  const { createServer } = useServers();
  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("22");
  const [username, setUsername] = useState("root");
  const [authType, setAuthType] = useState<ServerAuthType>("private_key");
  const [secret, setSecret] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || !host.trim() || !username.trim() || !secret.trim()) {
      Alert.alert("Missing information", "Complete the server name, host, username, and credential.");
      return;
    }
    setSaving(true);
    try {
      const server = await createServer({
        name: name.trim(), host: host.trim(), port: Number(port) || 22,
        username: username.trim(), auth_type: authType, fingerprint: null,
        credentials: authType === "password" ? { password: secret } : { privateKey: secret },
      });
      onSaved(server.id);
    } catch (error) {
      serverLogger.error("Onboarding VPS save failed", error, { host: host.trim(), authType });
      Alert.alert("Could not save server", error instanceof Error ? error.message : "Unknown error");
    } finally { setSaving(false); }
  };

  const ar = language === "ar";
  const content = <>
    <Text style={[styles.eyebrow, ar && styles.rtlText]}>{ar ? "الخطوة 1 من 2" : "STEP 1 OF 2"}</Text>
    <Text style={[styles.title, ar && styles.rtlText]}>{ar ? "إضافة أول VPS" : "ADD YOUR FIRST VPS"}</Text>
    <Text style={[styles.description, ar && styles.rtlText]}>{ar ? "اتصل مباشرة من هاتفك. تبقى بيانات الاعتماد على هذا الجهاز." : "Connect directly from your phone. Credentials stay on this device."}</Text>
    <OnboardingInput label={ar ? "الاسم" : "NAME"} value={name} onChangeText={setName} placeholder="production" language={language} />
    <OnboardingInput label={ar ? "المضيف / IP" : "HOST / IP"} value={host} onChangeText={setHost} placeholder="203.0.113.10" language={language} />
    <OnboardingInput label={ar ? "المنفذ" : "PORT"} value={port} onChangeText={setPort} placeholder="22" language={language} />
    <OnboardingInput label={ar ? "اسم المستخدم" : "USERNAME"} value={username} onChangeText={setUsername} placeholder="root" language={language} />
    <Text style={styles.label}>{ar ? "المصادقة" : "AUTHENTICATION"}</Text>
    <OnboardingOptionGroup options={[{ id: "private_key", label: ar ? "مفتاح SSH" : "SSH KEY" }, { id: "password", label: ar ? "كلمة المرور" : "PASSWORD" }]} selected={authType} onSelect={(id) => setAuthType(id as ServerAuthType)} />
    <OnboardingInput label={authType === "password" ? (ar ? "كلمة المرور" : "PASSWORD") : (ar ? "مفتاح خاص" : "PRIVATE KEY")} value={secret} onChangeText={setSecret} placeholder={authType === "password" ? "••••••••" : "-----BEGIN OPENSSH PRIVATE KEY-----"} secureTextEntry={authType === "password"} language={language} />
    <OnboardingButton disabled={saving} onPress={save} label={saving ? (ar ? "جاري الحفظ..." : "SAVING...") : (ar ? "متابعة إعداد AI" : "CONTINUE TO AI SETUP")} />
    {onSkip ? <OnboardingButton variant="ghost" onPress={onSkip} label={ar ? "تخطي VPS الآن" : "SKIP VPS FOR NOW"} /> : null}
  </>;
  if (inBottomSheet) return <BottomSheetScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{content}</BottomSheetScrollView>;
  return <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}>{content}</ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  content: { padding: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.xl },
  eyebrow: { color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small },
  title: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.heading1, marginTop: SPACING.sm },
  description: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.small, lineHeight: 20, marginTop: SPACING.sm, marginBottom: SPACING.lg },
  label: { color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.tiny, marginBottom: 6 },
  rtlText: { writingDirection: "rtl", textAlign: "right" },
});
