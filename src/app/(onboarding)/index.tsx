import { useSettings } from "@/hooks/useSettings";
import { OnboardingScreen } from "@/features/onboarding/OnboardingScreen";

export default function OnboardingRoute() {
  const { updateSetting } = useSettings();
  return <OnboardingScreen onComplete={() => updateSetting("onboarding_completed", true)} />;
}
