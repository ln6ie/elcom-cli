import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChat } from "../hooks/useChat";
import { MessageBubble } from "../components/MessageBubble";
import { TerminalInput } from "../components/TerminalInput";
import { StatusBar } from "../components/StatusBar";
import { CliNotification } from "../components/CliNotification";
import { WalkingCharacter } from "../components/WalkingCharacter";
import { useRef, useEffect, useState } from "react";
import { COLORS } from "../constants/theme";
import { DatabaseSettings } from "../services/database";

import { HistoryLoader } from "../components/chat/HistoryLoader";
import { StatusArea } from "../components/chat/StatusArea";
import { EmptyState } from "../components/chat/EmptyState";

interface ChatScreenProps {
  conversationId: string;
  settings: DatabaseSettings;
  customModels: { id: string; name: string }[];
  modelPresets: { id: string; name: string }[];
  onCommand: (cmd: string, args: string[]) => void;
}

export const ChatScreen = ({
  conversationId,
  settings,
  customModels,
  modelPresets,
  onCommand,
}: ChatScreenProps) => {
  const {
    messages,
    conversationTitle,
    isLoading,
    isLoadingMore,
    error,
    sendMessage,
    stopStreaming,
    loadMore,
  } = useChat(conversationId, settings);

  const [inputTopY, setInputTopY] = useState(0);
  const [notification, setNotification] = useState<{
    visible: boolean;
    message: string | string[];
    type: "success" | "error" | "info";
  }>({
    visible: false,
    message: "",
    type: "info",
  });

  const flatListRef = useRef<FlatList>(null);
  const isAtBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const contentHeightRef = useRef(0);

  useEffect(() => {
    setNotification({
      visible: true,
      message: [
        `BOOTING_SESSION: ${conversationId.slice(0, 8)}`,
        "STATUS: SYSTEM_READY_SECURE",
      ],
      type: "success",
    });
  }, [conversationId]);

  useEffect(() => {
    if (error) {
      setNotification({
        visible: true,
        message: `FATAL_ERROR: ${error}`,
        type: "error",
      });
    }
  }, [error]);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, 100);
  }, [conversationId]);

  useEffect(() => {
    const newCount = messages.length;
    const prevCount = prevMessageCountRef.current;
    if (newCount > prevCount && isAtBottomRef.current && !isLoading) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
    prevMessageCountRef.current = newCount;
  }, [messages.length, isLoading]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <CliNotification
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onHide={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />

      <StatusBar
        title={conversationTitle}
        subtitle={`SID: ${conversationId.slice(0, 8)}`}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex1}
      >
        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          inverted
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={<HistoryLoader isLoadingMore={isLoadingMore} />}
          renderItem={({ item }) => {
            const allModels = [...modelPresets, ...customModels];
            const currentMessageModel = allModels.find(
              (m) => m.id === item.modelId,
            );
            return (
              <MessageBubble
                message={item}
                userName={settings.user_name}
                modelName={
                  item.role === "assistant"
                    ? currentMessageModel?.name || "AI"
                    : undefined
                }
              />
            );
          }}
          ListHeaderComponent={
            <StatusArea
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              error={error}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          removeClippedSubviews={Platform.OS === "android"}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
          onScroll={(e) => {
            const y = e.nativeEvent.contentOffset.y;
            scrollOffsetRef.current = y;
            isAtBottomRef.current = y < 60;
          }}
          scrollEventThrottle={150}
          onContentSizeChange={(_w, h) => {
            if (isLoading && contentHeightRef.current > 0) {
              const diff = h - contentHeightRef.current;
              if (diff > 0 && !isAtBottomRef.current) {
                flatListRef.current?.scrollToOffset({
                  offset: scrollOffsetRef.current + diff,
                  animated: false,
                });
              }
            }
            contentHeightRef.current = h;
          }}
        />

        <EmptyState isVisible={messages.length === 0 && !isLoading} />

        <TerminalInput
          onSend={sendMessage}
          onStop={stopStreaming}
          onCommand={(cmd, args) => {
            if (cmd === "search") {
              const query = args.join(" ");
              if (query) sendMessage(query, undefined, true);
            } else onCommand(cmd, args);
          }}
          customModels={customModels}
          modelPresets={modelPresets}
          disabled={isLoading}
          onLayoutY={setInputTopY}
        />
        <WalkingCharacter isLoading={isLoading} inputTopY={inputTopY} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex1: { flex: 1 },
  listContent: { padding: 16, flexGrow: 1 },
});
