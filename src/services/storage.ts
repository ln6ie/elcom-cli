import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE = 'ELCOM_CLI_OPENROUTER_KEY';

export const storage = {
  async setApiKey(key: string): Promise<void> {
    try {
      await AsyncStorage.setItem(API_KEY_STORAGE, key);
    } catch (error) {
      console.error('Storage: Failed to set API key', error);
      throw new Error('FAILED_TO_SAVE_KEY');
    }
  },

  async getApiKey(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(API_KEY_STORAGE);
    } catch (error) {
      console.error('Storage: Failed to get API key', error);
      return null;
    }
  },

  async clearApiKey(): Promise<void> {
    try {
      await AsyncStorage.removeItem(API_KEY_STORAGE);
    } catch (error) {
      console.error('Storage: Failed to clear API key', error);
    }
  },
};
