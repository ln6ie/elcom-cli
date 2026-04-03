import {
  View,
  FlatList,
  Text,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from '../components/MessageBubble';
import { TerminalInput } from '../components/TerminalInput';
import { ThinkingDots } from '../components/ThinkingDots';
import { StatusBar } from '../components/StatusBar';
import { useRef, useEffect } from 'react';
import { COLORS, FONTS } from '../constants/theme';

const WELCOME_BANNER = `
 _____ _     ____ ___  __  __ 
 | ____| |   / ___/ _ \\|  \\/  |
 |  _| | |  | |  | | | | |\\/| |
 | |___| |__| |__| |_| | |  | |
 |_____|_____\\____\\___/|_|  |_|
        CLI AI v1.0.0
`;

interface ChatScreenProps {
  onResetKey: () => void;
}

export const ChatScreen = ({ onResetKey }: ChatScreenProps) => {
  const { messages, isLoading, error, sendMessage, clearChat } = useChat();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isLoading]);

  const renderHeader = () => (
    <View style={styles.headerWrap}>
      <Text style={styles.bannerText}>{WELCOME_BANNER}</Text>
      <Text style={styles.readyText}>SYSTEM READY... [2026-04-03]</Text>
      <View style={styles.divider} />
      <Text style={styles.connectionText}>
        CONNECTION: OPENROUTER / SECURE_CHNL
      </Text>
      <View style={styles.divider} />
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      {isLoading && <ThinkingDots />}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>ERR: {error}</Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () =>
    messages.length === 0 && !isLoading ? (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>
          {'NO_MESSAGES_FOUND. START_QUERY? \u258B'}
        </Text>
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar onClear={clearChat} onResetKey={onResetKey} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => <MessageBubble message={item} />}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
        />

        <TerminalInput onSend={sendMessage} disabled={isLoading} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex1: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  headerWrap: {
    marginBottom: 32,
    alignItems: 'center',
    opacity: 0.4,
  },
  bannerText: {
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: 7,
    textAlign: 'center',
  },
  readyText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: 10,
    marginTop: 8,
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  connectionText: {
    color: COLORS.primary,
    fontFamily: FONTS.mono,
    fontSize: 10,
    textAlign: 'center',
  },
  footer: {
    height: 40,
    justifyContent: 'center',
  },
  errorBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
    backgroundColor: 'rgba(224, 74, 0, 0.1)',
    padding: 8,
  },
  errorText: {
    color: COLORS.error,
    fontFamily: FONTS.mono,
    fontSize: 11,
  },
  emptyWrap: {
    marginTop: 32,
  },
  emptyText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: 13,
  },
});
