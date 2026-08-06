import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSettings } from '@/hooks/useSettings';
import { COLORS } from '@/constants/theme';
import { useCallback, useState } from 'react';
import { IntroScreen } from '@/features/intro/IntroScreen';

export default function IndexRoute() {
  const { settings, isLoading } = useSettings();
  const [introFinished, setIntroFinished] = useState(false);
  const finishIntro = useCallback(() => setIntroFinished(true), []);

  if (!introFinished) return <IntroScreen ready={!isLoading} onFinished={finishIntro} />;

  if (isLoading) {
    return <View style={styles.loader} />;
  }

  return <Redirect href={settings.onboarding_completed ? '/(dashboard)/home' : '/(onboarding)'} />;
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
});
