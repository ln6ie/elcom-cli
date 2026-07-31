import { useRouter } from 'expo-router';
import { HistoryScreen } from '@/features/history/HistoryScreen';
import { useSQLiteContext } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { database } from '@/services/database';
import { useSettings } from '@/hooks/useSettings';

export default function HistoryRoute() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { settings } = useSettings();
  return <HistoryScreen onSelect={(id) => router.dismissTo({ pathname: '/chat', params: { conversationId: id } })} onBack={() => router.back()} onNew={async () => {
    const id = Crypto.randomUUID();
    await database.createConversation(db, id, 'NEW_SESSION', settings.selected_model);
    router.replace('/chat');
  }} />;
}
