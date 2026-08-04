import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, Text, View } from "react-native";
import { AddVpsStep } from "@/features/onboarding/AddVpsStep";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";

export default function NewServerRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return <View style={styles.container}>
    <Text style={[styles.back, { top: insets.top + 8 }]} onPress={() => router.back()}>‹ SERVERS</Text>
    <View style={[styles.content, { paddingTop: insets.top + 48 }]}> 
      <AddVpsStep onSaved={() => router.back()} onSkip={() => router.back()} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },
  back: { position: "absolute", zIndex: 10, elevation: 10, left: SPACING.md, color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small, paddingVertical: 6, paddingRight: 12 },
});
