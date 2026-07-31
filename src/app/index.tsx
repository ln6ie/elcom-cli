import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSettings } from '@/hooks/useSettings';
import { COLORS } from '@/constants/theme';

export default function IndexRoute() {
  const { settings, isLoading } = useSettings();

  if (isLoading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return <Redirect href={settings.api_key || settings.opencode_api_key ? '/chat' : '/setup'} />;
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
});
