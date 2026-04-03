import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

interface StatusBarProps {
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
}

export const StatusBar = ({ title = 'ELCOM_CLI', subtitle = 'ONLINE', style }: StatusBarProps) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.separator}> // </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.cursor} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: 11,
  },
  separator: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: 11,
  },
  subtitle: {
    color: COLORS.success,
    fontFamily: FONTS.mono,
    fontSize: 10,
  },
  cursor: {
    marginLeft: 2,
    backgroundColor: COLORS.primary,
    width: 8,
    height: 16,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  button: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  buttonText: {
    color: COLORS.primary,
    fontFamily: FONTS.mono,
    fontSize: 10,
  },
  bold: {
    fontFamily: FONTS.monoBold,
  },
});
