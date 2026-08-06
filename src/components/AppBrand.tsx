import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { COLORS, FONTS } from "../constants/theme";
import Constants from "expo-constants";

export const APP_BRAND_ASCII = `
██╗  ██╗██╗███╗   ███╗██╗  ██╗ ██████╗
██║ ██╔╝██║████╗ ████║██║ ██╔╝██╔═══██╗
█████╔╝ ██║██╔████╔██║█████╔╝ ██║   ██║
██╔═██╗ ██║██║╚██╔╝██║██╔═██╗ ██║   ██║
██║  ██╗██║██║ ╚═╝ ██║██║  ██╗╚██████╔╝
╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝

              C L I  /  V P S  C O N T R O L
`;

interface AppBrandProps { fontSize?: number; showVersion?: boolean; style?: ViewStyle; textStyle?: TextStyle; }

export const AppBrand: React.FC<AppBrandProps> = ({ fontSize = 8, showVersion = true, style, textStyle }) => {
  const appVersion = Constants.expoConfig?.version || "1.0.2";
  return <View style={[styles.container, style]}>
    <Text style={[styles.ascii, { fontSize, lineHeight: fontSize + 1 }, textStyle]}>{APP_BRAND_ASCII}</Text>
    {showVersion && <Text style={[styles.versionTag, { fontSize: fontSize + 2 }]}>KIMKO_CLI_v{appVersion} [STABLE]</Text>}
  </View>;
};

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  ascii: { color: COLORS.primary, fontFamily: FONTS.mono, textAlign: "center", textShadowColor: "transparent", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 0 },
  versionTag: { color: COLORS.primary, fontFamily: FONTS.monoBold, textAlign: "center", marginTop: 10, letterSpacing: 2, textShadowColor: "transparent", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 0 },
});
