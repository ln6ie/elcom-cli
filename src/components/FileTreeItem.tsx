import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Folder, FileCode, ChevronDown, ChevronRight, Circle } from "lucide-react-native";
import { COLORS, FONTS, FONT_SIZES } from "../constants/theme";
import { FileNode } from "../types/ide";

interface FileTreeItemProps {
  node: FileNode;
  name: string;
  level: number;
  isExpanded?: boolean;
  isModified?: boolean;
  onToggle?: () => void;
  onSelect?: () => void;
}

export const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  name,
  level,
  isExpanded = false,
  isModified = false,
  onToggle,
  onSelect,
}) => {
  const isDirectory = node.type === "tree";
  const paddingLeft = level * 16 + 8;

  const handlePress = () => {
    if (isDirectory && onToggle) {
      onToggle();
    } else if (!isDirectory && onSelect) {
      onSelect();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={[styles.container, { paddingLeft }]}
    >
      <View style={styles.leftRow}>
        {isDirectory ? (
          <View style={styles.iconWrapper}>
            {isExpanded ? (
              <ChevronDown size={14} color={COLORS.primaryDim} />
            ) : (
              <ChevronRight size={14} color={COLORS.primaryDim} />
            )}
            <Folder size={16} color={COLORS.primary} style={styles.folderIcon} />
          </View>
        ) : (
          <View style={styles.iconWrapper}>
            <View style={styles.spacer} />
            <FileCode size={16} color={COLORS.success} style={styles.fileIcon} />
          </View>
        )}
        <Text style={[styles.nameText, !isDirectory && styles.fileNameText]}>
          {name}
        </Text>
        {isModified && !isDirectory && (
          <Circle size={8} color={COLORS.success} style={{ marginLeft: 8 }} fill={COLORS.success} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.02)",
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  folderIcon: {
    marginLeft: 4,
  },
  fileIcon: {
    marginLeft: 4,
  },
  spacer: {
    width: 14,
  },
  nameText: {
    color: COLORS.text,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.body,
  },
  fileNameText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
  },
});
