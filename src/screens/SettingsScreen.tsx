import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../constants/theme";
import { DatabaseSettings } from "../services/database";
import { CliNotification } from "../components/CliNotification";
import { ModelSelector } from "../components/settings/ModelSelector";
import { TRANSLATIONS } from "../constants/translations";

interface SettingsScreenProps {
  settings: DatabaseSettings;
  customModels: { id: string; name: string }[];
  modelPresets: { id: string; name: string }[];
  onSave: (settings: Partial<DatabaseSettings>) => Promise<void>;
  onAddCustomModel: (id: string, name: string) => Promise<void>;
  onRemoveCustomModel: (id: string) => Promise<void>;
  onRenameCustomModel: (id: string, name: string) => Promise<void>;
  onBack: () => void;
}

export const SettingsScreen = ({
  settings,
  customModels,
  modelPresets,
  onSave,
  onAddCustomModel,
  onRemoveCustomModel,
  onRenameCustomModel,
  onBack,
}: SettingsScreenProps) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    visible: boolean;
    message: string | string[];
    type: "success" | "error" | "info";
  }>({ visible: false, message: "", type: "success" });

  const t = TRANSLATIONS[localSettings.language || "ar"];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localSettings);
      setNotification({
        visible: true,
        message: localSettings.language === "ar" 
          ? ["تمت المزامنة بنجاح", "تم تحديث سجل الإعدادات"] 
          : ["SYSTEM_SYNC_COMPLETE", "CONFIG_REGISTRY_UPDATED"],
        type: "success",
      });
      setTimeout(() => {
        setIsSaving(false);
        onBack();
      }, 1500);
    } catch (error) {
      setNotification({
        visible: true,
        message: localSettings.language === "ar" ? "خطأ في المزامنة" : "SYSTEM_SYNC_ERROR",
        type: "error",
      });
      setIsSaving(false);
    }
  };

  const renderInput = (
    label: string,
    key: keyof DatabaseSettings,
    placeholder: string,
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={localSettings[key]?.toString() || ""}
        onChangeText={(val) =>
          setLocalSettings({ ...localSettings, [key]: val })
        }
        placeholder={placeholder}
        placeholderTextColor={COLORS.textDim}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <CliNotification
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onHide={() => setNotification((v) => ({ ...v, visible: false }))}
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.config_system}</Text>
        <TouchableOpacity onPress={onBack} disabled={isSaving}>
          <Text style={[styles.backButton, isSaving && { opacity: 0.3 }]}>
            {t.exit}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>{t.api_config}</Text>
        {renderInput(t.api_key, "api_key", "sk-or-v1-...")}
        <Text style={styles.sectionTitle}>{t.user_identity}</Text>
        {renderInput(t.user_label, "user_name", "ENTER_NAME...")}

        <ModelSelector
          selectedModel={localSettings.selected_model}
          customModels={customModels}
          modelPresets={modelPresets}
          onSelect={(id) =>
            setLocalSettings({ ...localSettings, selected_model: id })
          }
          onAdd={onAddCustomModel}
          onRemove={onRemoveCustomModel}
          onRename={onRenameCustomModel}
        />

        {renderInput(t.manual_model, "selected_model", "vendor/model:type")}
        <Text style={styles.sectionTitle}>{t.parameters}</Text>
        {renderInput(t.max_tokens, "max_tokens", "4096")}
        {renderInput(t.temperature, "temperature", "0.7")}
        {renderInput(t.context_limit, "context_length", "15")}

        <Text style={styles.sectionTitle}>--- {t.language} ---</Text>
        <View style={styles.langSelector}>
          <TouchableOpacity
            style={[styles.langBtn, localSettings.language === "ar" && styles.activeLang]}
            onPress={() => setLocalSettings({ ...localSettings, language: "ar" })}
          >
            <Text style={[styles.langText, localSettings.language === "ar" && styles.activeLangText]}>
              العربية (ARABIC)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, localSettings.language === "en" && styles.activeLang]}
            onPress={() => setLocalSettings({ ...localSettings, language: "en" })}
          >
            <Text style={[styles.langText, localSettings.language === "en" && styles.activeLangText]}>
              ENGLISH (EN)
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.disabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveText}>
            {isSaving ? t.saving : t.apply_changes}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: 14,
  },
  backButton: { color: COLORS.error, fontFamily: FONTS.monoBold },
  scroll: { padding: 16 },
  sectionTitle: {
    color: COLORS.textDim,
    fontFamily: FONTS.monoBold,
    fontSize: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  inputGroup: { marginBottom: 20 },
  label: {
    color: COLORS.primary,
    fontFamily: FONTS.mono,
    fontSize: 11,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: 13,
    padding: 12,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 32,
    marginBottom: 40,
  },
  saveText: {
    color: COLORS.background,
    fontFamily: FONTS.monoBold,
    fontSize: 14,
  },
  disabled: { opacity: 0.5 },
  langSelector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  langBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  activeLang: {
    borderColor: COLORS.success,
    backgroundColor: "rgba(0, 224, 163, 0.1)",
  },
  langText: {
    color: COLORS.textDim,
    fontFamily: FONTS.monoBold,
    fontSize: 12,
  },
  activeLangText: {
    color: COLORS.success,
  },
});
