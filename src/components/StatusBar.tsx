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
  onClear: () => void;
  onResetKey: () => void;
  style?: ViewStyle;
}

export const StatusBar = ({ onClear, onResetKey, style }: StatusBarProps) => {
  const cursorOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [cursorOpacity]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        <Text style={styles.title}>ELCOM_CLI // ONLINE</Text>
        <Animated.View style={[styles.cursor, { opacity: cursorOpacity }]} />
      </View>

      <View style={styles.right}>
        <TouchableOpacity
          onPress={onClear}
          activeOpacity={0.7}
          style={styles.button}
        >
          <Text style={styles.buttonText}>[CLR]</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onResetKey}
          activeOpacity={0.7}
          style={styles.button}
        >
          <Text style={[styles.buttonText, styles.bold]}>[KEY]</Text>
        </TouchableOpacity>
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
