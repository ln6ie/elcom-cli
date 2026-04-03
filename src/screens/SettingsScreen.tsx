import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../constants/theme';
import { DatabaseSettings } from '../services/database';
import { Trash2, Edit2, Plus, Check, X } from 'lucide-react-native';
import { CliNotification } from '../components/CliNotification';

interface SettingsScreenProps {
  settings: DatabaseSettings;
  customModels: { id: string; name: string }[];
  onSave: (settings: Partial<DatabaseSettings>) => Promise<void>;
  onAddCustomModel: (id: string, name: string) => Promise<void>;
  onRemoveCustomModel: (id: string) => Promise<void>;
  onRenameCustomModel: (id: string, name: string) => Promise<void>;
  onBack: () => void;
}

const MODEL_PRESETS = [
  { id: 'qwen/qwen3.6-plus:free', name: 'Qwen 3.6 Plus (Default)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B' },
  { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B' },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B' },
];

export const SettingsScreen = ({ 
  settings, 
  customModels, 
  onSave, 
  onAddCustomModel, 
  onRemoveCustomModel, 
  onRenameCustomModel, 
  onBack 
}: SettingsScreenProps) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ visible: boolean; message: string | string[]; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'success'
  });
  const [newModelId, setNewModelId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localSettings);
      setNotification({
        visible: true,
        message: ['SYSTEM_SYNC_COMPLETE', 'CONFIG_REGISTRY_UPDATED', 'REBOOTING_SESSION...'],
        type: 'success'
      });
      
      setTimeout(() => {
        setIsSaving(false);
        onBack();
      }, 2000);
    } catch (error) {
      setNotification({
        visible: true,
        message: 'SYSTEM_SYNC_ERROR: WRITE_ACCESS_DENIED',
        type: 'error'
      });
      setIsSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newModelId.trim()) return;
    await onAddCustomModel(newModelId.trim(), newModelId.trim());
    setNewModelId('');
  };

  const startRename = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const saveRename = async () => {
    if (editingId && editName.trim()) {
      await onRenameCustomModel(editingId, editName.trim());
      setEditingId(null);
    }
  };

  const renderInput = (label: string, key: keyof DatabaseSettings, placeholder: string, multiline = false) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={localSettings[key]?.toString() || ''}
        onChangeText={(val) => setLocalSettings({ ...localSettings, [key]: val })}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textDim}
        style={[styles.input, multiline && styles.multilineInput]}
        multiline={multiline}
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <CliNotification 
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onHide={() => setNotification(prev => ({ ...prev, visible: false }))}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CONFIG_SYSTEM // SETTINGS</Text>
        <TouchableOpacity onPress={onBack} disabled={isSaving}>
          <Text style={[styles.backButton, isSaving && { opacity: 0.3 }]}>[EXIT]</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>--- API_CONFIGURATION ---</Text>
        {renderInput('OPENROUTER_KEY', 'api_key', 'sk-or-v1-...')}

        <Text style={styles.sectionTitle}>--- MODEL_IDENTITY (MEMORY) ---</Text>
        <Text style={styles.label}>SAVED_MODELS // FAVORITES</Text>
        <View style={styles.favList}>
          {MODEL_PRESETS.map((m) => (
            <TouchableOpacity 
              key={m.id} 
              onPress={() => setLocalSettings({ ...localSettings, selected_model: m.id })}
              style={[styles.presetItem, localSettings.selected_model === m.id && styles.activePreset]}
            >
              <Text style={[styles.presetText, localSettings.selected_model === m.id && styles.activePresetText]}>
                {m.name}
              </Text>
            </TouchableOpacity>
          ))}
          
          {customModels.map((m) => (
            <View key={m.id} style={[styles.customItem, localSettings.selected_model === m.id && styles.activePreset]}>
              {editingId === m.id ? (
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  style={styles.editInput}
                  autoFocus
                />
              ) : (
                <TouchableOpacity 
                  onPress={() => setLocalSettings({ ...localSettings, selected_model: m.id })}
                  style={{ flex: 1 }}
                >
                  <Text style={[styles.presetText, localSettings.selected_model === m.id && styles.activePresetText]}>
                    {m.name}
                  </Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.customActions}>
                {editingId === m.id ? (
                  <>
                    <TouchableOpacity onPress={saveRename}><Check size={14} color={COLORS.success}/></TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditingId(null)}><X size={14} color={COLORS.error}/></TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity onPress={() => startRename(m.id, m.name)}><Edit2 size={14} color={COLORS.primary}/></TouchableOpacity>
                    <TouchableOpacity onPress={() => onRemoveCustomModel(m.id)}><Trash2 size={14} color={COLORS.error}/></TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.addModelWrap}>
          <TextInput
            value={newModelId}
            onChangeText={setNewModelId}
            placeholder="ADD_CUSTOM_MODEL_ID"
            placeholderTextColor={COLORS.textDim}
            style={styles.addInput}
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={[styles.addButton, !newModelId.trim() && { opacity: 0.5 }]} 
            onPress={handleAdd}
            disabled={!newModelId.trim()}
          >
            <Plus size={18} color={COLORS.background} />
          </TouchableOpacity>
        </View>

        {renderInput('MANUAL_MODEL_ID', 'selected_model', 'vendor/model:type')}
        {renderInput('SYSTEM_MEMORY_PROMPT', 'system_prompt', 'Define AI personality here...', true)}

        <Text style={styles.sectionTitle}>--- PARAMETERS ---</Text>
        {renderInput('MAX_TOKENS', 'max_tokens', '4096')}
        {renderInput('TEMPERATURE (0-2)', 'temperature', '0.7')}
        {renderInput('CONTEXT_LIMIT', 'context_length', '15')}

        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.disabled]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveText}>{isSaving ? 'SAVING...' : 'APPLY_CHANGES'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: 14,
  },
  backButton: {
    color: COLORS.error,
    fontFamily: FONTS.monoBold,
  },
  scroll: {
    padding: 16,
  },
  sectionTitle: {
    color: COLORS.textDim,
    fontFamily: FONTS.monoBold,
    fontSize: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
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
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  favList: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  presetItem: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  customItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
  },
  editInput: {
    flex: 1,
    color: COLORS.success,
    fontFamily: FONTS.mono,
    fontSize: 12,
    padding: 0,
  },
  customActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 8,
  },
  addModelWrap: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  addInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: 12,
    padding: 10,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePreset: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(0, 224, 163, 0.1)',
  },
  presetText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: 10,
  },
  activePresetText: {
    color: COLORS.success,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  saveText: {
    color: COLORS.background,
    fontFamily: FONTS.monoBold,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
  },
});
