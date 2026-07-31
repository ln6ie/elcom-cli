import { useRouter } from 'expo-router';
import { SetupScreen, SetupProvider } from '@/features/auth/SetupScreen';
import { useSettings } from '@/hooks/useSettings';

export default function SetupRoute() {
  const router = useRouter();
  const { updateMultipleSettings } = useSettings();

  return (
    <SetupScreen
      onConnect={async (key: string, language: 'ar' | 'en', provider: SetupProvider) => {
        await updateMultipleSettings(provider === 'opencode'
          ? { opencode_api_key: key, language, ai_provider: 'opencode' }
          : { api_key: key, language, ai_provider: 'openrouter' });
        router.replace('/chat');
      }}
    />
  );
}
