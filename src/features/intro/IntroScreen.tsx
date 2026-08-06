import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppBrand } from "@/components/AppBrand";
import { DeveloperCredit } from "@/components/DeveloperCredit";
import { ElcomLoader } from "@/components/ElcomLoader";
import { COLORS } from "@/constants/theme";

export function IntroScreen({ ready, onFinished }: { ready: boolean; onFinished: () => void }) {
  const [phase, setPhase] = useState<"brand" | "loading">("brand");

  useEffect(() => {
    const loadingTimer = setTimeout(() => setPhase("loading"), 650);
    return () => clearTimeout(loadingTimer);
  }, []);

  useEffect(() => {
    if (!ready || phase !== "loading") return;
    const finishTimer = setTimeout(onFinished, 600);
    return () => clearTimeout(finishTimer);
  }, [phase, ready, onFinished]);

  return (
    <View style={styles.screen}>
      <View style={styles.brandArea}>
        {phase === "brand" ? <AppBrand fontSize={8} showVersion /> : <ElcomLoader size="large" />}
      </View>
      <View style={styles.creditArea}>
        <DeveloperCredit />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  brandArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  creditArea: { position: "absolute", left: 16, right: 16, bottom: 28, alignItems: "center" },
});
