import { useRouter } from 'expo-router';
import { DiffViewerScreen } from '@/features/ide/DiffViewerScreen';

export default function DiffRoute() {
  const router = useRouter();
  return <DiffViewerScreen onBack={() => router.back()} />;
}
