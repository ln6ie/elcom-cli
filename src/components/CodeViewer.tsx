import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { X, Copy, Check } from "lucide-react-native";
import { COLORS, FONTS, FONT_SIZES } from "../constants/theme";

interface CodeViewerProps {
  visible: boolean;
  filePath: string;
  content: string;
  onClose: () => void;
}

const KEYWORDS = new Set([
  "function", "const", "let", "var", "if", "else", "for", "while",
  "do", "switch", "case", "break", "continue", "return", "throw",
  "try", "catch", "finally", "new", "delete", "typeof", "instanceof",
  "in", "of", "from", "import", "export", "default", "class", "extends",
  "super", "this", "async", "await", "yield", "static", "get", "set",
  "def", "class", "lambda", "with", "as", "pass", "raise", "None",
  "True", "False", "and", "or", "not", "is", "if", "elif", "else",
  "for", "while", "try", "except", "finally", "import", "from",
  "struct", "impl", "fn", "let", "mut", "pub", "use", "mod",
  "interface", "type", "enum", "namespace", "declare",
]);

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  jsx: "javascript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
  rs: "rust",
  go: "go",
  java: "java",
  cpp: "cpp",
  c: "c",
  h: "c",
  swift: "swift",
  kt: "kotlin",
  dart: "dart",
  php: "php",
  css: "css",
  html: "html",
  json: "json",
  xml: "xml",
  yml: "yaml",
  yaml: "yaml",
  md: "markdown",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  sql: "sql",
};

function getLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  return LANGUAGE_EXTENSIONS[ext] || "text";
}

function highlightLine(line: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const trimmed = line.trim();

  if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("--")) {
    parts.push(<Text key="0" style={{ color: "#6A9955" }}>{line}</Text>);
    return parts;
  }

  const regex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\/\/.*|\/\*[\s\S]*?\*\/|\b[a-zA-Z_$][\w$]*\b|[^\s"'`\w]+)/g;
  let match;
  let lastIndex = 0;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<Text key={`t${lastIndex}`}>{line.slice(lastIndex, match.index)}</Text>);
    }

    const token = match[0];
    const isString = (token.startsWith('"') && token.endsWith('"')) ||
                     (token.startsWith("'") && token.endsWith("'")) ||
                     (token.startsWith("`") && token.endsWith("`"));
    const isComment = token.startsWith("//") || token.startsWith("/*") || token.startsWith("#");
    const isKeyword = KEYWORDS.has(token);

    if (isString) {
      parts.push(<Text key={`s${match.index}`} style={{ color: "#CE9178" }}>{token}</Text>);
    } else if (isComment) {
      const rest = line.slice(match.index);
      parts.push(<Text key={`c${match.index}`} style={{ color: "#6A9955" }}>{rest}</Text>);
      break;
    } else if (isKeyword) {
      parts.push(<Text key={`k${match.index}`} style={{ color: "#569CD6" }}>{token}</Text>);
    } else {
      parts.push(<Text key={`o${match.index}`} style={{ color: "#D4D4D4" }}>{token}</Text>);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < line.length) {
    parts.push(<Text key={`e${lastIndex}`}>{line.slice(lastIndex)}</Text>);
  }

  return parts.length > 0 ? parts : [<Text key="0" style={{ color: "#D4D4D4" }}>{line}</Text>];
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  visible,
  filePath,
  content,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const lines = content.split("\n");
  const language = getLanguage(filePath);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.langBadge}>{language.toUpperCase()}</Text>
              <Text style={styles.filePath} numberOfLines={1}>{filePath}</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleCopy}>
                {copied ? <Check size={16} color={COLORS.success} /> : <Copy size={16} color={COLORS.text} />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
                <X size={16} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            horizontal={false}
            showsVerticalScrollIndicator
          >
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View style={styles.codeBlock}>
                {lines.map((line, i) => (
                  <View key={i} style={styles.lineRow}>
                    <Text style={styles.lineNum}>{String(i + 1).padStart(4, " ")}</Text>
                    <Text style={styles.lineContent}>
                      {highlightLine(line)}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingTop: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    marginTop: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    backgroundColor: "#252526",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  langBadge: {
    color: "#0E0E0E",
    backgroundColor: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 8,
    overflow: "hidden",
  },
  filePath: {
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.small,
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    flex: 1,
  },
  codeBlock: {
    paddingVertical: 8,
    minWidth: "100%",
  },
  lineRow: {
    flexDirection: "row",
    minHeight: 20,
  },
  lineNum: {
    width: 50,
    textAlign: "right",
    paddingRight: 12,
    color: "#858585",
    fontFamily: FONTS.mono,
    fontSize: 13,
    lineHeight: 20,
    backgroundColor: "#1E1E1E",
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  lineContent: {
    flex: 1,
    paddingLeft: 12,
    color: "#D4D4D4",
    fontFamily: FONTS.mono,
    fontSize: 13,
    lineHeight: 20,
  },
});
