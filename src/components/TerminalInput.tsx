import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Modal,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { COLORS, FONTS, FONT_SIZES } from "../constants/theme";
import {
  Paperclip,
  Camera,
  Image as ImageIcon,
  X,
  Globe,
  Maximize2,
  Send,
  Check,
  GitBranch,
} from "lucide-react-native";
import { useImagePicker } from "../hooks/useImagePicker";
import { TRANSLATIONS } from "../constants/translations";
import { SharedHeader } from "./SharedHeader";

import { DatabaseSettings } from "../services/database";

interface TerminalInputProps {
  onSend: (
    content: string,
    attachment?: { uri: string; type: string; base64?: string },
  ) => void;
  onStop?: () => void;
  onCommand: (command: string, args: string[]) => void;
  customModels: { id: string; name: string }[];
  modelPresets: { id: string; name: string }[];
  settings: DatabaseSettings;
  language: "ar" | "en";
  disabled?: boolean;
  onLayoutY?: (y: number) => void;
  modifiedCount?: number;
}

const SUGGESTIONS = [
  { cmd: "agent/", desc: "TOGGLE_AGENT_MODE" },
  { cmd: "chat/", desc: "INIT_NEW_SESSION" },
  { cmd: "history/", desc: "LOG_ARCHIVE" },
  { cmd: "settings/", desc: "CONFIG_SYSTEM" },
  { cmd: "clear/", desc: "WIPE_CURRENT_LOG" },
  { cmd: "model/", desc: "SWITCH_AI_MODEL" },
  { cmd: "provider/", desc: "SWITCH_AI_PROVIDER" },
  { cmd: "search/", desc: "WEB_SEARCH_QUERY" },
  { cmd: "ide/", desc: "OPEN_IDE_WORKSPACE" },
  { cmd: "commit/", desc: "REVIEW_AND_PUSH" },
];

export const TerminalInput = ({
  onSend,
  onStop,
  onCommand,
  customModels,
  modelPresets,
  settings,
  language,
  disabled,
  onLayoutY,
  modifiedCount = 0,
}: TerminalInputProps) => {
  const t = TRANSLATIONS[language || "ar"];
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<{
    uri: string;
    type: string;
    base64?: string;
  } | null>(null);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const { pickImage, takePhoto } = useImagePicker();

  const isCommand = text.startsWith("/") || text.endsWith("/");
  const isModelCmd =
    text.toLowerCase().startsWith("model/") ||
    text.toLowerCase().startsWith("/model");
  const isProviderCmd =
    text.toLowerCase().startsWith("provider/") ||
    text.toLowerCase().startsWith("/provider");
  const isSearchCmd =
    text.toLowerCase().startsWith("search/") ||
    text.toLowerCase().startsWith("/search ");

  const showSuggestions =
    (text === "/" ||
      (text.length > 0 &&
        isCommand &&
        !text.includes(" ") &&
        !text.endsWith("/"))) &&
    !isModelCmd &&
    !isProviderCmd;
  const showModelPresets = isModelCmd && !text.includes(" ");
  const showProviderOptions = isProviderCmd && !text.includes(" ");

  const allModels = Array.from(
    new Map([...modelPresets, ...customModels].map((m) => [m.id, m])).values()
  );

  const handleAction = () => {
    if (disabled) {
      onStop?.();
      return;
    }

    if (!text.trim() && !attachment) return;

    const currentText = text.trim();
    const currentAttachment = attachment || undefined;

    setText("");
    setAttachment(null);

    if (isSearchCmd) {
      let query = currentText;
      if (query.toLowerCase().startsWith("search/"))
        query = query.slice(7).trim();
      else if (query.toLowerCase().startsWith("/search"))
        query = query.slice(7).trim();
      if (query) {
        onCommand("search", query.split(" "));
      }
      return;
    }

    if (isCommand && onCommand) {
      let cleanText = currentText;
      if (currentText.startsWith("/")) cleanText = currentText.slice(1);
      else if (currentText.endsWith("/")) cleanText = currentText.slice(0, -1);

      const tokens = cleanText.trim().split(" ");
      const cmd = tokens[0].toLowerCase();
      const args = tokens.slice(1);
      onCommand(cmd, args);
    } else {
      onSend(currentText, currentAttachment);
    }
  };

  const selectSuggestion = (cmd: string) => {
    if (
      cmd === "settings/" ||
      cmd === "chat/" ||
      cmd === "clear/" ||
      cmd === "history/"
    ) {
      onCommand(cmd.replace("/", ""), []);
      setText("");
    } else if (cmd.startsWith("model/ ")) {
      const modelId = cmd.slice(7);
      onCommand("model", [modelId]);
      setText("");
    } else if (cmd.startsWith("provider/ ")) {
      const provider = cmd.slice(10);
      onCommand("provider", [provider]);
      setText("");
    } else {
      setText(cmd);
    }
  };

  const showEditorButton = text.split("\n").length >= 3 || text.length > 100;

  return (
    <View
      style={styles.outerContainer}
      onLayout={(e) => onLayoutY?.(e.nativeEvent.layout.y)}
    >
      <Modal
        visible={isEditorVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.editorSafe} edges={["bottom"]}>
          <SharedHeader
            title={t.editor_title}
            subtitle={t.editor_mode}
            rightActions={[{ icon: <X size={20} color={COLORS.text} />, onPress: () => setIsEditorVisible(false) }]}
            variant="floating"
          />
          <TextInput
            style={styles.editorInput}
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
            placeholder={t.message_placeholder}
            placeholderTextColor={COLORS.textDim}
          />
          <View style={styles.editorFooter}>
            <Text style={styles.charCount}>{text.length} CHARS</Text>
            <TouchableOpacity
              style={styles.editorSend}
              onPress={() => {
                setIsEditorVisible(false);
                handleAction();
              }}
            >
              <Send size={18} color="#000" />
              <Text style={styles.editorSendText}>{t.commit_send}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {modifiedCount > 0 && !isCommand && (
        <TouchableOpacity
          style={styles.modifiedCard}
          onPress={() => onCommand("commit", [])}
          activeOpacity={0.8}
        >
          <View style={styles.modifiedCardLeft}>
            <GitBranch size={16} color={COLORS.success} />
            <Text style={styles.modifiedCardText}>
              {modifiedCount} FILE{modifiedCount > 1 ? "S" : ""} MODIFIED
            </Text>
          </View>
          <View style={styles.modifiedCardRight}>
            <Text style={styles.modifiedCardAction}>REVIEW / PUSH</Text>
            <Check size={14} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
      )}

      {showSuggestions && (
        <View style={styles.suggestionsBox}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity
                key={s.cmd}
                style={styles.suggestionItem}
                onPress={() => selectSuggestion(s.cmd)}
              >
                <Text style={styles.suggestionCmd} numberOfLines={1}>
                  {s.cmd}
                </Text>
                <Text style={styles.suggestionDesc} numberOfLines={1}>
                  // {s.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {showModelPresets && (
        <View style={styles.suggestionsBox}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <TouchableOpacity
              style={[
                styles.suggestionItem,
                { borderBottomWidth: 1, borderBottomColor: COLORS.primary, paddingVertical: 10 }
              ]}
              onPress={() => selectSuggestion(settings.ai_provider === "openrouter" ? "provider/ opencode" : "provider/ openrouter")}
            >
              <Text style={[styles.suggestionCmd, { color: COLORS.primary }]} numberOfLines={1}>
                {settings.ai_provider === "openrouter" ? ">>> ACTIVATE: OPENCODE" : ">>> ACTIVATE: OPENROUTER"}
              </Text>
              <Text style={styles.suggestionDesc} numberOfLines={1}>
                // CURRENT: {settings.ai_provider.toUpperCase()}
              </Text>
            </TouchableOpacity>
            {allModels.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.suggestionItem}
                onPress={() => selectSuggestion(`model/ ${m.id}`)}
              >
                <Text style={styles.suggestionCmd} numberOfLines={1}>
                  {m.name}
                </Text>
                <Text style={styles.suggestionDesc} numberOfLines={1}>
                  // {m.id}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {showProviderOptions && (
        <View style={styles.suggestionsBox}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => selectSuggestion("provider/ openrouter")}
            >
              <Text style={[styles.suggestionCmd, settings.ai_provider === "openrouter" && { color: COLORS.success }]} numberOfLines={1}>
                openrouter
              </Text>
              <Text style={styles.suggestionDesc} numberOfLines={1}>
                // {settings.ai_provider === "openrouter" ? "ACTIVE_AI_PROVIDER" : "SWITCH_TO_OPENROUTER"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => selectSuggestion("provider/ opencode")}
            >
              <Text style={[styles.suggestionCmd, settings.ai_provider === "opencode" && { color: COLORS.success }]} numberOfLines={1}>
                opencode
              </Text>
              <Text style={styles.suggestionDesc} numberOfLines={1}>
                // {settings.ai_provider === "opencode" ? "ACTIVE_AI_PROVIDER" : "SWITCH_TO_OPENCODE"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {attachment && (
        <View style={styles.previewContainer}>
          <View style={styles.previewBox}>
            <Image
              source={{ uri: attachment.uri }}
              style={styles.previewImage}
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setAttachment(null)}
            >
              <X size={12} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            pickImage().then((r) => {
              if (r)
                setAttachment({
                  uri: r.uri,
                  type: r.type,
                  base64: r.base64 || undefined,
                });
            })
          }
          disabled={disabled}
        >
          <ImageIcon size={20} color={COLORS.textDim} />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          {isSearchCmd ? (
            <Globe size={18} color={COLORS.primary} style={styles.searchIcon} />
          ) : (
            <Text style={[styles.prompt, isCommand && styles.commandPrompt]}>
              {isCommand ? "$" : ">"}
            </Text>
          )}
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={
              isSearchCmd
                ? t.search_placeholder
                : isCommand
                  ? t.command_placeholder
                  : t.message_placeholder
            }
            placeholderTextColor={COLORS.textDim}
            style={[
              styles.input,
              isCommand && styles.commandInput,
              isSearchCmd && styles.searchInput,
            ]}
            multiline
            editable={!disabled}
            autoCapitalize="none"
          />
          {showEditorButton && (
            <TouchableOpacity
              onPress={() => setIsEditorVisible(true)}
              style={styles.maximizeBtn}
            >
              <Maximize2 size={16} color={COLORS.primaryDim} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={handleAction}
          disabled={!disabled && !text.trim() && !attachment}
          style={[
            styles.sendBtn,
            isCommand && styles.execBtn,
            isSearchCmd && styles.webBtn,
          ]}
        >
          <Text style={styles.sendBtnText}>
            {disabled
              ? "STOP"
              : isSearchCmd
                ? "WEB"
                : isCommand
                  ? "EXEC"
                  : "SEND"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 56,
    maxHeight: 180,
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 4,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.body,
    paddingVertical: 8,
    maxHeight: 164,
    textAlignVertical: "bottom",
  },
  iconButton: { padding: 8, marginBottom: 2 },
  prompt: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.body + 2,
    marginBottom: 10,
    marginRight: 6,
  },
  commandPrompt: { color: COLORS.success },
  commandInput: { color: COLORS.success },
  searchInput: { color: COLORS.primary },
  searchIcon: { marginBottom: 14, marginRight: 6 },
  maximizeBtn: { padding: 8, marginBottom: 4 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primaryDim,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginLeft: 8,
  },
  execBtn: { borderColor: COLORS.success },
  webBtn: { borderColor: COLORS.primary },
  sendBtnText: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: 11 },
  suggestionsBox: {
    backgroundColor: COLORS.surface,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    padding: 8,
    maxHeight: 220,
    zIndex: 9999,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  modifiedCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modifiedCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modifiedCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modifiedCardText: {
    color: COLORS.text,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.small,
  },
  modifiedCardAction: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.tiny,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  suggestionCmd: {
    color: COLORS.success,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.small,
    marginRight: 12,
  },
  suggestionDesc: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.tiny,
    flex: 1,
  },
  previewContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
  },
  previewBox: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: COLORS.primary,
    position: "relative",
  },
  previewImage: { width: "100%", height: "100%" },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  editorSafe: { flex: 1, backgroundColor: COLORS.background },
  editorInput: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: 16,
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 20,
    textAlignVertical: "top",
  },
  editorFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  charCount: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: 10 },
  editorSend: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  editorSendText: {
    color: "#000",
    fontFamily: FONTS.monoBold,
    fontSize: 12,
    marginLeft: 8,
  },
});
