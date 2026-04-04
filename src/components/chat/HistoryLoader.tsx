import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";
import { AppBrand } from "../AppBrand";

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
        <ActivityIndicator size="small" color={COLORS.primaryDim} />
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
    opacity: 0.4,
  },
  readyText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: 10,
    marginTop: 8,
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  connectionText: {
    color: COLORS.primary,
    fontFamily: FONTS.mono,
    fontSize: 10,
    textAlign: "center",
  },
});
