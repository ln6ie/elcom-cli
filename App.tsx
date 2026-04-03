import { View, ActivityIndicator, StyleSheet } from 'react-native';
import {
  useFonts,
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono';
import { useApiKey } from './src/hooks/useApiKey';
import { SetupScreen } from './src/screens/SetupScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from './src/constants/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const { apiKey, isLoading: isKeyLoading, saveApiKey, clearApiKey } =
    useApiKey();

  const [fontsLoaded, fontError] = useFonts({
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (isKeyLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="light" />
        {!apiKey ? (
          <SetupScreen onConnect={saveApiKey} />
        ) : (
          <ChatScreen onResetKey={clearApiKey} />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loader: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
