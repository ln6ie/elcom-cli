import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useSQLiteContext } from 'expo-sqlite';
import { ChatScreen } from '@/features/chat/ChatScreen';
import { useSettings } from '@/hooks/useSettings';
import { database } from '@/services/database';
import { COLORS } from '@/constants/theme';
import { TRANSLATIONS } from '@/constants/translations';
import { ElcomLoader } from '@/components/ElcomLoader';

export default function ChatRoute() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { conversationId: requestedConversationId } = useLocalSearchParams<{ conversationId?: string }>();
  const { settings, customModels, modelPresets, openRouterModels, openCodeModels, modelsLoading, modelsError, refreshModels, updateSetting, updateMultipleSettings, isLoading } = useSettings();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const t = TRANSLATIONS[settings.language || 'ar'];

  useEffect(() => {
    if (isLoading) return;
    if (!settings.api_key && !settings.opencode_api_key) {
      router.replace('/setup');
      return;
    }
    let cancelled = false;
    (async () => {
      const history = await database.getAllConversations(db);
      if (cancelled) return;
      if (requestedConversationId) setConversationId(requestedConversationId);
      else if (history.length > 0) setConversationId((history[0] as { id: string }).id);
      else {
        const id = Crypto.randomUUID();
        await database.createConversation(db, id, 'INITIAL_SESSION', settings.selected_model);
        if (!cancelled) setConversationId(id);
      }
    })();
    return () => { cancelled = true; };
  }, [db, isLoading, requestedConversationId, settings.api_key, settings.opencode_api_key, settings.selected_model, router]);

  const handleCommand = useCallback(async (cmd: string, args: string[]) => {
    switch (cmd) {
      case 'chat':
      case 'new': {
        const id = Crypto.randomUUID();
        await database.createConversation(db, id, 'NEW_SESSION', settings.selected_model);
        setConversationId(id);
        break;
      }
      case 'history': router.push('/history'); break;
      case 'settings': router.push('/settings'); break;
      case 'ide': router.push('/ide'); break;
      case 'exit': router.replace('/chat'); break;
      case 'model':
        if (args[0]) { await updateSetting('selected_model', args[0]); Alert.alert('SYSTEM', `${t.model_changed}${args[0]}`); }
        break;
      case 'provider':
        if (args[0]) await updateSetting('ai_provider', args[0] as 'openrouter' | 'opencode');
        break;
      case 'clear':
        if (conversationId) await db.runAsync('DELETE FROM messages WHERE conversation_id = ?', [conversationId]);
        break;
      default: Alert.alert(t.sys_error, `${t.unknown_command}${cmd}`);
    }
  }, [conversationId, db, router, settings.selected_model, t, updateSetting]);

  if (isLoading || !conversationId) return <View style={styles.loader}><ElcomLoader size="large" /></View>;
  return <ChatScreen conversationId={conversationId} settings={settings} customModels={customModels} modelPresets={modelPresets} openRouterModels={openRouterModels} openCodeModels={openCodeModels} modelsLoading={modelsLoading} modelsError={modelsError} onRetryModels={refreshModels} onCommand={handleCommand} updateMultipleSettings={updateMultipleSettings} />;
}

const styles = StyleSheet.create({ loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background } });
