import { useRouter } from 'expo-router';
import { IDEDrawer } from '@/features/ide/IDEDrawer';
import { useIDEState } from '@/hooks/useIDEState';

export default function IDERoute() {
  const router = useRouter();
  const { openFiles } = useIDEState();
  return <IDEDrawer onClose={() => router.back()} onSelectFile={() => router.push('/ide/editor')} openFiles={openFiles} />;
}
