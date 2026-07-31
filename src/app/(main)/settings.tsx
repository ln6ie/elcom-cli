import { useRouter } from 'expo-router';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { useSettings } from '@/hooks/useSettings';

export default function SettingsRoute() {
  const router = useRouter();
  const settings = useSettings();
  return <SettingsScreen settings={settings.settings} customModels={settings.customModels} modelPresets={settings.modelPresets} openRouterModels={settings.openRouterModels} openCodeModels={settings.openCodeModels} modelsLoading={settings.modelsLoading} modelsError={settings.modelsError} onSave={settings.updateMultipleSettings} onAddCustomModel={settings.addCustomModel} onRemoveCustomModel={settings.removeCustomModel} onRenameCustomModel={settings.renameCustomModel} onBack={() => router.back()} onRetryModels={settings.refreshModels} />;
}
