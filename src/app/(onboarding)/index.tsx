import { useSettings } from "@/hooks/useSettings";
import { OnboardingScreen } from "@/features/onboarding/OnboardingScreen";
import { useRouter } from "expo-router";

export default function OnboardingRoute() {
  const router = useRouter();
  const { updateMultipleSettings } = useSettings();
  const finish = async () => { await updateMultipleSettings({ onboarding_completed: true }); router.replace("/(dashboard)/home"); };
  return <OnboardingScreen onFinish={finish} onAiConfigured={async (key, language, provider) => {
    await updateMultipleSettings(provider === "opencode"
      ? { opencode_api_key: key, language, ai_provider: "opencode", onboarding_completed: true }
      : { api_key: key, language, ai_provider: "openrouter", onboarding_completed: true });
    router.replace("/(dashboard)/home");
  }} />;
}
