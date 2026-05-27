import { useState, useCallback, useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";
import {
  database,
  DatabaseSettings,
  DEFAULT_SETTINGS,
} from "../services/database";
import { MODEL_PRESETS } from "../constants/models";

export const useSettings = () => {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState<DatabaseSettings>(DEFAULT_SETTINGS);
  const [customModels, setCustomModels] = useState<
    { id: string; name: string }[]
  >([]);
  const [modelPresets, setModelPresets] = useState<{ id: string; name: string }[]>(MODEL_PRESETS);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const [data, models] = await Promise.all([
        database.getSettings(db),
        database.getCustomModels(db),
      ]);
      setSettings(data);
      setCustomModels(models);

      // Fetch remote models list with fallback
      const modelsUrl = process.env.EXPO_PUBLIC_MODELS_URL || "https://cli.elcomlab.site/models.json";
      const response = await fetch(modelsUrl);
      if (response.ok) {
        const remoteModels = await response.json();
        if (Array.isArray(remoteModels) && remoteModels.length > 0) {
          setModelPresets(remoteModels);
        }
      }
    } catch (error) {
      console.log("useSettings: Failed to fetch remote models, fallback to presets", error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  const updateSetting = useCallback(
    async (key: keyof DatabaseSettings, value: string | number) => {
      try {
        await database.updateSetting(db, key, value);
        setSettings((prev) => ({ ...prev, [key]: value }));
      } catch (error) {
        console.error(`useSettings: Failed to update setting ${key}`, error);
        throw error;
      }
    },
    [db],
  );

  const updateMultipleSettings = useCallback(
    async (newSettings: Partial<DatabaseSettings>) => {
      try {
        for (const [key, value] of Object.entries(newSettings)) {
          if (value !== undefined && value !== null) {
            await database.updateSetting(db, key, value);
          }
        }
        setSettings((prev) => ({ ...prev, ...newSettings }));
      } catch (error) {
        console.error("useSettings: Failed to update multiple settings", error);
        throw error;
      }
    },
    [db],
  );

  const addCustomModel = async (id: string, name: string) => {
    try {
      if (customModels.some((m) => m.id === id)) return;
      await database.addCustomModel(db, id, name);
      setCustomModels((prev) => [{ id, name }, ...prev]);
    } catch (error: any) {
      if (error?.message?.includes("UNIQUE constraint failed")) {
        console.log("useSettings: Model already exists in DB");
        // Refresh custom models list just to be safe
        const models = await database.getCustomModels(db);
        setCustomModels(models);
      } else {
        console.error("useSettings: Add model failed", error);
      }
    }
  };

  const removeCustomModel = async (id: string) => {
    try {
      await database.deleteCustomModel(db, id);
      setCustomModels((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error("useSettings: Delete model failed", error);
    }
  };

  const renameCustomModel = async (id: string, newName: string) => {
    try {
      await database.updateCustomModelName(db, id, newName);
      setCustomModels((prev) =>
        prev.map((m) => (m.id === id ? { ...m, name: newName } : m)),
      );
    } catch (error) {
      console.error("useSettings: Rename model failed", error);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    customModels,
    modelPresets,
    isLoading,
    updateSetting,
    updateMultipleSettings,
    addCustomModel,
    removeCustomModel,
    renameCustomModel,
    refresh: loadSettings,
  };
};
