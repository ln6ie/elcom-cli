import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

export const APP_BRAND_ASCII = `
  ______ _      _____ ____  __  __ 
 |  ____| |    / ____/ __ \\|  \\/  |
 | |__  | |   | |   | |  | | \\  / |
 |  __| | |   | |   | |  | | |\\/| |
 | |____| |___| |___| |__| | |  | |
 |______|______\\____\\____/|_|  |_|
  _____ _      _____ 
 / ____| |    |_   _|
| |    | |      | |  
| |    | |      | |  
| |____| |____ _| |_ 
 \\_____|______|_____|
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
  textStyle 
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text 
        style={[
          styles.ascii, 
          { fontSize, lineHeight: fontSize + 1 }, 
          textStyle
        ]}
      >
        {APP_BRAND_ASCII}
      </Text>
      {showVersion && (
        <Text style={[styles.versionTag, { fontSize: fontSize + 2 }]}>
           CLI_AI_v1.0.0 [STABLE]
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ascii: {
    color: COLORS.primary,
    fontFamily: FONTS.mono,
    textAlign: 'center',
  },
  versionTag: {
    color: COLORS.primary,
    fontFamily: FONTS.mono,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 2,
  }
});
