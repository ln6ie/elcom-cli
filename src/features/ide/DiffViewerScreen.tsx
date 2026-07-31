import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GitCommit, Trash2 } from "lucide-react-native";
import { COLORS, FONTS, FONT_SIZES } from "@/constants/theme";
import { SharedHeader } from "@/components/SharedHeader";
import { useIDEState } from "@/hooks/useIDEState";
import { useLocalFiles } from "@/hooks/useLocalFiles";
import { diffService, DiffLineInfo } from "@/services/diffService";
import { DiffLine } from "@/components/DiffLine";
import { CommitModal } from "@/components/CommitModal";
import { githubService } from "@/services/githubService";
import { base64Service } from "@/services/base64Service";

interface DiffViewerScreenProps {
  onBack: () => void;
}

export const DiffViewerScreen: React.FC<DiffViewerScreenProps> = ({ onBack }) => {
  const {
    githubToken,
    selectedRepo,
    activeFile,
    openFiles,
    setOpenFiles,
    updateOpenFileContent,
  } = useIDEState();

  const { writeLocalFile } = useLocalFiles();

  const [diffLines, setDiffLines] = useState<DiffLineInfo[]>([]);
  const [isCommitModalVisible, setIsCommitModalVisible] = useState(false);
  const [isSubmittingCommit, setIsSubmittingCommit] = useState(false);

  const currentFile = openFiles.find((f) => f.path === activeFile);

  useEffect(() => {
    if (currentFile) {
      const lines = diffService.computeDiff(currentFile.originalContent, currentFile.content);
      setDiffLines(lines);
    }
  }, [currentFile]);

  if (!currentFile || !activeFile || !selectedRepo) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorText}>NO_DIFF_CONTEXT</Text>
      </SafeAreaView>
    );
  }

  const handleDiscard = () => {
    Alert.alert("Discard Changes", "Are you sure you want to revert all changes made to this file?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: async () => {
          try {
            await writeLocalFile(selectedRepo.name, activeFile, currentFile.originalContent);
            updateOpenFileContent(activeFile, currentFile.originalContent);
            onBack();
          } catch (e) {
            Alert.alert("Error", "Failed to discard local modifications.");
          }
        },
      },
    ]);
  };

  const handleCommitSubmit = async (commitMessage: string) => {
    if (!githubToken) return;
    setIsSubmittingCommit(true);
    try {
      const owner = selectedRepo.owner.login;
      const repo = selectedRepo.name;
      const base64Code = base64Service.encode(currentFile.content);

      // Perform PUT request to commit changes directly on GitHub
      const result = await githubService.updateFile(
        githubToken,
        owner,
        repo,
        activeFile,
        base64Code,
        commitMessage,
        currentFile.sha,
      );

      // Update original content in state context to match committed content
      setOpenFiles((prev) =>
        prev.map((f) =>
          f.path === activeFile
            ? { ...f, originalContent: currentFile.content, sha: result.sha }
            : f,
        ),
      );

      setIsCommitModalVisible(false);
      Alert.alert("Success", "Pushed successfully.");
      onBack();
    } catch (e: any) {
      console.error("DiffViewerScreen: Push failed", e);
      Alert.alert("Push Failed", e.message || "Failed to commit changes to GitHub.");
    } finally {
      setIsSubmittingCommit(false);
    }
  };

  const diffSummaryText = diffLines
    .filter((l) => l.type !== "normal")
    .map((l) => `${l.type === "added" ? "+" : "-"}: ${l.content}`)
    .join("\n");

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <SharedHeader
        title={`DIFF: ${activeFile.substring(activeFile.lastIndexOf("/") + 1).toUpperCase()}`}
        onBack={onBack}
        variant="floating"
      />

      <FlatList
        data={diffLines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingTop: 64 }]}
        renderItem={({ item }) => <DiffLine type={item.type} content={item.content} />}
        ListEmptyComponent={
          <View style={styles.centerWrapper}>
            <Text style={styles.emptyText}>NO_MODIFICATIONS_DETECTED</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.btn, styles.discardBtn]} onPress={handleDiscard}>
          <Trash2 size={16} color={COLORS.error} style={{ marginRight: 8 }} />
          <Text style={styles.discardText}>DISCARD</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.btn,
            styles.commitBtn,
            !diffLines.some((l) => l.type !== "normal") && styles.disabledBtn,
          ]}
          onPress={() => setIsCommitModalVisible(true)}
          disabled={!diffLines.some((l) => l.type !== "normal")}
        >
          <GitCommit size={16} color="#0E0E0E" style={{ marginRight: 8 }} />
          <Text style={styles.commitText}>APPLY_PUSH</Text>
        </TouchableOpacity>
      </View>

      <CommitModal
        visible={isCommitModalVisible}
        onClose={() => setIsCommitModalVisible(false)}
        onSubmit={handleCommitSubmit}
        diffText={diffSummaryText}
        apiKey={process.env.EXPO_PUBLIC_OPENCODE_API_KEY || ""} // Uses OpenCode Zen API key to get suggested commit
        isSubmitting={isSubmittingCommit}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  listContent: { paddingVertical: 8 },
  centerWrapper: { flex: 1, paddingVertical: 48, alignItems: "center" },
  emptyText: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.body },
  errorText: {
    color: COLORS.error,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.body,
    textAlign: "center",
    marginTop: 48,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
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
    marginRight: 12,
  },
  discardText: { color: COLORS.error, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.body },
  commitBtn: {
    backgroundColor: COLORS.success,
  },
  commitText: { color: "#0E0E0E", fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.body },
  disabledBtn: {
    opacity: 0.5,
  },
});
