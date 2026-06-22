import { View, Text, Pressable, StyleSheet, Image, Animated } from "react-native";
import { Message } from "../types/chat";
import { useState, useEffect, useRef, useMemo } from "react";
import * as Clipboard from "expo-clipboard";
import { Copy, Check } from "lucide-react-native";
import { COLORS, FONTS, FONT_SIZES } from "../constants/theme";
import { MarkdownView } from "./MarkdownView";
import { parseToolCalls, ToolCallCard, FileContentCard, ToolResultCard, parseToolCallActions, ToolCallActionCard } from "./ToolCallCard";

interface MessageBubbleProps {
  message: Message;
  userName?: string;
  modelName?: string;
  onEditCode?: (code: string, language?: string) => void;
}

const isArabic = (text: string) => {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
  return arabicPattern.test(text.slice(0, 50));
};

export const MessageBubble = ({
  message,
  userName,
  modelName,
  onEditCode,
}: MessageBubbleProps) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isThinkingActive, setIsThinkingActive] = useState(false);

  const timerRef = useRef<any>(null);
  const lastReasoningLen = useRef(0);
  const skeletonOpacity = useRef(new Animated.Value(0.3)).current;

  // Check if this is a file content message
  const isFileContent = message.role === "user" && message.content.startsWith("[FILE_CONTENT:");

  // Check if this is a tool result message
  const isToolResult = message.role === "user" && message.content.startsWith("[TOOL_RESULT:");
  const toolResultName = isToolResult
    ? message.content.match(/\[TOOL_RESULT:\s*(\w*)\]/)?.[1]?.trim() || ""
    : "";
  const toolResultContent = isToolResult
    ? message.content.replace(/\[TOOL_RESULT:\s*\w*\]\n?/, "").trim()
    : "";

  // Check if this is a tool action message (assistant describing a tool call)
  const isToolAction = message.role === "assistant" && message.content.startsWith("[TOOL_CALL:");
  const toolActions = useMemo(() => {
    if (isToolAction) return parseToolCallActions(message.content);
    return [];
  }, [message.content, isToolAction]);

  const { text: cleanContent, calls: toolCalls } = useMemo(() => {
    if (isFileContent || isToolResult || isToolAction) return { text: "", calls: [] };
    return parseToolCalls(message.content);
  }, [message.content, isFileContent, isToolResult, isToolAction]);

  const fileContentPath = isFileContent
    ? message.content.match(/\[FILE_CONTENT:\s*([^\]]*)\]/)?.[1]?.trim() || ""
    : "";
  
  const isAssistant = message.role === "assistant";
  const rtl = isArabic(cleanContent || message.content);

  const displayUser = userName || "USER";
  const displayAI = modelName || "AI";

  const prefix = isAssistant
    ? `${displayAI.toUpperCase().slice(0, 12)} > `
    : `${displayUser.toUpperCase().slice(0, 12)} > `;
  const prefixColor = isAssistant ? COLORS.success : COLORS.primary;
  const borderColor = isAssistant ? COLORS.success : COLORS.primary;

  useEffect(() => {
    if (isAssistant && message.reasoning && message.reasoning.trim().length > 0) {
      const currentLen = message.reasoning.length;
      if (currentLen > lastReasoningLen.current) {
        lastReasoningLen.current = currentLen;
        
        // Start live timer if thinking is active and no main content is generated yet
        if (!isThinkingActive && (!message.content || message.content.trim().length === 0)) {
          setIsThinkingActive(true);
          setShowReasoning(true); // Automatically expand the reasoning view while thinking!
          
          const start = Date.now();
          timerRef.current = setInterval(() => {
            setElapsed(parseFloat(((Date.now() - start) / 1000).toFixed(1)));
          }, 100);
        }
      }
    }
    
    // When main content starts loading or is complete, shut off the active thinking state
    if (message.content && message.content.trim().length > 0) {
      if (isThinkingActive) {
        setIsThinkingActive(false);
        setShowReasoning(false); // Automatically collapse after finishing thought to keep view clean!
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [message.reasoning, message.content, isAssistant, isThinkingActive]);

  useEffect(() => {
    let anim: any = null;
    if (isThinkingActive) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(skeletonOpacity, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
    } else {
      skeletonOpacity.setValue(1);
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [isThinkingActive]);

  const handleCopyAll = async () => {
    await Clipboard.setStringAsync(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isToolResult) {
    return <ToolResultCard toolName={toolResultName} result={toolResultContent} />;
  }

  if (isToolAction) {
    return (
      <View style={styles.toolActionsWrap}>
        {toolActions.map((action, idx) => (
          <ToolCallActionCard key={idx} action={action} />
        ))}
      </View>
    );
  }

  if (isFileContent) {
    return <FileContentCard path={fileContentPath} />;
  }

  return (
    <View
      style={[
        styles.container,
        {
          borderLeftColor: borderColor,
          borderRightColor: borderColor,
        },
        rtl && styles.rtlContainer,
      ]}
    >
      <View style={[styles.prefixRow, rtl && styles.rtlRow]}>
        <Text style={[styles.prefix, { color: prefixColor }]}>{prefix}</Text>
      </View>

      <View style={styles.contentWrap}>
        {message.attachment && message.attachment.uri && (
          <View style={styles.attachmentBox}>
            <Image
              source={{ uri: message.attachment.uri }}
              style={styles.attachedImage}
              resizeMode="contain"
            />
          </View>
        )}
        <MarkdownView
          content={cleanContent}
          onEditCode={onEditCode}
        />

        {toolCalls.length > 0 && (
          <View style={styles.toolCallsWrap}>
            {toolCalls.map((call, idx) => (
              <ToolCallCard key={idx} call={call} />
            ))}
          </View>
        )}

        {isAssistant && (cleanContent.length > 0 || toolCalls.length > 0) && (
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleCopyAll}
              style={styles.copyAction}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {copied ? (
                <Check size={14} color={COLORS.success} />
              ) : (
                <Copy size={14} color={COLORS.primaryDim} />
              )}
              <Text
                style={[
                  styles.actionText,
                  { color: copied ? COLORS.success : COLORS.primaryDim },
                ]}
              >
                {copied ? "COPIED" : "COPY_ALL"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {message.reasoning && message.reasoning.trim().length > 0 && (
        <View style={styles.reasoningWrap}>
          <Pressable
            onPress={() => setShowReasoning((prev) => !prev)}
            style={[styles.reasoningToggle, rtl && styles.rtlRow]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <View style={styles.thoughtHeaderLeft}>
              <Text style={[
                styles.thoughtIndicator, 
                { color: isThinkingActive ? "#FFB000" : COLORS.success }
              ]}>
                {isThinkingActive ? "●" : "✔"}
              </Text>
              <Text style={styles.reasoningLabel}>
                {isThinkingActive 
                  ? `THINKING_PROCESS (${elapsed}s)...` 
                  : `THOUGHT_PROCESS (${elapsed > 0 ? elapsed + 's' : 'RESOLVED'})`}
              </Text>
            </View>
            <Text style={styles.toggleBtnText}>
              {showReasoning ? "[-] HIDE_LOG" : "[+] SHOW_LOG"}
            </Text>
          </Pressable>

          {showReasoning && (
            <View style={styles.reasoningBox}>
              <View style={styles.reasoningWindowHeader}>
                <View style={styles.windowDotRed} />
                <View style={styles.windowDotYellow} />
                <View style={styles.windowDotGreen} />
                <Text style={styles.windowTitle}>thought_subprocess.log</Text>
              </View>

              {isThinkingActive ? (
                /* Dynamic Pulsing Skeleton Screen Loader for Headers & Body */
                <View style={styles.skeletonContainer}>
                  <Animated.View style={[styles.skeletonLine, styles.skeletonHeader, { opacity: skeletonOpacity }]} />
                  <Animated.View style={[styles.skeletonLine, styles.skeletonBody1, { opacity: skeletonOpacity }]} />
                  <Animated.View style={[styles.skeletonLine, styles.skeletonBody2, { opacity: skeletonOpacity }]} />
                  <Animated.View style={[styles.skeletonLine, styles.skeletonBody3, { opacity: skeletonOpacity }]} />
                </View>
              ) : (
                /* Completed raw thought logs */
                message.reasoning.trim().length > 0 && (
                  <Text
                    selectable
                    style={[styles.reasoningText, rtl && styles.rtlText]}
                  >
                    {message.reasoning}
                  </Text>
                )
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    borderLeftWidth: 2,
    paddingVertical: 10,
    paddingLeft: 12,
  },
  rtlContainer: {
    paddingLeft: 0,
    paddingRight: 12,
    borderLeftWidth: 0,
    borderRightWidth: 2,
  },
  prefixRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  rtlRow: {
    flexDirection: "row-reverse",
  },
  prefix: {
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.label,
  },
  contentWrap: {
    flex: 1,
  },
  attachmentBox: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    overflow: "hidden",
    borderRadius: 4,
  },
  attachedImage: {
    width: "100%",
    height: 250,
  },
  reasoningWrap: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  toolCallsWrap: {
    marginTop: 8,
    gap: 6,
  },
  toolActionsWrap: {
    gap: 6,
  },
  reasoningToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Position label on left, toggle btn on right
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  thoughtHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  thoughtIndicator: {
    marginRight: 8,
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: FONTS.mono,
  },
  reasoningLabel: {
    color: COLORS.primaryDim,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.small,
  },
  toggleBtnText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.small,
  },
  reasoningWindowHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  windowDotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF5F56",
    marginRight: 4,
  },
  windowDotYellow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFBD2E",
    marginRight: 4,
  },
  windowDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#27C93F",
    marginRight: 10,
  },
  windowTitle: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: 10,
  },
  reasoningBox: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginTop: 6,
    overflow: "hidden",
  },
  reasoningText: {
    color: COLORS.success,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.small,
    lineHeight: 18,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
  },
  skeletonContainer: {
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  skeletonLine: {
    backgroundColor: "rgba(255, 255, 255, 0.08)", // Pulsing white/grey bar tint
    borderRadius: 4,
    marginVertical: 6,
  },
  skeletonHeader: {
    width: "45%",
    height: 12,
    backgroundColor: "rgba(0, 224, 163, 0.15)", // Mint green tint for active processing
  },
  skeletonBody1: {
    width: "85%",
    height: 10,
  },
  skeletonBody2: {
    width: "70%",
    height: 10,
  },
  skeletonBody3: {
    width: "55%",
    height: 10,
  },
  rtlText: {
    textAlign: "right",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingTop: 8,
  },
  copyAction: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  actionText: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.tiny,
    marginLeft: 6,
    letterSpacing: 1,
  },
});
