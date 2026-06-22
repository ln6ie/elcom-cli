import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONTS, FONT_SIZES } from "../constants/theme";

interface DiffLineProps {
  type: "added" | "removed" | "normal";
  content: string;
}

export const DiffLine: React.FC<DiffLineProps> = ({ type, content }) => {
  const isAdded = type === "added";
  const isRemoved = type === "removed";

  let backgroundColor = "transparent";
  let textColor: string = COLORS.textDim;
  let indicator = " ";

  if (isAdded) {
    backgroundColor = "rgba(0, 224, 163, 0.15)"; // Sleek translucent green
    textColor = COLORS.success;
    indicator = "+";
  } else if (isRemoved) {
    backgroundColor = "rgba(224, 74, 0, 0.15)"; // Sleek translucent red
    textColor = COLORS.error;
    indicator = "-";
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.indicatorText, { color: textColor }]}>
        {indicator}
      </Text>
      <Text style={[styles.lineContentText, { color: textColor }]}>
        {content || " "}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  indicatorText: {
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.small,
    width: 16,
    textAlign: "center",
    marginRight: 8,
  },
  lineContentText: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.small,
    flex: 1,
  },
});
