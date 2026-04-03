import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { database } from '../services/database';
import { COLORS, FONTS } from '../constants/theme';
import { Trash2, MessageSquare, ChevronRight } from 'lucide-react-native';
import { CliNotification } from '../components/CliNotification';

interface HistoryScreenProps {
  onSelect: (id: string) => void;
  onBack: () => void;
  onNew: () => void;
}

export const HistoryScreen = ({ onSelect, onBack, onNew }: HistoryScreenProps) => {
  const db = useSQLiteContext();
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ visible: boolean; message: string | string[]; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'success'
  });

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await database.getAllConversations(db);
      setConversations(data);
    } catch (error) {
      console.error('History: Failed to load', error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDelete = async (id: string) => {
    try {
      await database.deleteConversation(db, id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      setNotification({
        visible: true,
        message: [`SESSION_ID_${id.slice(0, 4)}_DELETED`, 'FS_CLEANUP_COMPLETE'],
        type: 'success',
      });
    } catch (error) {
      setNotification({
        visible: true,
        message: 'SYSTEM_ERROR: DELETE_OPERATION_FAILED',
        type: 'error',
      });
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.itemMain} 
        onPress={() => onSelect(item.id)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.title || 'UNNAMED_SESSION'}
          </Text>
          <Text style={styles.itemDate}>{new Date(item.last_message_at).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.itemModel}>{item.model_id}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => handleDelete(item.id)}
      >
        <Trash2 size={18} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <CliNotification 
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onHide={() => setNotification(prev => ({ ...prev, visible: false }))}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>LOG_ARCHIVE // SESSIONS</Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>[EXIT]</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.newButton} onPress={onNew}>
        <Text style={styles.newButtonText}>+ INIT_NEW_SESSION</Text>
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>NO_RECORDS_FOUND. START_FIRST_LOG?</Text>
            </View>
          }
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: 14,
  },
  backButton: {
    color: COLORS.error,
    fontFamily: FONTS.monoBold,
  },
  newButton: {
    margin: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.success,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  newButtonText: {
    color: COLORS.success,
    fontFamily: FONTS.monoBold,
    fontSize: 12,
  },
  list: {
    padding: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    alignItems: 'center',
  },
  itemMain: {
    flex: 1,
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    color: COLORS.text,
    fontFamily: FONTS.monoBold,
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  itemDate: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: 10,
  },
  itemModel: {
    color: COLORS.primaryDim,
    fontFamily: FONTS.mono,
    fontSize: 9,
  },
  deleteButton: {
    padding: 16,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: 12,
    textAlign: 'center',
  },
});
