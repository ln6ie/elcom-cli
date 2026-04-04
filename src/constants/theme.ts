import { StyleSheet } from "react-native";

export const COLORS = {
  background: "#0E0E0E",
  surface: "#141414",
  border: "#1E1E1E",
  primary: "#00A3E0",
  primaryDim: "#0077A8",
  text: "#E8E8E8",
  textDim: "#555555",
  success: "#00E0A3",
  error: "#E04A00",
} as const;

export const FONTS = {
  mono: "SpaceMono_400Regular",
  monoBold: "SpaceMono_700Bold",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const baseStyles = StyleSheet.create({
  flex1: { flex: 1 },
  row: { flexDirection: "row" },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  center: { alignItems: "center", justifyContent: "center" },
  bg: { backgroundColor: COLORS.background },
  surface: { backgroundColor: COLORS.surface },
  borderColor: { borderColor: COLORS.border },
});
