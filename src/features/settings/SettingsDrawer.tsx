import React from 'react';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { DatabaseSettings } from '@/services/database';
import { ModelInfo } from '@/services/modelService';

interface SettingsDrawerProps {
  settings: DatabaseSettings;
  customModels: { id: string; name: string }[];
  modelPresets: { id: string; name: string }[];
  openRouterModels: ModelInfo[];
  openCodeModels: ModelInfo[];
  modelsLoading?: boolean;
  modelsError?: string | null;
  onSave: (settings: Partial<DatabaseSettings>) => Promise<void>;
  onAddCustomModel: (id: string, name: string) => Promise<void>;
  onRemoveCustomModel: (id: string) => Promise<void>;
  onRenameCustomModel: (id: string, name: string) => Promise<void>;
  onBack: () => void;
  onRetryModels?: () => void;
}

export function SettingsDrawer(props: SettingsDrawerProps) {
  return <SettingsScreen {...props} />;
}
