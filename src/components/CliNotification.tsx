import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../constants/theme';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native';

interface CliNotificationProps {
  visible: boolean;
  message: string | string[];
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onHide?: () => void;
}

export const CliNotification = ({
  visible,
  message,
  type = 'success',
  duration = 3000,
  onHide,
}: CliNotificationProps) => {
  const insets = useSafeAreaInsets();
  const hiddenY = -(insets.top + 150);
  const translateY = useRef(new Animated.Value(hiddenY)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: hiddenY,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => onHide?.());
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      translateY.setValue(hiddenY);
      opacity.setValue(0);
    }
  }, [visible, hiddenY]);

  if (!visible) return null;

  const borderColor =
    type === 'error' ? COLORS.error : type === 'info' ? COLORS.primary : COLORS.success;

  const iconColor =
    type === 'error' ? COLORS.error : type === 'info' ? COLORS.primary : COLORS.success;

  const labelColor =
    type === 'error' ? COLORS.error : type === 'info' ? COLORS.primary : COLORS.success;

  const Icon =
    type === 'error' ? AlertCircle : type === 'info' ? Info : CheckCircle2;

  const messages = Array.isArray(message) ? message : [message];

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          borderColor, 
          transform: [{ translateY }], 
          opacity,
          paddingTop: insets.top + 10,
        },
      ]}
    >
      <View style={styles.header}>
        <Icon size={14} color={iconColor} />
        <Text style={[styles.label, { color: labelColor }]}>
          {`SYS_MSG // ${type.toUpperCase()}`}
        </Text>
      </View>

      <View style={styles.body}>
        {messages.map((msg, i) => (
          <Text key={i} style={styles.line}>
            {`> ${msg}`}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    zIndex: 9999,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  label: {
    fontFamily: FONTS.monoBold,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  body: {
    gap: 2,
  },
  line: {
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: 11,
    lineHeight: 16,
  },
});
