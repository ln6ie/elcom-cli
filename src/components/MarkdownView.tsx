import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Markdown from "react-native-markdown-display";
import * as Clipboard from "expo-clipboard";
import { Copy, Check } from "lucide-react-native";
import { COLORS, FONTS } from "../constants/theme";

interface MarkdownViewProps {
  content: string;
}

const isArabic = (text: string) => {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
  return arabicPattern.test(text.slice(0, 50));
};

export const MarkdownView = ({ content }: MarkdownViewProps) => {
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
          fence: (node, children, parent, styles) => (
            <View key={node.key} style={styles.codeBlock}>
              <View style={styles.codeHeader}>
                <Text style={styles.codeLang}>
                  [{node.attributes.language || "CODE"}]
                </Text>
                <TouchableOpacity
                  onPress={() => handleCopyCode(node.content.trim(), node.key)}
                  style={styles.copyBtn}
                >
                  {copiedKey === node.key ? (
                    <Check size={14} color={COLORS.success} />
                  ) : (
                    <Copy size={14} color={COLORS.primaryDim} />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.codeText}>{node.content.trim()}</Text>
            </View>
          ),
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
    fontSize: 13,
    lineHeight: 20,
  },
  heading1: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: 22,
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: 18,
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
    fontSize: 9,
    textTransform: "uppercase",
  },
  copyBtn: {
    padding: 4,
  },
  codeText: {
    color: COLORS.primary,
    fontFamily: FONTS.mono,
    fontSize: 11,
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
