import { useState, useEffect, useCallback } from 'react';
import { storage } from '../services/storage';

export const useApiKey = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadKey = async () => {
      const key = await storage.getApiKey();
      setApiKey(key);
      setIsLoading(false);
    };
    loadKey();
  }, []);

  const saveApiKey = useCallback(async (key: string) => {
    if (!key.trim()) return;
    await storage.setApiKey(key.trim());
    setApiKey(key.trim());
  }, []);

  const clearApiKey = useCallback(async () => {
    await storage.clearApiKey();
    setApiKey(null);
  }, []);

  return { apiKey, isLoading, saveApiKey, clearApiKey };
};
