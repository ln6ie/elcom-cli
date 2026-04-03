import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  FadeInUp, 
  FadeOutUp, 
  Layout 
} from 'react-native-reanimated';
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
  onHide 
}: CliNotificationProps) => {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        onHide?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  if (!visible) return null;

  const getIcon = () => {
    const size = 16;
    switch (type) {
      case 'success': return <CheckCircle2 size={size} color={COLORS.success} />;
      case 'error': return <AlertCircle size={size} color={COLORS.error} />;
      default: return <Info size={size} color={COLORS.primary} />;
    }
  };

  const messages = Array.isArray(message) ? message : [message];

  return (
    <Animated.View 
      entering={FadeInUp.springify().damping(20)}
      exiting={FadeOutUp}
      layout={Layout.springify()}
      style={[
        styles.container,
        type === 'error' && styles.errorBorder,
        type === 'info' && styles.infoBorder,
      ]}
    >
      <View style={styles.header}>
        {getIcon()}
        <Text style={[
          styles.statusText,
          type === 'error' && { color: COLORS.error },
          type === 'info' && { color: COLORS.primary },
        ]}>
          {type.toUpperCase()} // SYSTEM_MSG
        </Text>
      </View>
      
      <View style={styles.body}>
        {messages.map((msg, i) => (
          <Text key={i} style={styles.messageText}>
            {`> ${msg}`}
          </Text>
        ))}
      </View>
      
      <View style={styles.footer}>
        <View style={[
          styles.progress,
          { backgroundColor: type === 'error' ? COLORS.error : (type === 'info' ? COLORS.primary : COLORS.success) }
        ]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.success,
    zIndex: 9999,
    padding: 12,
  },
  errorBorder: {
    borderColor: COLORS.error,
  },
  infoBorder: {
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 4,
  },
  statusText: {
    color: COLORS.success,
    fontFamily: FONTS.monoBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  body: {
    gap: 4,
  },
  messageText: {
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: 12,
  },
  footer: {
    marginTop: 8,
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  progress: {
    height: '100%',
    width: '30%', // Decorative accent
  }
});
