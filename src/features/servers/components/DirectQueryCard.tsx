import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Copy, Play, Square } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";
import { commandNeedsSudo, isDangerousServerCommand } from "../serverQueryService";

export function DirectQueryCard({ onExecute, onSave }: { onExecute: (command: string, signal: AbortSignal, sudoPassword?: string) => Promise<{ stdout: string; stderr: string }>; onSave?: (name: string, command: string, output: string) => void }) {
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [controller, setController] = useState<AbortController | null>(null);
  const [sudoPassword, setSudoPassword] = useState("");
  const [queryName, setQueryName] = useState("");
  const execute = async () => {
    const value = command.trim();
    if (!value || running) return;
    const run = async () => {
      const abort = new AbortController(); setController(abort); setRunning(true); setOutput("");
      try { const result = await onExecute(value, abort.signal, sudoPassword || undefined); setOutput([result.stdout, result.stderr].filter(Boolean).join("\n")); }
      catch (error) { setOutput(error instanceof Error ? error.message : "Command failed"); }
      finally { setRunning(false); setController(null); setSudoPassword(""); }
    };
    if (isDangerousServerCommand(value)) {
      Alert.alert("تحذير", "هذا الأمر قد يوقف الخدمة أو يحذف بيانات. هل تريد المتابعة؟", [{ text: "إلغاء", style: "cancel" }, { text: "تنفيذ", style: "destructive", onPress: () => { void run(); } }]);
    } else void run();
  };
  return <View style={styles.card}><Text style={styles.title}>DIRECT QUERY</Text><Text style={styles.subtitle}>Execute a command on this VPS</Text><TextInput value={command} onChangeText={setCommand} placeholder="systemctl status nginx" placeholderTextColor={COLORS.textDim} style={styles.input} autoCapitalize="none" autoCorrect={false} multiline />{commandNeedsSudo(command) ? <TextInput value={sudoPassword} onChangeText={setSudoPassword} placeholder="Sudo password" placeholderTextColor={COLORS.textDim} style={styles.input} secureTextEntry autoCapitalize="none" autoCorrect={false} /> : null}{output ? <TextInput value={queryName} onChangeText={setQueryName} placeholder="Query name" placeholderTextColor={COLORS.textDim} style={styles.input} autoCapitalize="sentences" /> : null}<View style={styles.actions}><Pressable style={styles.run} onPress={() => { if (running) controller?.abort(); else void execute(); }}>{running ? <Square size={15} color="#001018" /> : <Play size={15} color="#001018" />}<Text style={styles.runText}>{running ? "STOP" : "EXECUTE"}</Text></Pressable>{output ? <Pressable style={styles.copy} onPress={() => { void Clipboard.setStringAsync(output); Alert.alert("Copied", "Command output copied."); }}><Copy size={15} color={COLORS.primary} /></Pressable> : null}{output && onSave ? <Pressable style={styles.save} onPress={() => { if (!queryName.trim()) { Alert.alert("اسم الاستعلام مطلوب", "أدخل اسمًا لهذا الاستعلام قبل الحفظ."); return; } onSave(queryName.trim(), command.trim(), output); }}><Text style={styles.saveText}>SAVE</Text></Pressable> : null}</View>{output ? <ScrollView style={styles.output} nestedScrollEnabled><Text selectable style={styles.outputText}>{output}</Text></ScrollView> : null}</View>;
}
const styles = StyleSheet.create({ card: { marginHorizontal: -SPACING.md, marginBottom: SPACING.md, padding: SPACING.md, backgroundColor: COLORS.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border }, title: { color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small }, subtitle: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.tiny, marginTop: 3 }, input: { minHeight: 42, maxHeight: 100, marginTop: SPACING.sm, padding: 10, backgroundColor: COLORS.background, color: COLORS.text, fontFamily: FONTS.mono, borderWidth: 1, borderColor: COLORS.border }, actions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: SPACING.sm }, run: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, backgroundColor: COLORS.primary }, runText: { color: "#001018", fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.tiny }, copy: { padding: 9 }, save: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.border }, saveText: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.tiny }, output: { maxHeight: 240, marginTop: SPACING.sm, padding: SPACING.sm, backgroundColor: COLORS.background, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border }, outputText: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.tiny, lineHeight: 16 }, cancel: { color: COLORS.error, fontFamily: FONTS.mono, fontSize: FONT_SIZES.tiny, marginTop: 8 } });
