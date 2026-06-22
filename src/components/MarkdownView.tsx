import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Markdown from "react-native-markdown-display";
import * as Clipboard from "expo-clipboard";
import { Copy, Check } from "lucide-react-native";
import { COLORS, FONTS, FONT_SIZES } from "../constants/theme";

interface MarkdownViewProps {
  content: string;
  onEditCode?: (code: string, language?: string) => void;
}

const isArabic = (text: string) => {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
  return arabicPattern.test(text.slice(0, 50));
};

import { Modal, TextInput } from "react-native";
import { Edit } from "lucide-react-native";

export const MarkdownView = ({ content, onEditCode }: MarkdownViewProps) => {
  const rtl = isArabic(content);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyCode = async (code: string, key: string) => {
    await Clipboard.setStringAsync(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <View style={[styles.container, rtl && styles.rtlContainer]}>
      <Markdown
        style={markdownStyles}
        rules={{
          table: (node, children, parent, styles) => (
            <ScrollView horizontal key={node.key}>
              <View style={styles.table}>{children}</View>
            </ScrollView>
          ),
          fence: (node, children, parent, styles) => {
            const rawCode = node.content.trim();
            const language = node.attributes.language || "ts";
            return (
              <View key={node.key} style={styles.codeBlock}>
                <View style={styles.codeHeader}>
                  <Text style={styles.codeLang}>
                    [{language}]
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {onEditCode && (
                      <TouchableOpacity
                        onPress={() => onEditCode(rawCode, language)}
                        style={styles.copyBtn}
                      >
                        <Edit size={14} color={COLORS.primaryDim} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleCopyCode(rawCode, node.key)}
                      style={styles.copyBtn}
                    >
                      {copiedKey === node.key ? (
                        <Check size={14} color={COLORS.success} />
                      ) : (
                        <Copy size={14} color={COLORS.primaryDim} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                <ScrollView 
                  style={{ maxHeight: 260 }} 
                  nestedScrollEnabled={true}
                >
                  <ScrollView horizontal nestedScrollEnabled={true}>
                    <Text style={styles.codeText}>{rawCode}</Text>
                  </ScrollView>
                </ScrollView>
              </View>
            );
          },
        }}
      >
        {content}
      </Markdown>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rtlContainer: {
    alignItems: "flex-end",
  },
});

const markdownStyles: any = {
  body: {
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.body,
    lineHeight: Math.round(FONT_SIZES.body * 1.5),
  },
  heading1: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.heading1,
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.heading2,
    marginTop: 12,
    marginBottom: 6,
  },
  hr: {
    backgroundColor: COLORS.border,
    height: 1,
    marginVertical: 12,
  },
  blockquote: {
    backgroundColor: COLORS.surface,
    borderLeftColor: COLORS.primaryDim,
    borderLeftWidth: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 8,
  },
  code_inline: {
    backgroundColor: COLORS.surface,
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    paddingHorizontal: 4,
  },
  // Table styles
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 0,
    marginVertical: 12,
  },
  tr: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
  },
  th: {
    backgroundColor: COLORS.surface,
    padding: 8,
    fontFamily: FONTS.monoBold,
    minWidth: 80,
  },
  td: {
    padding: 8,
    minWidth: 80,
  },
  // Code block styles
  codeBlock: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginVertical: 12,
    width: "100%",
  },
  codeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    paddingBottom: 4,
  },
  codeLang: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.tiny,
    textTransform: "uppercase",
  },
  copyBtn: {
    padding: 4,
  },
  codeText: {
    color: COLORS.primary,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.small,
  },
  // Bullet points
  bullet_list: {
    marginVertical: 8,
  },
  bullet_list_icon: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    marginRight: 8,
  },
};

const sheetStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  sheet: {
    height: "80%",
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },
  headerTitle: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.body,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
  },
  cancelBtnText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.small,
  },
  saveBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0, 224, 163, 0.1)",
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: 4,
  },
  saveBtnText: {
    color: COLORS.success,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.small,
  },
  editorInput: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.small,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlignVertical: "top",
  },
});
