import { Stack } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, I18nManager } from 'react-native';
import { useFonts, SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { IDEProvider } from '@/hooks/useIDEState';
import { initDb } from '@/services/database';
import { COLORS } from '@/constants/theme';
import '@/services/i18n';
import 'react-native-get-random-values';
import { UpdateModal } from '@/components/UpdateModal';
import { UpdateInfo, UpdateService } from '@/services/UpdateService';

I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ SpaceMono_400Regular, SpaceMono_700Bold });
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>();
  const [updateVisible, setUpdateVisible] = useState(false);
  const [isForceUpdate, setIsForceUpdate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const result = await UpdateService.checkUpdate();
      if (result.info && (result.status === 'UPDATE_AVAILABLE' || result.status === 'FORCE_UPDATE_REQUIRED')) {
        setUpdateInfo(result.info);
        setIsForceUpdate(result.status === 'FORCE_UPDATE_REQUIRED');
        setUpdateVisible(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="elcomcli.db" onInit={initDb}>
        <IDEProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }} />
          <UpdateModal visible={updateVisible} info={updateInfo} isForce={isForceUpdate} onClose={() => setUpdateVisible(false)} />
        </IDEProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
});
