import { useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";
import { useServers } from "@/features/servers/hooks/useServers";
import { useSettings } from "@/hooks/useSettings";
import type { ServerAuthType } from "@/services/database";

export default function NewServerRoute() {
  const router = useRouter();
  const { createServer } = useServers();
  const { updateSetting } = useSettings();
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
      const server = await createServer({ name: name.trim(), host: host.trim(), port: Number(port) || 22, username: username.trim(), auth_type: authType, fingerprint: null, credentials: authType === "password" ? { password: secret } : { privateKey: secret } });
      await updateSetting("onboarding_completed", true);
      router.replace(`/(dashboard)/servers/${server.id}`);
    } catch (error) {
      Alert.alert("Could not save server", error instanceof Error ? error.message : "Unknown error");
    } finally { setSaving(false); }
  };

  const input = (label: string, value: string, setter: (value: string) => void, placeholder: string, secure = false) => <View style={styles.group}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={setter} placeholder={placeholder} placeholderTextColor={COLORS.textDim} secureTextEntry={secure} autoCapitalize="none" style={styles.input} /></View>;
  return <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.content}><Text style={styles.back} onPress={() => router.back()}>‹ BACK</Text><Text style={styles.heading}>Add VPS</Text><Text style={styles.description}>Credentials are stored in the device SecureStore. SSH connection is only opened when a refresh is requested.</Text>{input("NAME", name, setName, "production")}{input("HOST / IP", host, setHost, "203.0.113.10")}{input("PORT", port, setPort, "22")}{input("USERNAME", username, setUsername, "root")}<Text style={styles.label}>AUTHENTICATION</Text><View style={styles.switchRow}><TouchableOpacity style={[styles.switch, authType === "private_key" && styles.active]} onPress={() => setAuthType("private_key")}><Text style={styles.switchText}>SSH KEY</Text></TouchableOpacity><TouchableOpacity style={[styles.switch, authType === "password" && styles.active]} onPress={() => setAuthType("password")}><Text style={styles.switchText}>PASSWORD</Text></TouchableOpacity></View>{input(authType === "password" ? "PASSWORD" : "PRIVATE KEY", secret, setSecret, authType === "password" ? "••••••••" : "-----BEGIN OPENSSH PRIVATE KEY-----", authType === "password")}<TouchableOpacity disabled={saving} style={styles.save} onPress={save}><Text style={styles.saveText}>{saving ? "SAVING..." : "SAVE VPS"}</Text></TouchableOpacity></ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: COLORS.background }, content: { padding: SPACING.md }, back: { color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small, marginBottom: SPACING.lg }, heading: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.heading1 }, description: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.body, lineHeight: 22, marginTop: SPACING.sm, marginBottom: SPACING.lg }, group: { marginBottom: SPACING.md }, label: { color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small, marginBottom: 8 }, input: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 6, color: COLORS.text, fontFamily: FONTS.mono, padding: SPACING.md }, switchRow: { flexDirection: "row", gap: 8, marginBottom: SPACING.md }, switch: { flex: 1, borderColor: COLORS.border, borderWidth: 1, padding: SPACING.md, alignItems: "center", borderRadius: 6 }, active: { borderColor: COLORS.primary, backgroundColor: "rgba(0,163,224,0.12)" }, switchText: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small }, save: { backgroundColor: COLORS.primary, padding: SPACING.md, alignItems: "center", borderRadius: 6, marginTop: SPACING.md }, saveText: { color: "#001018", fontFamily: FONTS.monoBold } });
