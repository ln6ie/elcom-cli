import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";
import { ThinkingDots } from "../ThinkingDots";

interface StatusAreaProps {
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

export const StatusArea = ({
  isLoading,
  isLoadingMore,
  error,
}: StatusAreaProps) => (
  <View style={styles.statusArea}>
    {isLoading && !isLoadingMore && <ThinkingDots />}
    {error && (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>ERR: {error}</Text>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  statusArea: {
    minHeight: 20,
    justifyContent: "center",
    paddingBottom: 8,
  },
  errorBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
    backgroundColor: "rgba(224, 74, 0, 0.1)",
    padding: 8,
  },
  errorText: {
    color: COLORS.error,
    fontFamily: FONTS.mono,
    fontSize: 11,
  },
});
