import { Stack } from "expo-router";
import { COLORS } from "@/constants/theme";

export default function DashboardLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }} />;
}
