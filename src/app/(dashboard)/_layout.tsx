import { Drawer } from "expo-router/drawer";
import { COLORS } from "@/constants/theme";

export default function DashboardLayout() {
  return <Drawer screenOptions={{ headerShown: false, drawerStyle: { backgroundColor: COLORS.surface }, drawerActiveTintColor: COLORS.primary, drawerInactiveTintColor: COLORS.textDim }}>
    <Drawer.Screen name="home" options={{ title: "Home" }} />
    <Drawer.Screen name="servers" options={{ title: "Servers" }} />
    <Drawer.Screen name="ai" options={{ title: "AI" }} />
    <Drawer.Screen name="settings" options={{ title: "Settings" }} />
  </Drawer>;
}
