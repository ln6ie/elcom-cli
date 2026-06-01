import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { COLORS, FONTS } from "../constants/theme";
import Constants from "expo-constants";

export const APP_BRAND_ASCII = `
 ___ _      ___  ___  __  __ 
| __| |    / __|/ _ \\|  \\/  |
| _| |    | (__| (_) | |\\/| |
|___|______\\___|\\___/|_|  |_|
  ___ _    ___ 
 / __| |  |_ _|
| (__| |__ | | 
 \\___|____|___|
`;

interface AppBrandProps {
  fontSize?: number;
  showVersion?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AppBrand: React.FC<AppBrandProps> = ({
  fontSize = 8,
  showVersion = true,
  style,
  textStyle,
}) => {
  const appVersion = Constants.expoConfig?.version || "1.0.2";

  return (
    <View style={[styles.container, style]}>
      <Text
        style={[
          styles.ascii,
          { fontSize, lineHeight: fontSize + 1 },
          textStyle,
         ]}
      >
        {APP_BRAND_ASCII}
      </Text>
      {showVersion && (
        <Text style={[styles.versionTag, { fontSize: fontSize + 2 }]}>
          CLI_AI_v{appVersion} [STABLE]
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  ascii: {
    color: COLORS.primary,
    fontFamily: FONTS.mono,
    textAlign: "center",
  },
  versionTag: {
    color: COLORS.primary,
    fontFamily: FONTS.mono,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 10,
    letterSpacing: 2,
  },
});
