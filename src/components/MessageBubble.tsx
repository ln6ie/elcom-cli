import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Message } from '../types/chat';
import { useState, useMemo } from 'react';
import { COLORS, FONTS } from '../constants/theme';

interface MessageBubbleProps {
  message: Message;
}

interface ContentPart {
  type: 'text' | 'code';
  content: string;
  lang?: string;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const isUser = message.role === 'user';

  const borderColor = isUser ? COLORS.primary : COLORS.success;
  const prefix = isUser ? 'USER > ' : 'AI   > ';
  const prefixColor = isUser ? COLORS.primary : COLORS.success;

  const parts = useMemo<ContentPart[]>(() => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const items: ContentPart[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(message.content)) !== null) {
      if (match.index > lastIndex) {
        items.push({
          type: 'text',
          content: message.content.slice(lastIndex, match.index),
        });
      }
      items.push({
        type: 'code',
        lang: match[1] || 'CODE',
        content: match[2].trim(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < message.content.length) {
      items.push({
        type: 'text',
        content: message.content.slice(lastIndex),
      });
    }

    return items;
  }, [message.content]);

  return (
    <View style={[styles.container, { borderLeftColor: borderColor }]}>
      <View style={styles.prefixRow}>
        <Text style={[styles.prefix, { color: prefixColor }]}>
          {prefix}
        </Text>
      </View>

      {parts.map((part, i) => (
        <View key={i} style={styles.partWrap}>
          {part.type === 'text' ? (
            <Text style={styles.textContent}>{part.content.trim()}</Text>
          ) : (
            <View style={styles.codeBlock}>
              {part.lang && (
                <Text style={styles.codeLang}>[{part.lang}]</Text>
              )}
              <Text style={styles.codeContent}>{part.content}</Text>
            </View>
          )}
        </View>
      ))}

      {message.reasoning && (
        <View style={styles.reasoningWrap}>
          <TouchableOpacity
            onPress={() => setShowReasoning(!showReasoning)}
            style={styles.reasoningToggle}
          >
            <Text style={styles.reasoningLabel}>
              {showReasoning ? '[-] HIDE_REASONING' : '[+] SHOW_REASONING'}
            </Text>
          </TouchableOpacity>

          {showReasoning && (
            <View style={styles.reasoningBox}>
              <Text style={styles.reasoningText}>{message.reasoning}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderLeftWidth: 2,
    paddingVertical: 8,
    paddingLeft: 12,
  },
  prefixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  prefix: {
    fontFamily: FONTS.monoBold,
    fontSize: 13,
  },
  partWrap: {
    marginBottom: 8,
  },
  textContent: {
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: 13,
    lineHeight: 20,
  },
  codeBlock: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    overflow: 'hidden',
  },
  codeLang: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: 9,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  codeContent: {
    color: COLORS.primary,
    fontFamily: FONTS.mono,
    fontSize: 11,
  },
  reasoningWrap: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  reasoningToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasoningLabel: {
    color: COLORS.primaryDim,
    fontFamily: FONTS.mono,
    fontSize: 11,
  },
  reasoningBox: {
    marginTop: 8,
    backgroundColor: COLORS.surface,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reasoningText: {
    color: COLORS.success,
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontStyle: 'italic',
    opacity: 0.7,
  },
});
