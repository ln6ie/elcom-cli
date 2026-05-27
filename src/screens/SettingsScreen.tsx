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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localSettings);
      setNotification({
        visible: true,
        message: ["SYSTEM_SYNC_COMPLETE", "CONFIG_REGISTRY_UPDATED"],
        type: "success",
      });
      setTimeout(() => {
        setIsSaving(false);
        onBack();
      }, 1500);
    } catch (error) {
      setNotification({
        visible: true,
        message: "SYSTEM_SYNC_ERROR",
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
        <Text style={styles.headerTitle}>CONFIG_SYSTEM // SETTINGS</Text>
        <TouchableOpacity onPress={onBack} disabled={isSaving}>
          <Text style={[styles.backButton, isSaving && { opacity: 0.3 }]}>
            [EXIT]
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>--- API_CONFIGURATION ---</Text>
        {renderInput("OPENROUTER_KEY", "api_key", "sk-or-v1-...")}
        <Text style={styles.sectionTitle}>--- USER_IDENTITY ---</Text>
        {renderInput("USER_LABEL", "user_name", "ENTER_NAME...")}

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

        {renderInput("MANUAL_MODEL_ID", "selected_model", "vendor/model:type")}
        <Text style={styles.sectionTitle}>--- PARAMETERS ---</Text>
        {renderInput("MAX_TOKENS", "max_tokens", "4096")}
        {renderInput("TEMPERATURE", "temperature", "0.7")}
        {renderInput("CONTEXT_LIMIT", "context_length", "15")}

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.disabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveText}>
            {isSaving ? "SAVING..." : "APPLY_CHANGES"}
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
});
