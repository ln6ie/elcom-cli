import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { COLORS, FONTS } from "../../constants/theme";
import { Trash2, Edit2, Plus, Check, X } from "lucide-react-native";
import { MODEL_PRESETS } from "../../constants/models";

interface ModelSelectorProps {
  selectedModel: string;
  customModels: { id: string; name: string }[];
  onSelect: (id: string) => void;
  onAdd: (id: string, name: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
}

export const ModelSelector = ({
  selectedModel,
  customModels,
  onSelect,
  onAdd,
  onRemove,
  onRename,
}: ModelSelectorProps) => {
  const [newModelId, setNewModelId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = () => {
    if (newModelId.trim()) {
      onAdd(newModelId.trim(), newModelId.trim());
      setNewModelId("");
    }
  };

  const saveRename = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
      setEditingId(null);
    }
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>--- MODEL_IDENTITY (MEMORY) ---</Text>
      <Text style={styles.label}>SAVED_MODELS // FAVORITES</Text>
      <View style={styles.favList}>
        {MODEL_PRESETS.map((m) => (
          <TouchableOpacity
            key={`preset-${m.id}`}
            onPress={() => onSelect(m.id)}
            style={[
              styles.presetItem,
              selectedModel === m.id && styles.activePreset,
            ]}
          >
            <Text
              style={[
                styles.presetText,
                selectedModel === m.id && styles.activePresetText,
              ]}
            >
              {m.name}
            </Text>
          </TouchableOpacity>
        ))}
        {customModels.map((m) => (
          <View
            key={`custom-${m.id}`}
            style={[
              styles.customItem,
              selectedModel === m.id && styles.activePreset,
            ]}
          >
            {editingId === m.id ? (
              <TextInput
                value={editName}
                onChangeText={setEditName}
                style={styles.editInput}
                autoFocus
              />
            ) : (
              <TouchableOpacity
                onPress={() => onSelect(m.id)}
                style={{ flex: 1 }}
              >
                <Text
                  style={[
                    styles.presetText,
                    selectedModel === m.id && styles.activePresetText,
                  ]}
                >
                  {m.name}
                </Text>
              </TouchableOpacity>
            )}
            <View style={styles.customActions}>
              {editingId === m.id ? (
                <>
                  <TouchableOpacity onPress={saveRename}>
                    <Check size={14} color={COLORS.success} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingId(null)}>
                    <X size={14} color={COLORS.error} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingId(m.id);
                      setEditName(m.name);
                    }}
                  >
                    <Edit2 size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onRemove(m.id)}>
                    <Trash2 size={14} color={COLORS.error} />
                  </TouchableOpacity>
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
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    color: COLORS.textDim,
    fontFamily: FONTS.monoBold,
    fontSize: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  label: {
    color: COLORS.primary,
    fontFamily: FONTS.mono,
    fontSize: 11,
    marginBottom: 8,
  },
  favList: { flexDirection: "column", gap: 8, marginBottom: 16 },
  presetItem: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  customItem: {
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginLeft: 8,
  },
  addModelWrap: { flexDirection: "row", gap: 8, marginBottom: 24 },
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
    justifyContent: "center",
    alignItems: "center",
  },
  activePreset: {
    borderColor: COLORS.success,
    backgroundColor: "rgba(0, 224, 163, 0.1)",
  },
  presetText: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: 10 },
  activePresetText: { color: COLORS.success },
});
