import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  Animated,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GitCommit, X, Check, Trash2, ChevronDown, ChevronUp } from "lucide-react-native";
import { COLORS, FONTS, FONT_SIZES } from "../constants/theme";
import { SharedHeader } from "./SharedHeader";
import { OpenFile } from "../types/ide";
import { diffService } from "../services/diffService";
import { DiffLine } from "./DiffLine";
import { openCodeZenService } from "../services/openCodeZenService";

interface CommitSheetProps {
  visible: boolean;
  onClose: () => void;
  files: OpenFile[];
  onPush: (message: string, approvedPaths: string[]) => Promise<void>;
  onDiscard: (paths: string[]) => void;
  apiKey: string;
}

type FileState = {
  path: string;
  approved: boolean;
  expanded: boolean;
};

export const CommitSheet: React.FC<CommitSheetProps> = ({
  visible,
  onClose,
  files,
  onPush,
  onDiscard,
  apiKey,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useState(new Animated.Value(0))[0];

  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [fileStates, setFileStates] = useState<FileState[]>([]);

  const diffMap = useMemo(() => {
    const map: Record<string, { added: number; removed: number; lines: ReturnType<typeof diffService.computeDiff> }> = {};
    for (const f of files) {
      const lines = diffService.computeDiff(f.originalContent, f.content);
      const added = lines.filter((l) => l.type === "added").length;
      const removed = lines.filter((l) => l.type === "removed").length;
      map[f.path] = { added, removed, lines };
    }
    return map;
  }, [files]);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }).start();
      setFileStates(files.map((f) => ({ path: f.path, approved: true, expanded: false })));
      if (apiKey && !message.trim()) generateAISuggestion();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const generateAISuggestion = async () => {
    setIsGenerating(true);
    try {
      const diffText = files
        .map((f) => {
          const changes = diffMap[f.path].lines
            .filter((l) => l.type !== "normal")
            .slice(0, 30)
            .map((l) => `${l.type === "added" ? "+" : "-"} ${l.content}`)
            .join("\n");
          return `--- ${f.path}\n${changes}`;
        })
        .join("\n\n");

      const summaryPrompt = `Generate a single short git commit message (max 50 chars, prefix with conventional tags like "feat:" or "fix:", no emojis) based on this diff:\n${diffText.slice(0, 1500)}\n\nOutput only the message text, nothing else.`;

      const messages = [{ id: "system", role: "system" as const, content: summaryPrompt }];
      const stream = openCodeZenService.streamCompletion(
        messages,
        apiKey,
        "deepseek-v4-flash-free",
      );

      let suggestion = "";
      for await (const chunk of stream) {
        if (chunk.content) suggestion += chunk.content;
      }
      setMessage(suggestion.trim().replace(/"/g, ""));
    } catch (e) {
      console.error("CommitSheet: Failed to generate commit message", e);
      setMessage("fix: update source code");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleApprove = (path: string) => {
    setFileStates((prev) =>
      prev.map((s) => (s.path === path ? { ...s, approved: !s.approved } : s)),
    );
  };

  const toggleExpand = (path: string) => {
    setFileStates((prev) =>
      prev.map((s) => (s.path === path ? { ...s, expanded: !s.expanded } : s)),
    );
  };

  const handleDiscardAll = () => {
    Alert.alert("Discard Changes", "Are you sure you want to revert all changes?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => onDiscard(files.map((f) => f.path)),
      },
    ]);
  };

  const handlePush = async () => {
    const approvedPaths = fileStates.filter((s) => s.approved).map((s) => s.path);
    if (approvedPaths.length === 0) {
      Alert.alert("No Files", "Please approve at least one file to push.");
      return;
    }
    if (!message.trim()) {
      Alert.alert("No Message", "Please enter a commit message.");
      return;
    }
    setIsPushing(true);
    try {
      await onPush(message.trim(), approvedPaths);
      onClose();
    } catch (e: any) {
      Alert.alert("Push Failed", e.message || "Failed to push changes to GitHub.");
    } finally {
      setIsPushing(false);
    }
  };

  const approvedCount = fileStates.filter((s) => s.approved).length;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [800, 0],
                  }),
                },
              ],
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <SharedHeader
            title="REVIEW_CHANGES"
            variant="floating"
            floatingTop={0}
            leftAction={{ icon: <X size={20} color={COLORS.text} />, onPress: onClose }}
          />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ padding: 16, paddingTop: 56 }}
          >
            {files.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>NO_MODIFICATIONS</Text>
              </View>
            ) : (
              files.map((file) => {
                const state = fileStates.find((s) => s.path === file.path);
                const diff = diffMap[file.path];
                const statusColor = state?.approved ? COLORS.success : COLORS.error;
                return (
                  <View key={file.path} style={[styles.fileCard, { borderColor: statusColor }]}>
                    <TouchableOpacity
                      style={styles.fileHeader}
                      onPress={() => toggleExpand(file.path)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.fileHeaderLeft}>
                        <Text style={styles.filePath} numberOfLines={1}>
                          {file.path}
                        </Text>
                        <Text style={styles.fileStats}>
                          <Text style={{ color: COLORS.success }}>+{diff.added}</Text>
                          {" / "}
                          <Text style={{ color: COLORS.error }}>-{diff.removed}</Text>
                          {" lines"}
                        </Text>
                      </View>
                      <View style={styles.fileActions}>
                        <TouchableOpacity
                          style={[styles.iconBtn, { borderColor: statusColor }]}
                          onPress={() => toggleApprove(file.path)}
                        >
                          {state?.approved ? (
                            <Check size={16} color={COLORS.success} />
                          ) : (
                            <X size={16} color={COLORS.error} />
                          )}
                        </TouchableOpacity>
                        {state?.expanded ? (
                          <ChevronUp size={16} color={COLORS.textDim} />
                        ) : (
                          <ChevronDown size={16} color={COLORS.textDim} />
                        )}
                      </View>
                    </TouchableOpacity>

                    {state?.expanded && (
                      <View style={styles.diffBox}>
                        {diff.lines
                          .filter((l) => l.type !== "normal")
                          .slice(0, 40)
                          .map((line) => (
                            <DiffLine key={line.id} type={line.type} content={line.content} />
                          ))}
                        {diff.lines.filter((l) => l.type !== "normal").length > 40 && (
                          <Text style={styles.moreText}>... more changes</Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.messageRow}>
              <GitCommit size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.messageInput}
                value={message}
                onChangeText={setMessage}
                placeholder="feat: describe changes"
                placeholderTextColor={COLORS.textDim}
                editable={!isPushing}
                autoCapitalize="none"
              />
              {isGenerating && <ActivityIndicator size="small" color={COLORS.primary} />}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.btn, styles.discardBtn]}
                onPress={handleDiscardAll}
                disabled={isPushing}
              >
                <Trash2 size={16} color={COLORS.error} style={{ marginRight: 8 }} />
                <Text style={styles.discardText}>DISCARD ALL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.btn,
                  styles.pushBtn,
                  (approvedCount === 0 || !message.trim()) && styles.disabledBtn,
                ]}
                onPress={handlePush}
                disabled={isPushing || approvedCount === 0 || !message.trim()}
              >
                {isPushing ? (
                  <ActivityIndicator size="small" color="#0E0E0E" />
                ) : (
                  <>
                    <GitCommit size={16} color="#0E0E0E" style={{ marginRight: 8 }} />
                    <Text style={styles.pushText}>
                      PUSH {approvedCount}/{files.length}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    height: "85%",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary,
    overflow: "hidden",
  },
  scroll: { flex: 1 },
  emptyBox: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.body,
  },
  fileCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  fileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  fileHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  filePath: {
    color: COLORS.text,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.small,
    marginBottom: 4,
  },
  fileStats: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.tiny,
  },
  fileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  diffBox: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingVertical: 8,
  },
  moreText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.tiny,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 16,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  messageInput: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.body,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 4,
  },
  discardBtn: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  discardText: {
    color: COLORS.error,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.small,
  },
  pushBtn: {
    backgroundColor: COLORS.primary,
  },
  pushText: {
    color: "#0E0E0E",
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.small,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
