import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Message } from '../types/chat';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Copy, Check } from 'lucide-react-native';
import { COLORS, FONTS } from '../constants/theme';
import { MarkdownView } from './MarkdownView';

interface MessageBubbleProps {
  message: Message;
  userName?: string;
  modelName?: string;
}

const isArabic = (text: string) => {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
  return arabicPattern.test(text.slice(0, 50));
};

export const MessageBubble = ({ message, userName, modelName }: MessageBubbleProps) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';
  const rtl = isArabic(message.content);

  const displayUser = userName || 'USER';
  const displayAI = modelName || 'AI';
  
  const prefix = isAssistant ? `${displayAI.toUpperCase().slice(0, 12)} > ` : `${displayUser.toUpperCase().slice(0, 12)} > `;
  const prefixColor = isAssistant ? COLORS.success : COLORS.primary;
  const borderColor = isAssistant ? COLORS.success : COLORS.primary;

  const handleCopyAll = async () => {
    await Clipboard.setStringAsync(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              resizeMode="contain"
            />
          </View>
        )}
        <MarkdownView content={message.content} />
        
        {isAssistant && message.content.length > 0 && (
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
              <Text style={[styles.actionText, { color: copied ? COLORS.success : COLORS.primaryDim }]}>
                {copied ? 'COPIED' : 'COPY_ALL'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {message.reasoning && message.reasoning.trim().length > 0 && (
        <View style={styles.reasoningWrap}>
          <Pressable
            onPress={() => setShowReasoning(prev => !prev)}
            style={[styles.reasoningToggle, rtl && styles.rtlRow]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.reasoningLabel}>
              {showReasoning ? '[-] HIDE_REASONING' : '[+] SHOW_REASONING'}
            </Text>
          </Pressable>

          {showReasoning && (
            <View style={styles.reasoningBox}>
              <Text selectable style={[styles.reasoningText, rtl && styles.rtlText]}>
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: 4,
  },
  attachedImage: {
    width: '100%',
    height: 250,
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
  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 8,
  },
  copyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  actionText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    marginLeft: 6,
    letterSpacing: 1,
  },
});
