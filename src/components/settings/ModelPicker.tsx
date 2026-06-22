import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Search, RefreshCw } from "lucide-react-native";
import { COLORS, FONTS, FONT_SIZES } from "../../constants/theme";
import { useTranslation } from "react-i18next";
import { ModelInfo } from "../../services/modelService";

interface ModelPickerProps {
  models: ModelInfo[];
  selectedId: string;
  provider: "openrouter" | "opencode";
  isLoading?: boolean;
  error?: string;
  onSelect: (id: string) => void;
  onRetry?: () => void;
}

export const ModelPicker = ({
  models,
  selectedId,
  provider,
  isLoading,
  error,
  onSelect,
  onRetry,
}: ModelPickerProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return models;
    const q = search.toLowerCase();
    return models.filter(
      (m) =>
        m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
    );
  }, [models, search]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.loadingText}>{t("loading_models")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t("fetch_error")}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <RefreshCw size={14} color={COLORS.primary} />
            <Text style={styles.retryText}> {t("retry")}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Search size={16} color={COLORS.textDim} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={t("search_model")}
          placeholderTextColor={COLORS.textDim}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <View style={styles.listContainer}>
        <ScrollView style={styles.list} nestedScrollEnabled>
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>{t("no_models")}</Text>
          ) : (
            filtered.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.item, isSelected && styles.itemSelected]}
                  onPress={() => onSelect(item.id)}
                >
                  <Text
                    style={[styles.itemId, isSelected && styles.itemIdSelected]}
                    numberOfLines={1}
                  >
                    {item.id}
                  </Text>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.context_length && (
                    <Text style={styles.itemCtx}>
                      {Math.round(item.context_length / 1000)}K
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 200 },
  center: { alignItems: "center", justifyContent: "center", padding: 24, minHeight: 120 },
  loadingText: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.small, marginTop: 8 },
  errorText: { color: COLORS.error, fontFamily: FONTS.mono, fontSize: FONT_SIZES.small, textAlign: "center" },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryDim,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { color: COLORS.primary, fontFamily: FONTS.mono, fontSize: FONT_SIZES.small },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.body,
    paddingVertical: 10,
    marginLeft: 8,
  },
  listContainer: { maxHeight: 300, borderWidth: 1, borderColor: COLORS.border },
  list: { maxHeight: 300 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemSelected: { backgroundColor: "rgba(0, 224, 163, 0.08)" },
  itemId: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.small,
  },
  itemIdSelected: { color: COLORS.success },
  itemName: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.small,
    marginLeft: 8,
    maxWidth: 120,
  },
  itemCtx: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.small,
    marginLeft: 8,
  },
  emptyText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.small,
    textAlign: "center",
    padding: 24,
  },
});
