import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");
export const isTablet = Math.min(width, height) >= 600;

export const COLORS = {
  background: "#0E0E0E",
  surface: "#141414",
  border: "#1E1E1E",
  // Brand blue shared with the animated ElcomLoader mark.
  primary: "#1A8AFF",
  primaryDim: "#7DD4FF",
  primaryDeep: "#0050DD",
  neutralButton: "#171717",
  text: "#E8E8E8",
  textDim: "#9EAEB8",   // Made much brighter (was #555555) to satisfy Apple Guideline 4 contrast requirements
  success: "#00E0A3",
  error: "#E04A00",
} as const;

export const FONTS = {
  mono: "SpaceMono_400Regular",
  monoBold: "SpaceMono_700Bold",
} as const;

// Responsive Font Sizes for Accessibility & Guidelines Compliance
export const FONT_SIZES = {
  body: isTablet ? 17 : 14.5,
  heading1: isTablet ? 26 : 22,
  heading2: isTablet ? 21 : 18,
  title: isTablet ? 16 : 14,
  label: isTablet ? 14 : 12,
  small: isTablet ? 13 : 11,
  tiny: isTablet ? 11 : 9.5,
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
