import {
  View,
  FlatList,
  Text,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TypewriterText } from '../components/TypewriterText';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from '../components/MessageBubble';
import { TerminalInput } from '../components/TerminalInput';
import { ThinkingDots } from '../components/ThinkingDots';
import { StatusBar } from '../components/StatusBar';
import { CliNotification } from '../components/CliNotification';
import { WalkingCharacter } from '../components/WalkingCharacter';
import { useRef, useEffect, useState } from 'react';
import { COLORS, FONTS } from '../constants/theme';
import { MODEL_PRESETS } from '../constants/models';
import { AppBrand } from '../components/AppBrand';

interface ChatScreenProps {
  conversationId: string;
  userName: string;
  customModels: { id: string; name: string }[];
  onCommand: (cmd: string, args: string[]) => void;
}

export const ChatScreen = ({ conversationId, userName, customModels, onCommand }: ChatScreenProps) => {
  const { 
    messages, 
    conversationTitle,
    modelId,
    isLoading, 
    isLoadingMore, 
    hasMore, 
    error, 
    sendMessage, 
    stopStreaming,
    loadMore 
  } = useChat(conversationId);

  const [inputTopY, setInputTopY] = useState(0);
  const [notification, setNotification] = useState<{ visible: boolean; message: string | string[]; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info'
  });
  const flatListRef = useRef<FlatList>(null);
  const isAtBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const contentHeightRef = useRef(0);

  useEffect(() => {
    setNotification({
      visible: true,
      message: [`BOOTING_SESSION: ${conversationId.slice(0, 8)}`, 'STATUS: SYSTEM_READY_SECURE'],
      type: 'success'
    });
  }, [conversationId]);

  useEffect(() => {
    if (error) {
      setNotification({
        visible: true,
        message: `FATAL_ERROR: ${error}`,
        type: 'error'
      });
    }
  }, [error]);

  useEffect(() => {
    // Scroll to bottom only on session change
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, 100);
  }, [conversationId]);

  useEffect(() => {
    // Auto-scroll only when: new message arrived + user is at bottom + NOT currently streaming
    // During streaming (isLoading=true), screen stays frozen so user can read the thinking card
    const newCount = messages.length;
    const prevCount = prevMessageCountRef.current;
    if (newCount > prevCount && isAtBottomRef.current && !isLoading) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
    prevMessageCountRef.current = newCount;
  }, [messages.length, isLoading]);

  const renderHistoryLoader = () => (
    <View style={styles.historyLoader}>
      {isLoadingMore && (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={COLORS.primaryDim} />
          <Text style={styles.loadingMoreText}>FETCHING_HISTORY...</Text>
        </View>
      )}
      <View style={styles.headerWrap}>
        <AppBrand fontSize={7} style={{ marginBottom: 16 }} />
        <Text style={styles.readyText}>SYSTEM READY... [2026-04-03]</Text>
        <View style={styles.divider} />
        <Text style={styles.connectionText}>
          CONNECTION: OPENROUTER / SECURE_CHNL
        </Text>
        <View style={styles.divider} />
      </View>
    </View>
  );

  const renderStatusArea = () => (
    <View style={styles.statusArea}>
      {isLoading && !isLoadingMore && <ThinkingDots />}
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
        <TypewriterText 
          phrases={[
            'WELCOME',
            ' Elcom CLI',
            '// جاري تهيئة الاتصال الآمن...',
            '// تم التعرف على الهوية',
            '// سجل المحادثات فارغ حالياً.',
            '// أدخل استفسارك الأول لبدء الجلسة...'
          ]} 
          style={styles.emptyText}
          speed={40}
          deleteSpeed={30}
          pause={1200}
        />
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <CliNotification 
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onHide={() => setNotification(prev => ({ ...prev, visible: false }))}
      />
      
      <StatusBar 
        title={conversationTitle} 
        subtitle={`SID: ${conversationId.slice(0, 8)}`}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          inverted
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={renderHistoryLoader}
          renderItem={({ item }) => {
            const allModels = [...MODEL_PRESETS, ...customModels];
            const currentMessageModel = allModels.find(m => m.id === item.modelId);
            return (
              <MessageBubble 
                message={item} 
                userName={userName}
                modelName={item.role === 'assistant' ? (currentMessageModel?.name || 'AI') : undefined} 
              />
            );
          }}
          ListHeaderComponent={renderStatusArea}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          removeClippedSubviews={Platform.OS === 'android'}
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
              // In inverted list: content grows at the bottom (index 0).
              // Compensate offset so the visible area stays frozen.
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

        {renderEmpty()}

        <TerminalInput 
          onSend={sendMessage} 
          onStop={stopStreaming}
          onCommand={(cmd, args) => {
            if (cmd === 'search') {
              const query = args.join(' ');
              if (query) {
                sendMessage(query, undefined, true);
              }
            } else {
              onCommand(cmd, args);
            }
          }}
          customModels={customModels}
          disabled={isLoading} 
          onLayoutY={setInputTopY}
        />
        <WalkingCharacter isLoading={isLoading} inputTopY={inputTopY} />
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
  statusArea: {
    minHeight: 20,
    justifyContent: 'center',
    paddingBottom: 8,
  },
  historyLoader: {
    paddingTop: 16,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: 13,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadingMoreText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: 10,
    marginLeft: 8,
    letterSpacing: 1,
  },
});
