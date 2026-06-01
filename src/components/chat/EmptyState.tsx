import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS, FONTS, FONT_SIZES } from "../../constants/theme";
import { TypewriterText } from "../TypewriterText";

interface EmptyStateProps {
  isVisible: boolean;
}

export const EmptyState = ({ isVisible }: EmptyStateProps) => {
  if (!isVisible) return null;

  return (
    <View style={styles.emptyWrap}>
      <TypewriterText
        phrases={[
          "WELCOME",
          " Elcom CLI",
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.body,
  },
});
