import { Stack } from 'expo-router';
import { View, StyleSheet, I18nManager, AppState, Platform } from 'react-native';
import { useFonts, SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { IDEProvider } from '@/hooks/useIDEState';
import { initDb } from '@/services/database';
import { COLORS } from '@/constants/theme';
import * as SplashScreen from 'expo-splash-screen';
import '@/services/i18n';
import 'react-native-get-random-values';
import { UpdateModal } from '@/components/UpdateModal';
import { UpdateInfo, UpdateService } from '@/services/UpdateService';
import { QueryClient, QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ SpaceMono_400Regular, SpaceMono_700Bold });
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>();
  const [updateVisible, setUpdateVisible] = useState(false);
  const [isForceUpdate, setIsForceUpdate] = useState(false);

  useEffect(() => {
    if (!fontsLoaded) return;
    void SplashScreen.hideAsync().catch(() => undefined);
    return undefined;
  }, [fontsLoaded]);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (Platform.OS !== 'web') focusManager.setFocused(state === 'active');
    });
    const netInfoSubscription = NetInfo.addEventListener(state => onlineManager.setOnline(Boolean(state.isConnected)));
    return () => { appStateSubscription.remove(); netInfoSubscription(); };
  }, []);

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

  if (!fontsLoaded) return <View style={styles.loader} />;

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaProvider>
        <SQLiteProvider databaseName="elcomcli.db" onInit={initDb}>
          <QueryClientProvider client={queryClient}>
            <IDEProvider>
              <BottomSheetModalProvider>
                <View style={styles.appLayer}>
                  <StatusBar style="light" />
                  <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }} />
                  <UpdateModal visible={updateVisible} info={updateInfo} isForce={isForceUpdate} onClose={() => setUpdateVisible(false)} />
                </View>
              </BottomSheetModalProvider>
            </IDEProvider>
          </QueryClientProvider>
        </SQLiteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  appLayer: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
});
