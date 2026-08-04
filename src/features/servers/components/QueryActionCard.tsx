// @ts-nocheck
import { ActionSheetIOS, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef } from "react";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";
import { useSettings } from "@/hooks/useSettings";
export function QueryActionCard({ visible, name, language = "en", onClose, onDelete }: { visible: boolean; name: string; language?: "ar" | "en"; onClose: () => void; onDelete: () => void }) {
  const { settings } = useSettings();
  const activeLanguage = language === "en" && settings.language === "ar" ? "ar" : language;
  const protectedService = name === "SYSTEM" || name === "NETWORK";
  const safeDelete = protectedService ? onClose : onDelete;
  const shownRef = useRef(false);
  useEffect(() => {
    if (!visible) { shownRef.current = false; return; }
    if (Platform.OS !== "ios" || shownRef.current) return;
    shownRef.current = true;
    const ar = activeLanguage === "ar";
    const title = protectedService ? `${name}\n\n${ar ? "هذه خدمة أساسية ولا يمكن حذفها." : "This is a core service and cannot be deleted."}` : `${name}\n\n${ar ? "تحذير: سيتم حذف الخدمة نهائيًا من قاعدة البيانات." : "Warning: this service will be permanently deleted from the database."}`;
    const options = protectedService ? [ar ? "حسنًا" : "OK"] : [ar ? "إلغاء" : "Cancel", ar ? "حذف نهائي" : "Delete permanently"];
    ActionSheetIOS.showActionSheetWithOptions({ title, options, cancelButtonIndex: 0, destructiveButtonIndex: protectedService ? undefined : 1 }, index => {
      if (!protectedService && index === 1) { console.info("[QueryActionCard] Delete selected", { name }); onDelete(); }
      else onClose();
    });
  }, [visible, name, activeLanguage, onClose, onDelete]);
  if (Platform.OS === "ios") return null;
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><Pressable style={styles.backdrop} onPress={onClose}><Pressable style={styles.card} onPress={() => undefined}><Text style={styles.title}>{name}</Text><Text style={styles.subtitle}>{protectedService ? "CORE SERVICE" : "QUERY ACTIONS"}</Text>{protectedService ? <Text style={styles.protectedText}>This service is required for VPS metrics and cannot be deleted.</Text> : <View style={styles.actions}><Pressable style={styles.deleteButton} onPress={safeDelete}><Text style={styles.deleteText}>DELETE QUERY</Text></Pressable><Pressable style={styles.cancelButton} onPress={onClose}><Text style={styles.cancelText}>CANCEL</Text></Pressable></View>}</Pressable></Pressable></Modal>;
}
const styles = StyleSheet.create({ backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", padding: SPACING.lg }, card: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, padding: SPACING.lg, borderRadius: 14 }, title: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.body }, subtitle: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.tiny, marginTop: 5, marginBottom: SPACING.lg }, actions: { flexDirection: "row", gap: SPACING.sm }, deleteButton: { flex: 1, backgroundColor: COLORS.error, borderRadius: 999, padding: SPACING.md, alignItems: "center" }, deleteText: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small }, cancelButton: { flex: 1, backgroundColor: COLORS.border, borderRadius: 999, padding: SPACING.md, alignItems: "center" }, cancelText: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small } });
Object.assign(styles, { protectedText: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.small, lineHeight: 20 } });
