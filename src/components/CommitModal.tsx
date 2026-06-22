import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { COLORS, FONTS, FONT_SIZES } from "../constants/theme";
import { openCodeZenService } from "../services/openCodeZenService";

interface CommitModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  diffText: string;
  apiKey: string;
  isSubmitting: boolean;
}

export const CommitModal: React.FC<CommitModalProps> = ({
  visible,
  onClose,
  onSubmit,
  diffText,
  apiKey,
  isSubmitting,
}) => {
  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (visible && apiKey) {
      generateAISuggestion();
    } else {
      setMessage("");
    }
  }, [visible, apiKey]);

  const generateAISuggestion = async () => {
    setIsGenerating(true);
    try {
      const summaryPrompt = `Generate a single short git commit message (max 50 chars, prefix with conventional tags like "feat:" or "fix:", no emojis) based on this diff:
${diffText.slice(0, 1000)}

Output only the message text, nothing else.`;

      const messages = [{ id: "system", role: "system" as const, content: summaryPrompt }];
      const stream = openCodeZenService.streamCompletion(
        messages,
        apiKey,
        "deepseek-v4-flash-free",
      );

      let suggestion = "";
      for await (const chunk of stream) {
        if (chunk.content) {
          suggestion += chunk.content;
        }
      }
      setMessage(suggestion.trim().replace(/"/g, ""));
    } catch (e) {
      console.error("CommitModal: Failed to generate commit message", e);
      setMessage("fix: update source code");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = () => {
    if (message.trim()) {
      onSubmit(message.trim());
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.contentCard}>
          <Text style={styles.titleText}>COMMIT_CHANGES</Text>
          <Text style={styles.subtitleText}>
            Enter a commit message to apply modifications and push to GitHub.
          </Text>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="feat: add new functionality"
              placeholderTextColor={COLORS.textDim}
              editable={!isSubmitting}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          {isGenerating && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.loadingText}>Generating AI suggestion...</Text>
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn, !message.trim() && styles.disabledBtn]}
              onPress={handleConfirm}
              disabled={isSubmitting || !message.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#0E0E0E" />
              ) : (
                <Text style={styles.confirmBtnText}>PUSH_COMMIT</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  contentCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: 20,
    borderRadius: 8,
  },
  titleText: {
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.heading2,
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitleText: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.small,
    color: COLORS.textDim,
    lineHeight: 18,
    marginBottom: 20,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  input: {
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.body,
    padding: 0,
    height: 36,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  loadingText: {
    color: COLORS.primaryDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.small,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 12,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    color: COLORS.textDim,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.small,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
  },
  confirmBtnText: {
    color: "#0E0E0E",
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.small,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
