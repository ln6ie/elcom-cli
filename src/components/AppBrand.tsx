import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { COLORS, FONTS } from "../constants/theme";
import Constants from "expo-constants";

export const APP_BRAND_ASCII = `
  ______   _        _____   ____    __  __ 
 |  ____| | |      / ____| / __ \\  |  \\/  |
 | |__    | |     | |     | |  | | | \\  / |
 |  __|   | |     | |     | |  | | | |\\/| |
 | |____  | |____ | |____ | |__| | | |  | |
 |______| |______| \\_____| \\____/  |_|  |_|

    _____   _        _____ 
   / ____| | |      |_   _|
  | |      | |        | |  
  | |      | |        | |  
  | |____  | |____   _| |_ 
   \\_____| |______| |_____|
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
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8, // Neon radiant glow effect satisfying Guideline 4 Design
  },
  versionTag: {
    color: COLORS.primary,
    fontFamily: FONTS.mono,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 10,
    letterSpacing: 2,
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});
