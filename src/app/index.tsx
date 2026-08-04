import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSettings } from '@/hooks/useSettings';
import { COLORS } from '@/constants/theme';
import { ElcomLoader } from '@/components/ElcomLoader';

export default function IndexRoute() {
  const { settings, isLoading } = useSettings();

  if (isLoading) {
    return <View style={styles.loader}><ElcomLoader size="large" /></View>;
  }

  return <Redirect href={settings.onboarding_completed ? '/(dashboard)/home' : '/(onboarding)'} />;
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
});
