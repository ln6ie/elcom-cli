import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { FileText, FileEdit, Check } from "lucide-react-native";
import { COLORS, FONTS, FONT_SIZES } from "../constants/theme";
import { DiffLine } from "./DiffLine";
import { diffService } from "../services/diffService";

export interface ReadFileCall {
  type: "read";
  path: string;
}

export interface EditFileCall {
  type: "edit";
  path: string;
  oldCode: string;
  newCode: string;
}

export type ToolCall = ReadFileCall | EditFileCall;

export function parseToolCalls(content: string): { text: string; calls: ToolCall[] } {
  // Don't parse TOOL_RESULT messages
  if (content.startsWith("[TOOL_RESULT:")) {
    return { text: content, calls: [] };
  }

  let clean = content;
  const calls: ToolCall[] = [];

  const readRegex = /<read_file>([\s\S]*?)<\/read_file>/g;
  let match: RegExpExecArray | null;
  while ((match = readRegex.exec(content)) !== null) {
    calls.push({ type: "read", path: match[1].trim() });
  }

  const editRegex = /<str_replace>\s*<file>([\s\S]*?)<\/file>\s*<old>([\s\S]*?)<\/old>\s*<new>([\s\S]*?)<\/new>\s*<\/str_replace>/g;
  while ((match = editRegex.exec(content)) !== null) {
    calls.push({ type: "edit", path: match[1].trim(), oldCode: match[2], newCode: match[3] });
  }

  clean = clean
    .replace(/<read_file>[\s\S]*?<\/read_file>/g, "")
    .replace(/<read_file>[\s\S]*?(?:\n|$)/gm, "")
    .replace(/<str_replace>[\s\S]*?<\/str_replace>/g, "")
    .replace(/<str_replace>[\s\S]*?(?:\n|$)/gm, "")
    .replace(/<\/?read_file[^>]*>/g, "")
    .replace(/<\/?str_replace[^>]*>/g, "")
    .replace(/<\/?file\s*>/g, "")
    .replace(/<\/?old\s*>/g, "")
    .replace(/<\/?new\s*>/g, "");

  return { text: clean.trim(), calls };
}

interface ToolCallCardProps {
  call: ToolCall;
}

export const ToolCallCard: React.FC<ToolCallCardProps> = ({ call }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  const diffLines = useMemo(() => {
    if (call.type === "edit") {
      return diffService.computeDiff(call.oldCode, call.newCode);
    }
    return [];
  }, [call]);

  const isEdit = call.type === "edit";

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: anim,
          transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {isEdit ? (
            <FileEdit size={16} color={COLORS.primary} />
          ) : (
            <FileText size={16} color={COLORS.primary} />
          )}
          <Text style={styles.label}>
            {isEdit ? "EDIT_FILE" : "READ_FILE"}
          </Text>
        </View>
        <View style={styles.badge}>
          <Check size={12} color={COLORS.success} />
          <Text style={styles.badgeText}>DONE</Text>
        </View>
      </View>
      <Text style={styles.path}>{call.path}</Text>
      {isEdit && diffLines.length > 0 && (
        <View style={styles.diffBox}>
          {diffLines.slice(0, 20).map((line) => (
            <DiffLine key={line.id} type={line.type} content={line.content} />
          ))}
          {diffLines.length > 20 && (
            <Text style={styles.moreText}>... +{diffLines.length - 20} more lines</Text>
          )}
        </View>
      )}
    </Animated.View>
  );
};

interface FileContentCardProps {
  path: string;
}

export const FileContentCard: React.FC<FileContentCardProps> = ({ path }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: anim,
          transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          borderLeftWidth: 2,
          borderLeftColor: COLORS.primary,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FileText size={16} color={COLORS.primary} />
          <Text style={styles.label}>FILE_CONTENT</Text>
        </View>
        <View style={styles.badge}>
          <Check size={12} color={COLORS.success} />
          <Text style={styles.badgeText}>LOADED</Text>
        </View>
      </View>
      <Text style={styles.path}>{path}</Text>
    </Animated.View>
  );
};

interface ToolResultCardProps {
  toolName: string;
  result: string;
}

export const ToolResultCard: React.FC<ToolResultCardProps> = ({ toolName, result }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  const status = result.startsWith("Error") || result.startsWith("Warning") ? "FAILED" : "DONE";

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: anim,
          transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          borderLeftWidth: 2,
          borderLeftColor: status === "FAILED" ? COLORS.error : COLORS.success,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {toolName === "edit" ? (
            <FileEdit size={16} color={COLORS.primary} />
          ) : (
            <FileText size={16} color={COLORS.primary} />
          )}
          <Text style={styles.label}>{toolName.toUpperCase()}</Text>
        </View>
        <View style={[styles.badge, status === "FAILED" && { backgroundColor: "transparent" }]}>
          <Text style={[styles.badgeText, status === "FAILED" && { color: COLORS.error }]}>{status}</Text>
        </View>
      </View>
      <Text style={styles.resultText} numberOfLines={8}>{result}</Text>
    </Animated.View>
  );
};

export interface ToolCallAction {
  tool: string;
  file?: string;
  offset?: number;
  limit?: number;
  pattern?: string;
  include?: string;
  oldLines: string[];
  newLines: string[];
}

export function parseToolCallActions(content: string): ToolCallAction[] {
  if (!content.startsWith("[TOOL_CALL:")) return [];

  const actions: ToolCallAction[] = [];
  const blocks = content.split("\n---\n");

  for (const block of blocks) {
    const headerMatch = block.match(/^\[TOOL_CALL:\s*(\w+)\]/);
    if (!headerMatch) continue;
    const tool = headerMatch[1];
    const lines = block.split("\n").slice(1);
    const action: ToolCallAction = { tool, oldLines: [], newLines: [] };

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.startsWith("file: ")) action.file = line.slice(6);
      else if (line.startsWith("offset: ")) action.offset = parseInt(line.slice(8), 10);
      else if (line.startsWith("limit: ")) action.limit = parseInt(line.slice(7), 10);
      else if (line.startsWith("pattern: ")) action.pattern = line.slice(9);
      else if (line.startsWith("include: ")) action.include = line.slice(9);
      else if (line === "--- old:") {
        i++;
        while (i < lines.length && lines[i] !== "+++ new:") {
          action.oldLines.push(lines[i]);
          i++;
        }
        continue;
      } else if (line === "+++ new:") {
        i++;
        while (i < lines.length) {
          action.newLines.push(lines[i]);
          i++;
        }
        break;
      }
      i++;
    }

    actions.push(action);
  }

  return actions;
}

export const ToolCallActionCard: React.FC<{ action: ToolCallAction }> = ({ action }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  const isEdit = action.tool === "edit" && (action.oldLines.length > 0 || action.newLines.length > 0);
  const diffLines = useMemo(() => {
    if (isEdit) {
      return diffService.computeDiff(action.oldLines.join("\n"), action.newLines.join("\n"));
    }
    return [];
  }, [action, isEdit]);

  const meta: string[] = [];
  if (action.file) meta.push(action.file);
  if (action.offset) meta.push(`lines ${action.offset}-${action.offset + (action.limit || 1) - 1}`);
  if (action.pattern) meta.push(`pattern: ${action.pattern}`);
  if (action.include) meta.push(`include: ${action.include}`);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: anim,
          transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          borderLeftWidth: 2,
          borderLeftColor: action.tool === "edit" ? COLORS.error : COLORS.primary,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {action.tool === "edit" ? (
            <FileEdit size={16} color={COLORS.primary} />
          ) : (
            <FileText size={16} color={COLORS.primary} />
          )}
          <Text style={styles.label}>{action.tool.toUpperCase()}_FILE</Text>
        </View>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: COLORS.primaryDim }]}>PENDING</Text>
        </View>
      </View>
      <Text style={styles.path}>{meta.join(" · ")}</Text>
      {isEdit && (
        <View style={styles.inlineDiffBox}>
          {diffLines.slice(0, 30).map((line, idx) => (
            <View key={line.id} style={styles.diffRow}>
              <Text style={[styles.lineNum, line.type === "added" && { color: COLORS.success }, line.type === "removed" && { color: COLORS.error }]}>
                {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
              </Text>
              <DiffLine type={line.type} content={line.content} />
            </View>
          ))}
          {diffLines.length > 30 && (
            <Text style={styles.moreText}>... +{diffLines.length - 30} more lines</Text>
          )}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.tiny,
    letterSpacing: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeText: {
    color: COLORS.success,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.tiny,
  },
  path: {
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.small,
  },
  resultText: {
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.tiny,
    lineHeight: 16,
    marginTop: 4,
  },
  diffBox: {
    marginTop: 8,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
    paddingVertical: 4,
  },
  inlineDiffBox: {
    marginTop: 8,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
    paddingVertical: 4,
  },
  diffRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  lineNum: {
    width: 24,
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.tiny,
    textAlign: "center",
  },
  moreText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.tiny,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
