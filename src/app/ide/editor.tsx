import { useRouter } from 'expo-router';
import { EditorScreen } from '@/features/ide/EditorScreen';

export default function EditorRoute() {
  const router = useRouter();
  return <EditorScreen onBack={() => router.back()} onOpenChat={() => router.replace('/chat')} onOpenDiff={() => router.push('/ide/diff')} />;
}
