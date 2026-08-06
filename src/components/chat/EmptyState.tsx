import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS, FONTS, FONT_SIZES, isTablet } from "../../constants/theme";
import { TypewriterText } from "../TypewriterText";
import { AppBrand } from "../AppBrand";

interface EmptyStateProps {
  isVisible: boolean;
}

export const EmptyState = ({ isVisible }: EmptyStateProps) => {
  if (!isVisible) return null;

  return (
    <View style={styles.emptyWrap}>
      <AppBrand 
        fontSize={isTablet ? 12 : 8.5} 
        showVersion={true} 
        style={styles.brand} 
      />
      <TypewriterText
        phrases={[
          "WELCOME",
          " Kimko CLI",
          "// جاري تهيئة الاتصال الآمن...",
          "// تم التعرف على الهوية",
          "// سجل المحادثات فارغ حالياً.",
          "// أدخل استفسارك الأول لبدء الجلسة...",
        ]}
        style={styles.emptyText}
        speed={40}
        deleteSpeed={30}
        pause={1200}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  emptyWrap: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-start", // Aligns content starting from the top
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 90, // Positioned beautifully below the status bar/header
  },
  brand: {
    marginBottom: 24, // Clear separation between logo and typing animation
  },
  emptyText: {
    color: COLORS.text, // Bright white for 100% legibility and clarity
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.body,
    textShadowColor: COLORS.success, // Glowing green neon shadow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12, // Increased shadow radius for a stronger glowing effect
  },
});
