import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";
import { AppBrand } from "../AppBrand";
import { ElcomLoader } from "../ElcomLoader";

interface HistoryLoaderProps {
  isLoadingMore: boolean;
  dateStr?: string;
}

export const HistoryLoader = ({
  isLoadingMore,
  dateStr = "2026-04-03",
}: HistoryLoaderProps) => (
  <View style={styles.historyLoader}>
    {isLoadingMore && (
      <View style={styles.loadingMore}>
        <ElcomLoader size={20} />
        <Text style={styles.loadingMoreText}>FETCHING_HISTORY...</Text>
      </View>
    )}
    <View style={styles.headerWrap}>
      <AppBrand fontSize={7} style={{ marginBottom: 16 }} />
      <Text style={styles.readyText}>SYSTEM READY... [{dateStr}]</Text>
      <View style={styles.divider} />
      <Text style={styles.connectionText}>
        CONNECTION: OPENROUTER / SECURE_CHNL
      </Text>
      <View style={styles.divider} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  historyLoader: {
    paddingTop: 16,
  },
  loadingMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  loadingMoreText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: 10,
    marginLeft: 8,
    letterSpacing: 1,
  },
  headerWrap: {
    marginBottom: 32,
    alignItems: "center",
    opacity: 1.0, // High visibility (was 0.4 which made it extremely dim)
  },
  readyText: {
    color: COLORS.text, // Bright white text
    fontFamily: FONTS.mono,
    fontSize: 10,
    marginTop: 8,
    letterSpacing: 2,
    textShadowColor: COLORS.success, // Glowing green shadow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  connectionText: {
    color: COLORS.primary, // Reverted to original blue color
    fontFamily: FONTS.mono,
    fontSize: 10,
    textAlign: "center",
    textShadowColor: COLORS.success, // Keeping the vibrant green shadow glow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
