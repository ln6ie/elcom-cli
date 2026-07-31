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
import { COLORS, FONTS, FONT_SIZES } from "@/constants/theme";
import { DatabaseSettings } from "@/services/database";
import { CliNotification } from "@/components/CliNotification";
import { SharedHeader } from "@/components/SharedHeader";
import { ModelPicker } from "@/features/settings/ModelPicker";
import { TRANSLATIONS } from "@/constants/translations";
import { ModelInfo } from "@/services/modelService";

interface SettingsScreenProps {
  settings: DatabaseSettings;
  customModels: { id: string; name: string }[];
  modelPresets: { id: string; name: string }[];
  openRouterModels: ModelInfo[];
  openCodeModels: ModelInfo[];
  modelsLoading?: boolean;
  modelsError?: string | null;
  onSave: (settings: Partial<DatabaseSettings>) => Promise<void>;
  onAddCustomModel: (id: string, name: string) => Promise<void>;
  onRemoveCustomModel: (id: string) => Promise<void>;
  onRenameCustomModel: (id: string, name: string) => Promise<void>;
  onBack: () => void;
  onRetryModels?: () => void;
}

export const SettingsScreen = ({
  settings,
  customModels,
  modelPresets,
  openRouterModels,
  openCodeModels,
  modelsLoading,
  modelsError,
  onSave,
  onAddCustomModel,
  onRemoveCustomModel,
  onRenameCustomModel,
  onBack,
  onRetryModels,
}: SettingsScreenProps) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    visible: boolean;
    message: string | string[];
    type: "success" | "error" | "info";
  }>({ visible: false, message: "", type: "success" });

  const t = TRANSLATIONS[localSettings.language || "ar"];
  const isOpenCode = localSettings.ai_provider === "opencode";

  const activeModels = isOpenCode ? openCodeModels : openRouterModels;

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
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <CliNotification
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onHide={() => setNotification((v) => ({ ...v, visible: false }))}
      />
      <SharedHeader
        title={t.config_system}
        rightText={{ label: t.exit, onPress: onBack, disabled: isSaving }}
        variant="floating"
      />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: 110 }]}>
        <Text style={styles.sectionTitle}>{t.api_config}</Text>
        {renderInput(t.api_key, "api_key", "sk-or-v1-...")}
        {renderInput(t.opencode_key, "opencode_api_key", "opencode-...")}

        {/* Provider Selector */}
        <Text style={styles.sectionTitle}>--- {t.provider} ---</Text>
        <View style={styles.providerRow}>
          <TouchableOpacity
            style={[styles.providerBtn, !isOpenCode && styles.providerActive]}
            onPress={() => setLocalSettings({ ...localSettings, ai_provider: "openrouter" })}
          >
            <Text style={[styles.providerText, !isOpenCode && styles.providerTextActive]}>
              OpenRouter
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.providerBtn, isOpenCode && styles.providerActive]}
            onPress={() => setLocalSettings({ ...localSettings, ai_provider: "opencode" })}
          >
            <Text style={[styles.providerText, isOpenCode && styles.providerTextActive]}>
              OpenCode
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{t.user_identity}</Text>
        {renderInput(t.user_label, "user_name", "ENTER_NAME...")}

        {/* Model Selector */}
        <Text style={styles.sectionTitle}>{t.model_identity}</Text>
        {renderInput(t.manual_model, "selected_model", `${isOpenCode ? "opencode" : "openrouter"}/model:type`)}

        <ModelPicker
          models={activeModels}
          selectedId={localSettings.selected_model}
          provider={localSettings.ai_provider}
          isLoading={modelsLoading}
          error={modelsError || undefined}
          onSelect={(id) => setLocalSettings({ ...localSettings, selected_model: id })}
          onRetry={onRetryModels}
        />

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
              العربية
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, localSettings.language === "en" && styles.activeLang]}
            onPress={() => setLocalSettings({ ...localSettings, language: "en" })}
          >
            <Text style={[styles.langText, localSettings.language === "en" && styles.activeLangText]}>
              English
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
  scroll: { padding: 16 },
  sectionTitle: {
    color: COLORS.textDim,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.label,
    marginTop: 12,
    marginBottom: 16,
  },
  inputGroup: { marginBottom: 20 },
  label: {
    color: COLORS.primary,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.label,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.body,
    padding: 12,
  },
  providerRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  providerBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  providerActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(0, 183, 255, 0.1)",
  },
  providerText: {
    color: COLORS.textDim,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.label,
  },
  providerTextActive: {
    color: COLORS.primary,
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
    fontSize: FONT_SIZES.body,
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
    fontSize: FONT_SIZES.label,
  },
  activeLangText: {
    color: COLORS.success,
  },
});
