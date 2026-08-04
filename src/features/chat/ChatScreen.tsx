import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  PanResponder,
  Keyboard,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useChat } from "@/features/chat/useChat";
import { MessageBubble } from "@/components/MessageBubble";
import { TerminalInput } from "@/components/TerminalInput";
import { CliNotification } from "@/components/CliNotification";
import { WalkingCharacter } from "@/components/WalkingCharacter";
import { SharedHeader } from "@/components/SharedHeader";
import { useRef, useEffect, useState, useCallback } from "react";
import { COLORS, FONTS, FONT_SIZES } from "@/constants/theme";
import { DatabaseSettings, database } from "@/services/database";
import { TRANSLATIONS } from "@/constants/translations";
import { useSQLiteContext } from "expo-sqlite";
import * as Crypto from "expo-crypto";
import { Menu, GitBranch, Settings } from "lucide-react-native";

import { HistoryLoader } from "@/components/chat/HistoryLoader";
import { StatusArea } from "@/components/chat/StatusArea";
import { EmptyState } from "@/components/chat/EmptyState";

import { GithubDrawer } from "@/features/github/GithubDrawer";
import { SettingsDrawer } from "@/features/settings/SettingsDrawer";
import { CommitSheet } from "@/components/CommitSheet";
import { useIDEState } from "@/hooks/useIDEState";
import { GitHubRepo, FileNode } from "@/types/ide";
import { executeTool, ToolExecutionResult } from "@/services/tools";
import { parseToolCalls, ToolCall as XmlToolCall } from "@/components/ToolCallCard";
import { useLocalFiles } from "@/hooks/useLocalFiles";
import { githubService } from "@/services/githubService";
import { base64Service } from "@/services/base64Service";
import { ModelInfo } from "@/services/modelService";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.75;

interface ChatScreenProps {
  conversationId: string;
  settings: DatabaseSettings;
  customModels: { id: string; name: string }[];
  modelPresets: { id: string; name: string }[];
  onCommand: (cmd: string, args: string[]) => void;
  openRouterModels: ModelInfo[];
  openCodeModels: ModelInfo[];
  modelsLoading?: boolean;
  modelsError?: string | null;
  onRetryModels?: () => void;
  updateMultipleSettings?: (updates: Partial<DatabaseSettings>) => Promise<void>;
}

// شاشة المحادثة الموحدة الحاوية لبيئة التطوير
export const ChatScreen = ({
  conversationId,
  settings,
  customModels,
  modelPresets,
  onCommand,
  openRouterModels,
  openCodeModels,
  modelsLoading,
  modelsError,
  onRetryModels,
  updateMultipleSettings,
}: ChatScreenProps) => {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const {
    messages,
    setMessages,
    conversationTitle,
    isLoading,
    isLoadingMore,
    error,
    sendMessage,
    stopStreaming,
    loadMore,
    refreshHistory,
    activeConnection,
  } = useChat(conversationId, settings);

  const {
    openFiles,
    setOpenFiles,
    selectedRepo,
    fileTree,
    updateOpenFileContent,
    openFileInEditor,
    githubToken,
    setSelectedRepo,
    setFileTree,
  } = useIDEState();
  const { writeLocalFile, readLocalFile } = useLocalFiles();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommitSheetOpen, setIsCommitSheetOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const settingsSlideAnim = useRef(new Animated.Value(0)).current;
  const currentAnimValue = useRef(0);
  const currentSettingsAnimValue = useRef(0);
  const isDrawerOpenRef = useRef(isDrawerOpen);
  const isSettingsOpenRef = useRef(isSettingsOpen);
  const isKeyboardVisibleRef = useRef(false);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => { isKeyboardVisibleRef.current = true; });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => { isKeyboardVisibleRef.current = false; });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // حفظ الريبو المرتبط بالمحادثة
  useEffect(() => {
    if (selectedRepo && conversationId) {
      database.updateConversationRepo(db, conversationId, selectedRepo.name, selectedRepo.owner.login);
    }
  }, [selectedRepo, conversationId]);

  // استعادة الريبو عند تحميل المحادثة
  useEffect(() => {
    const restoreRepo = async () => {
      const conv = await database.getConversationById(db, conversationId);
      if (conv && (conv as any).repo_name && (conv as any).repo_owner) {
        const repoName = (conv as any).repo_name;
        const repoOwner = (conv as any).repo_owner;
        if (!selectedRepo || selectedRepo.name !== repoName) {
          const repo: GitHubRepo = {
            id: 0,
            name: repoName,
            full_name: `${repoOwner}/${repoName}`,
            private: false,
            updated_at: new Date().toISOString(),
            owner: { login: repoOwner },
          };
          setSelectedRepo(repo);
        }
        if (githubToken && fileTree.length === 0) {
          try {
            const tree = await githubService.getRepoTree(githubToken, repoOwner, repoName);
            setFileTree(tree);
          } catch (_) {}
        }
      }
    };
    restoreRepo();
  }, [conversationId, githubToken]);

  useEffect(() => {
    isDrawerOpenRef.current = isDrawerOpen;
  }, [isDrawerOpen]);

  useEffect(() => {
    isSettingsOpenRef.current = isSettingsOpen;
  }, [isSettingsOpen]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx, dy, x0 }) => {
        if (isKeyboardVisibleRef.current) return false;
        if (Math.abs(dx) < 25 || Math.abs(dx) < Math.abs(dy) * 2.5) return false;
        const isOpen = isDrawerOpenRef.current;
        const isSettings = isSettingsOpenRef.current;
        if (isOpen) return dx < -15;
        if (isSettings) return dx > 15;
        return (x0 < 40 && dx > 15) || (x0 > width - 40 && dx < -15);
      },
      onMoveShouldSetPanResponderCapture: (_, { dx, dy, x0 }) => {
        if (isKeyboardVisibleRef.current) return false;
        if (Math.abs(dx) < 25 || Math.abs(dx) < Math.abs(dy) * 2.5) return false;
        const isOpen = isDrawerOpenRef.current;
        const isSettings = isSettingsOpenRef.current;
        if (isOpen) return dx < -15;
        if (isSettings) return dx > 15;
        return (x0 < 40 && dx > 15) || (x0 > width - 40 && dx < -15);
      },
      onPanResponderGrant: () => {
        slideAnim.stopAnimation((v) => { currentAnimValue.current = v; });
        settingsSlideAnim.stopAnimation((v) => { currentSettingsAnimValue.current = v; });
      },
      onPanResponderMove: (_, { dx }) => {
        const isOpen = isDrawerOpenRef.current;
        const isSettings = isSettingsOpenRef.current;
        if (isOpen) {
          const v = currentAnimValue.current + dx / DRAWER_WIDTH;
          slideAnim.setValue(Math.max(0, Math.min(1, v)));
        } else if (isSettings) {
          const v = currentSettingsAnimValue.current - dx / DRAWER_WIDTH;
          settingsSlideAnim.setValue(Math.max(0, Math.min(1, v)));
        } else if (dx > 0) {
          const v = currentAnimValue.current + dx / DRAWER_WIDTH;
          slideAnim.setValue(Math.max(0, Math.min(1, v)));
        } else if (dx < 0) {
          const v = currentSettingsAnimValue.current - dx / DRAWER_WIDTH;
          settingsSlideAnim.setValue(Math.max(0, Math.min(1, v)));
        }
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        const isOpen = isDrawerOpenRef.current;
        const isSettings = isSettingsOpenRef.current;
        if (isOpen) {
          const target = currentAnimValue.current + dx / DRAWER_WIDTH;
          const shouldOpen = vx > 0.5 || target > 0.5;
          setIsDrawerOpen(shouldOpen);
          Animated.timing(slideAnim, { toValue: shouldOpen ? 1 : 0, duration: 200, useNativeDriver: true }).start();
        } else if (isSettings) {
          const target = currentSettingsAnimValue.current - dx / DRAWER_WIDTH;
          const shouldOpen = vx < -0.5 || target > 0.5;
          setIsSettingsOpen(shouldOpen);
          Animated.timing(settingsSlideAnim, { toValue: shouldOpen ? 1 : 0, duration: 200, useNativeDriver: true }).start();
        } else if (dx > 0) {
          const target = currentAnimValue.current + dx / DRAWER_WIDTH;
          const shouldOpen = target > 0.3;
          setIsDrawerOpen(shouldOpen);
          Animated.timing(slideAnim, { toValue: shouldOpen ? 1 : 0, duration: 200, useNativeDriver: true }).start();
          if (!shouldOpen) {
            Animated.timing(settingsSlideAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
          }
        } else if (dx < 0) {
          const target = currentSettingsAnimValue.current - dx / DRAWER_WIDTH;
          const shouldOpen = target > 0.3;
          setIsSettingsOpen(shouldOpen);
          Animated.timing(settingsSlideAnim, { toValue: shouldOpen ? 1 : 0, duration: 200, useNativeDriver: true }).start();
          if (!shouldOpen) {
            Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
          }
        }
      },
    })
  ).current;

  const t = TRANSLATIONS[settings.language || "ar"];
  const [inputTopY, setInputTopY] = useState(0);
  const [notification, setNotification] = useState<{
    visible: boolean;
    message: string | string[];
    type: "success" | "error" | "info";
  }>({ visible: false, message: "", type: "info" });

  const [agentStatus, setAgentStatus] = useState<"idle" | "analyzing" | "editing">("idle");
  const agentPulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    if (agentStatus !== "idle") {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(agentPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(agentPulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
    } else {
      agentPulseAnim.setValue(1);
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [agentStatus]);

  const flatListRef = useRef<FlatList>(null);
  const isAtBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const contentHeightRef = useRef(0);

  const toggleDrawer = useCallback(() => {
    const nextState = !isDrawerOpen;
    setIsDrawerOpen(nextState);
    Animated.timing(slideAnim, {
      toValue: nextState ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
    if (nextState && isSettingsOpen) {
      setIsSettingsOpen(false);
      Animated.timing(settingsSlideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }
  }, [isDrawerOpen, isSettingsOpen]);

  const toggleSettings = useCallback(() => {
    const nextState = !isSettingsOpen;
    setIsSettingsOpen(nextState);
    Animated.timing(settingsSlideAnim, {
      toValue: nextState ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
    if (nextState && isDrawerOpen) {
      setIsDrawerOpen(false);
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }
  }, [isSettingsOpen, isDrawerOpen]);

  const syncFileToOpenFiles = async (
    filePath: string,
    toolName: string,
    originalContent?: string,
    sha?: string,
  ) => {
    if (!selectedRepo) return;
    const localContent = await readLocalFile(selectedRepo.name, filePath);
    if (!localContent) {
      console.warn(`[syncFileToOpenFiles] No local content for ${filePath}`);
      return;
    }

    const resolvedOriginalContent =
      toolName === "create" ? "" : (originalContent || localContent);

    if (!sha && resolvedOriginalContent) {
      try {
        const fileData = await githubService.getFileContent(
          githubToken || "",
          selectedRepo.owner.login,
          selectedRepo.name,
          filePath,
        );
        sha = fileData.sha;
      } catch (e) {
        console.warn(`[syncFileToOpenFiles] Failed to fetch SHA for ${filePath}`, e);
      }
    }

    const contentMatch = localContent === resolvedOriginalContent;
    console.log(`[syncFileToOpenFiles] ${toolName} ${filePath} content===orig=${contentMatch} contentLen=${localContent.length} origLen=${resolvedOriginalContent.length} sha=${sha || "none"}`);

    setOpenFiles((prev) => {
      const existing = prev.find((f) => f.path === filePath);
      if (existing) {
        return prev.map((f) =>
          f.path === filePath
            ? {
                ...f,
                content: localContent,
                originalContent: resolvedOriginalContent,
                sha: sha || f.sha,
              }
            : f
        );
      }
      return [
        ...prev,
        {
          path: filePath,
          content: localContent,
          originalContent: resolvedOriginalContent,
          sha: sha || "",
        },
      ];
    });
  };

  const executeFunctionToolCalls = async (toolCalls: any[]) => {
    for (const toolCall of toolCalls) {
      const { result: resultText, originalContent, sha } = await executeTool(
        toolCall,
        selectedRepo?.owner.login || "",
        selectedRepo?.name || "",
        githubToken || "",
        openFiles,
      );

      const args = JSON.parse(toolCall.function.arguments);
      if (args.file_path) {
        if (toolCall.function.name === "read") {
          await syncFileToOpenFiles(args.file_path, "read", originalContent, sha);
        } else if (toolCall.function.name === "edit" || toolCall.function.name === "create") {
          await syncFileToOpenFiles(args.file_path, toolCall.function.name, originalContent, sha);
        }
      }

      const toolMsgId = Crypto.randomUUID();
      const toolCallId = toolCall.id || `call_${toolMsgId}`;
      const toolContent = `[TOOL_RESULT: ${toolCall.function.name}]\n${resultText}`;
      await database.addMessage(db, toolMsgId, conversationId, "user", toolContent, undefined, undefined, undefined, undefined, toolCallId);
      setMessages((prev) => [...prev, { id: toolMsgId, role: "user", content: toolContent, tool_call_id: toolCallId }]);
    }
  };

  const executeXmlToolCalls = async (content: string) => {
    const { calls } = parseToolCalls(content);
    for (const call of calls) {
      if (call.type === "read" && selectedRepo) {
        try {
          const fileData = await githubService.getFileContent(
            githubToken || "",
            selectedRepo.owner.login,
            selectedRepo.name,
            call.path,
          );
          const decoded = base64Service.decode(fileData.content);
          await writeLocalFile(selectedRepo.name, call.path, decoded);
          openFileInEditor(call.path, decoded, decoded, fileData.sha);

          const toolMsgId = Crypto.randomUUID();
          const toolMsgContent = `[FILE_CONTENT: ${call.path}]\n\n${decoded}`;
          await database.addMessage(db, toolMsgId, conversationId, "user", toolMsgContent);
          setMessages((prev) => [...prev, { id: toolMsgId, role: "user", content: toolMsgContent }]);
        } catch (e) {
          console.error(e);
        }
      } else if (call.type === "edit" && selectedRepo) {
        try {
          const fileData = await githubService.getFileContent(
            githubToken || "",
            selectedRepo.owner.login,
            selectedRepo.name,
            call.path,
          );
          const originalContent = base64Service.decode(fileData.content);
          let updatedContent = originalContent;
          if (originalContent.includes(call.oldCode)) {
            updatedContent = originalContent.replace(call.oldCode, call.newCode);
            await writeLocalFile(selectedRepo.name, call.path, updatedContent);
            openFileInEditor(call.path, updatedContent, originalContent, fileData.sha);
          }

          const toolMsgId = Crypto.randomUUID();
          const toolMsgContent = `[TOOL_RESULT: edit]\nEdited ${call.path}`;
          await database.addMessage(db, toolMsgId, conversationId, "user", toolMsgContent);
          setMessages((prev) => [...prev, { id: toolMsgId, role: "user", content: toolMsgContent }]);
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const scanLocalChanges = async (): Promise<number> => {
    if (!selectedRepo || !githubToken || fileTree.length === 0) return 0;

    const blobs = fileTree.filter((f) => f.type === "blob");
    const owner = selectedRepo.owner.login;
    const repo = selectedRepo.name;
    let modifiedCount = 0;

    for (const node of blobs) {
      try {
        const localContent = await readLocalFile(repo, node.path);
        if (localContent === null) continue;

        const fileData = await githubService.getFileContent(githubToken, owner, repo, node.path);
        const remoteContent = base64Service.decode(fileData.content);

        if (localContent !== remoteContent) {
          modifiedCount++;
          setOpenFiles((prev) => {
            const exists = prev.some((f) => f.path === node.path);
            if (exists) {
              return prev.map((f) =>
                f.path === node.path
                  ? { ...f, content: localContent, originalContent: remoteContent, sha: fileData.sha }
                  : f
              );
            }
            return [...prev, { path: node.path, content: localContent, originalContent: remoteContent, sha: fileData.sha }];
          });
        }
      } catch (e) {
        console.warn(`[scanLocalChanges] Failed for ${node.path}`, e);
      }
    }

    return modifiedCount;
  };

  const handleSend = async (content: string) => {
    console.log(`[handleSend] >>> START content="${content.slice(0, 80)}"`);
    let result = await sendMessage(content);
    let loopCount = 0;
    console.log(`[handleSend] >>> initial response tool_calls=${result.tool_calls?.length || 0} xml=${!!(result.content?.includes("<read_file>") || result.content?.includes("<str_replace>"))}`);

    while (loopCount < 10) {
      loopCount++;
      console.log(`[handleSend] >>> LOOP ${loopCount}/10`);

      if (result.tool_calls && result.tool_calls.length > 0) {
        console.log(`[handleSend] >>> executing ${result.tool_calls.length} function tool calls`);
        await executeFunctionToolCalls(result.tool_calls);
      } else if (result.content && (result.content.includes("<read_file>") || result.content.includes("<str_replace>"))) {
        console.log(`[handleSend] >>> executing XML tool calls`);
        await executeXmlToolCalls(result.content);
      } else {
        console.log(`[handleSend] >>> no tools, breaking loop`);
        break;
      }

      result = await sendMessage(
        `[SYSTEM: Tool results above. Continue your task.]`,
        undefined,
        false,
        true,
      );
      console.log(`[handleSend] >>> loop ${loopCount} response: tool_calls=${result.tool_calls?.length || 0}`);
    }

    console.log(`[handleSend] <<< DONE after ${loopCount} loops`);
  };

  const handleDiscardAll = () => {
    Alert.alert("Discard Changes", "Are you sure you want to revert all changes made to your files?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: async () => {
          if (!selectedRepo) return;
          try {
            for (const f of openFiles) {
              await writeLocalFile(selectedRepo.name, f.path, f.originalContent);
            }
            setOpenFiles((prev) =>
              prev.map((f) => ({ ...f, content: f.originalContent }))
            );
            setNotification({
              visible: true,
              message: "All changes discarded",
              type: "info",
            });
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  const handlePush = async (commitMessage: string, approvedPaths: string[]) => {
    if (!githubToken || !selectedRepo) throw new Error("GitHub not authenticated");

    const owner = selectedRepo.owner.login;
    const repo = selectedRepo.name;

    for (const file of openFiles) {
      if (approvedPaths.includes(file.path) && file.content !== file.originalContent) {
        const base64Code = base64Service.encode(file.content);
        const result = await githubService.updateFile(
          githubToken,
          owner,
          repo,
          file.path,
          base64Code,
          commitMessage,
          file.sha,
        );
        setOpenFiles((prev) =>
          prev.map((f) =>
            f.path === file.path
              ? { ...f, originalContent: file.content, sha: result.sha }
              : f
          )
        );
      }
    }

    setNotification({
      visible: true,
      message: "Pushed successfully to GitHub.",
      type: "success",
    });
  };

  const handleDiscard = (paths: string[]) => {
    if (!selectedRepo) return;
    for (const path of paths) {
      const file = openFiles.find((f) => f.path === path);
      if (file) {
        writeLocalFile(selectedRepo.name, path, file.originalContent)
          .then(() => {
            updateOpenFileContent(path, file.originalContent);
          })
          .catch((e) => console.error(e));
      }
    }
    setIsCommitSheetOpen(false);
  };

  const modifiedFiles = openFiles.filter((f) => f.content !== f.originalContent);
  const hasDiff = modifiedFiles.length > 0;

  console.log(`[ChatScreen] openFiles=${openFiles.length}, modified=${modifiedFiles.length}`, modifiedFiles.map((f) => f.path), openFiles.map((f) => ({ p: f.path, cLen: f.content?.length, oLen: f.originalContent?.length, eq: f.content === f.originalContent })));

  return (
    <View style={styles.safe} {...panResponder.panHandlers}>
      <CliNotification
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onHide={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />
      <Animated.View
        style={[
          styles.flex1,
          {
            zIndex: 10,
            transform: [
              {
                translateX: Animated.add(
                  slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, DRAWER_WIDTH],
                  }),
                  settingsSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -DRAWER_WIDTH],
                  })
                ),
              },
            ],
            borderTopLeftRadius: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 28] }),
            borderTopRightRadius: settingsSlideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 28] }),
          },
        ]}
      >
        <SharedHeader
          title={selectedRepo ? selectedRepo.name.toUpperCase() : "ELCOM_CLI"}
          variant="floating"
          leftAction={{ icon: <Menu size={20} color={COLORS.primary} />, onPress: toggleDrawer }}
          rightActions={[
            { icon: <Settings size={18} color={COLORS.primary} />, onPress: toggleSettings },
            ...(hasDiff ? [{ icon: <GitBranch size={16} color={COLORS.success} />, onPress: () => setIsCommitSheetOpen(true), badge: modifiedFiles.length, borderColor: COLORS.success }] : []),
          ]}
        />

        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === "ios" && !isDrawerOpen && !isSettingsOpen ? "padding" : undefined}
        >
          <View style={styles.chatPane}>
            <FlatList
              ref={flatListRef}
              data={[...messages].reverse().filter(m => !m.content.startsWith("[SYSTEM:") && !(m.role === "assistant" && !m.content.trim() && !m.reasoning))}
              inverted
              showsVerticalScrollIndicator={false}
              keyExtractor={(item, index) => item.id || index.toString()}
              contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 20, paddingBottom: 100 }]}
              ListFooterComponent={messages.length > 0 ? <HistoryLoader isLoadingMore={isLoadingMore} /> : null}
              renderItem={({ item }) => {
                const allModels = [...modelPresets, ...customModels];
                const currentMessageModel = allModels.find((m) => m.id === item.modelId);
                return (
                  <MessageBubble
                    message={item}
                    userName={settings.user_name}
                    modelName={item.role === "assistant" ? currentMessageModel?.name || "AI" : undefined}
                  />
                );
              }}
              ListHeaderComponent={
                <StatusArea isLoading={isLoading} isLoadingMore={isLoadingMore} error={error} />
              }
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
            />
            <EmptyState isVisible={messages.length === 0 && !isLoading} />

            <View style={styles.floatingInput}>
              <TerminalInput
                onSend={handleSend}
                onStop={stopStreaming}
                onCommand={async (cmd, args) => {
                  if (cmd === "search") {
                    const query = args.join(" ");
                    if (query) sendMessage(query, undefined, true);
                  } else if (cmd === "ide") {
                    onCommand(cmd, args);
                  } else if (cmd === "commit" || cmd === "push") {
                    if (modifiedFiles.length > 0) {
                      setIsCommitSheetOpen(true);
                    } else {
                      const scanned = await scanLocalChanges();
                      if (scanned > 0) {
                        setIsCommitSheetOpen(true);
                      } else {
                        Alert.alert("No Changes", "No modified files found. Ask the AI to edit a file first.");
                      }
                    }
                  } else if (cmd === "provider" && args[0]) {
                    onCommand(cmd, args);
                  } else onCommand(cmd, args);
                }}
                customModels={customModels}
                modelPresets={modelPresets}
                settings={settings}
                language={settings.language}
                disabled={isLoading}
                onLayoutY={setInputTopY}
                modifiedCount={modifiedFiles.length}
                activeConnection={activeConnection}
              />
              <WalkingCharacter isLoading={isLoading} inputTopY={inputTopY} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-DRAWER_WIDTH, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={isDrawerOpen ? "auto" : "none"}
      >
        <GithubDrawer
          onClose={toggleDrawer}
          onSelectFile={(path) => {
            console.log(`[IDEDrawer] selected file: ${path}`);
          }}
          openFiles={openFiles}
          language={settings.language || "ar"}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.settingsDrawer,
          {
            width: DRAWER_WIDTH,
            transform: [
              {
                translateX: settingsSlideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [DRAWER_WIDTH, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={isSettingsOpen ? "auto" : "none"}
      >
        <SettingsDrawer
          settings={settings}
          customModels={customModels}
          modelPresets={modelPresets}
          openRouterModels={openRouterModels}
          openCodeModels={openCodeModels}
          modelsLoading={modelsLoading}
          modelsError={modelsError}
          onSave={async (newSettings) => {
            if (updateMultipleSettings) {
              await updateMultipleSettings(newSettings);
            } else {
              for (const [key, value] of Object.entries(newSettings)) {
                if (value !== undefined && value !== null) {
                  await database.updateSetting(db, key as any, value);
                }
              }
            }
          }}
          onAddCustomModel={async (id, name) => {
            await database.addCustomModel(db, id, name);
          }}
          onRemoveCustomModel={async (id) => {
            await database.deleteCustomModel(db, id);
          }}
          onRenameCustomModel={async (id, name) => {
            await database.updateCustomModelName(db, id, name);
          }}
          onBack={toggleSettings}
          onRetryModels={onRetryModels}
        />
      </Animated.View>

      <CommitSheet
        visible={isCommitSheetOpen}
        onClose={() => setIsCommitSheetOpen(false)}
        files={modifiedFiles}
        onPush={handlePush}
        onDiscard={handleDiscard}
        apiKey={settings.opencode_api_key || settings.api_key || ""}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex1: { flex: 1 },
  listContent: { padding: 16, flexGrow: 1 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.5)" },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: COLORS.surface,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
    zIndex: 1,
  },


  fullScreenEditor: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  chatPane: {
    flex: 1,
    position: "relative",
  },
  floatingInput: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  diffActionBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  diffActionText: {
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.tiny,
  },
  diffActionTextAccept: {
    color: COLORS.success,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.tiny,
  },
  diffActionTextDiscard: {
    color: COLORS.error,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.tiny,
  },
  diffFilesList: {
    marginTop: 6,
  },
  diffFilePath: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.tiny,
    marginRight: 12,
  },
  settingsDrawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    overflow: "hidden",
    zIndex: 1,
  },
});
