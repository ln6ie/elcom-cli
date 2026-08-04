import React, { useEffect, useState } from "react";
import {
  View,
  Text,
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
import { OnboardingInput } from "@/components/onboarding/OnboardingInput";
import { OnboardingButton } from "@/components/onboarding/OnboardingButton";
import { OnboardingOptionGroup } from "@/components/onboarding/OnboardingOptionGroup";

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

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

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
    <OnboardingInput
      label={label}
      value={localSettings[key]?.toString() || ""}
      onChangeText={(val) => setLocalSettings({ ...localSettings, [key]: val })}
      placeholder={placeholder}
      language={localSettings.language === "ar" ? "ar" : "en"}
    />
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
        leftText={{ label: t.exit, onPress: onBack, disabled: isSaving }}
        variant="floating"
      />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: 110 }]}>
        <Text style={styles.sectionTitle}>{t.api_config}</Text>
        {renderInput(t.api_key, "api_key", "sk-or-v1-...")}
        {renderInput(t.opencode_key, "opencode_api_key", "opencode-...")}

        {/* Provider Selector */}
        <Text style={styles.sectionTitle}>--- {t.provider} ---</Text>
        <OnboardingOptionGroup
          options={[{ id: "openrouter", label: "OpenRouter" }, { id: "opencode", label: "OpenCode" }]}
          selected={localSettings.ai_provider}
          onSelect={(id) => setLocalSettings({ ...localSettings, ai_provider: id as DatabaseSettings["ai_provider"] })}
        />

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
        <OnboardingOptionGroup
          options={[{ id: "ar", label: "العربية" }, { id: "en", label: "English" }]}
          selected={localSettings.language || "ar"}
          onSelect={(id) => setLocalSettings({ ...localSettings, language: id as DatabaseSettings["language"] })}
        />

        <OnboardingButton onPress={handleSave} disabled={isSaving} label={isSaving ? t.saving : t.apply_changes} />
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
  
  disabled: { opacity: 0.5 },
});
