import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import {
  useFonts,
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono';
import { useSettings } from './src/hooks/useSettings';
import { SetupScreen } from './src/screens/SetupScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { UpdateModal } from './src/components/UpdateModal';
import { UpdateService, UpdateInfo } from './src/services/UpdateService';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from './src/constants/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { initDb, database } from './src/services/database';
import * as Crypto from 'expo-crypto';
import 'react-native-get-random-values';

SplashScreen.preventAutoHideAsync();

type Screen = 'setup' | 'chat' | 'history' | 'settings';

function AppContent() {
  const db = useSQLiteContext();
  const { 
    settings, 
    customModels,
    isLoading: isSettingsLoading, 
    updateSetting, 
    updateMultipleSettings,
    addCustomModel,
    removeCustomModel,
    renameCustomModel
  } = useSettings();
  const [currentScreen, setCurrentScreen] = useState<Screen>('chat');
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  
  // Update state
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | undefined>();
  const [updateVisible, setUpdateVisible] = useState(false);
  const [isForceUpdate, setIsForceUpdate] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  // Check for updates on mount
  useEffect(() => {
    const checkUpdates = async () => {
      const { status, info } = await UpdateService.checkUpdate();
      if (status === 'UPDATE_AVAILABLE' || status === 'FORCE_UPDATE_REQUIRED') {
        setUpdateInfo(info);
        setIsForceUpdate(status === 'FORCE_UPDATE_REQUIRED');
        setUpdateVisible(true);
      }
    };
    
    // Check after fonts and splash are handled
    if (fontsLoaded) {
      setTimeout(checkUpdates, 1500);
    }
  }, [fontsLoaded]);

  // Handle first-time setup or no API key and resume last session
  useEffect(() => {
    const initSession = async () => {
      if (isSettingsLoading || !settings.api_key || !db) return;

      if (!activeConvId) {
        const history = await database.getAllConversations(db);
        if (history && history.length > 0) {
          // Resume most recent session
          setActiveConvId((history[0] as any).id);
          setCurrentScreen('chat');
        } else {
          // Auto-create initial conversation if none exists
          const newId = Crypto.randomUUID();
          await database.createConversation(db, newId, 'INITIAL_SESSION', settings.selected_model);
          setActiveConvId(newId);
          setCurrentScreen('chat');
        }
      }
    };
    
    initSession();
  }, [isSettingsLoading, settings.api_key, db]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const handleCommand = useCallback(async (cmd: string, args: string[]) => {
    switch (cmd) {
      case 'chat':
      case 'new':
        const newId = Crypto.randomUUID();
        await database.createConversation(db, newId, 'NEW_SESSION', settings.selected_model);
        setActiveConvId(newId);
        setCurrentScreen('chat');
        break;
      case 'history':
        setCurrentScreen('history');
        break;
      case 'settings':
        setCurrentScreen('settings');
        break;
      case 'model':
        if (args[0]) {
          await updateSetting('selected_model', args[0]);
          Alert.alert('SYSTEM', `MODEL_CHANGED_TO: ${args[0]}`);
        }
        break;
      case 'clear':
        if (activeConvId) {
          await db.runAsync('DELETE FROM messages WHERE conversation_id = ?', [activeConvId]);
          // We need to trigger a refresh in useChat, currently handled by state in ChatScreen
          // For now, simpler to just re-mount or notify.
          const current = activeConvId;
          setActiveConvId(null);
          setTimeout(() => setActiveConvId(current), 10);
        }
        break;
      case 'exit':
        setCurrentScreen('chat');
        break;
      default:
        Alert.alert('SYSTEM_ERROR', `UNKNOWN_COMMAND: ${cmd}`);
    }
  }, [db, settings, activeConvId]);

  if (!fontsLoaded && !fontError) return null;
  if (isSettingsLoading) return null;

  const renderScreen = () => {
    const isSetup = !settings.api_key || currentScreen === 'setup';
    
    return (
      <View style={styles.flex1}>
        {/* Chat Screen stays mounted in background if not in setup */}
        {!isSetup && activeConvId && (
          <View style={[styles.flex1, currentScreen !== 'chat' && styles.hidden]}>
            <ChatScreen 
              conversationId={activeConvId} 
              userName={settings.user_name}
              customModels={customModels}
              onCommand={handleCommand}
            />
          </View>
        )}

        {isSetup && (
          <SetupScreen onConnect={(key) => updateSetting('api_key', key)} />
        )}

        {currentScreen === 'history' && (
          <View style={StyleSheet.absoluteFill}>
            <HistoryScreen 
              onSelect={(id) => { setActiveConvId(id); setCurrentScreen('chat'); }} 
              onBack={() => setCurrentScreen('chat')}
              onNew={() => handleCommand('new', [])}
            />
          </View>
        )}

        {currentScreen === 'settings' && (
          <View style={StyleSheet.absoluteFill}>
            <SettingsScreen 
              settings={settings} 
              customModels={customModels}
              onSave={updateMultipleSettings}
              onAddCustomModel={addCustomModel}
              onRemoveCustomModel={removeCustomModel}
              onRenameCustomModel={renameCustomModel}
              onBack={() => setCurrentScreen('chat')}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {renderScreen()}
      <UpdateModal 
        visible={updateVisible} 
        info={updateInfo} 
        isForce={isForceUpdate} 
        onClose={() => setUpdateVisible(false)} 
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="elcomcli.db" onInit={initDb}>
        <AppContent />
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex1: {
    flex: 1,
  },
  hidden: {
    width: 0,
    height: 0,
    opacity: 0,
    overflow: 'hidden',
  },
});
