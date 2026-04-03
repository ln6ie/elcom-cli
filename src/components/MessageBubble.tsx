import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Message } from '../types/chat';
import { useState } from 'react';
import { COLORS, FONTS } from '../constants/theme';
import { MarkdownView } from './MarkdownView';

interface MessageBubbleProps {
  message: Message;
}

const isArabic = (text: string) => {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
  return arabicPattern.test(text.slice(0, 50));
};

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const isAssistant = message.role === 'assistant';
  const rtl = isArabic(message.content);

  const prefix = isAssistant ? 'AI   > ' : 'USER > ';
  const prefixColor = isAssistant ? COLORS.success : COLORS.primary;
  const borderColor = isAssistant ? COLORS.success : COLORS.primary;

  return (
    <View style={[
      styles.container, 
      { 
        borderLeftColor: borderColor, 
        borderRightColor: borderColor 
      },
      rtl && styles.rtlContainer
    ]}>
      <View style={[styles.prefixRow, rtl && styles.rtlRow]}>
        <Text style={[styles.prefix, { color: prefixColor }]}>
          {prefix}
        </Text>
      </View>

      <View style={styles.contentWrap}>
        {message.attachment && message.attachment.uri && (
          <View style={styles.attachmentBox}>
            <Image 
              source={{ uri: message.attachment.uri }} 
              style={styles.attachedImage} 
              resizeMode="cover"
            />
          </View>
        )}
        <MarkdownView content={message.content} />
      </View>

      {message.reasoning && (
        <View style={styles.reasoningWrap}>
          <TouchableOpacity
            onPress={() => setShowReasoning(!showReasoning)}
            style={[styles.reasoningToggle, rtl && styles.rtlRow]}
          >
            <Text style={styles.reasoningLabel}>
              {showReasoning ? '[-] HIDE_REASONING' : '[+] SHOW_REASONING'}
            </Text>
          </TouchableOpacity>

          {showReasoning && (
            <View style={styles.reasoningBox}>
              <Text style={[styles.reasoningText, rtl && styles.rtlText]}>
                {message.reasoning}
              </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  prefix: {
    fontFamily: FONTS.monoBold,
    fontSize: 13,
  },
  contentWrap: {
    flex: 1,
  },
  attachmentBox: {
    width: '100%',
    maxHeight: 250,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  attachedImage: {
    width: '100%',
    height: 180,
  },
  reasoningWrap: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
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
    marginTop: 10,
    backgroundColor: COLORS.surface,
    padding: 10,
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
  rtlText: {
    textAlign: 'right',
  },
});
