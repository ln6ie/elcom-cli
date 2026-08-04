import { useSettings } from "@/hooks/useSettings";
import { SettingsScreen } from "./SettingsScreen";

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const settings = useSettings();
  return <SettingsScreen settings={settings.settings} customModels={settings.customModels} modelPresets={settings.modelPresets} openRouterModels={settings.openRouterModels} openCodeModels={settings.openCodeModels} modelsLoading={settings.modelsLoading} modelsError={settings.modelsError} onSave={settings.updateMultipleSettings} onAddCustomModel={settings.addCustomModel} onRemoveCustomModel={settings.removeCustomModel} onRenameCustomModel={settings.renameCustomModel} onBack={onClose} onRetryModels={settings.refreshModels} />;
}
