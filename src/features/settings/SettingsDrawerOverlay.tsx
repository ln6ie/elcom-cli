import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Dimensions, PanResponder, StyleSheet, View } from "react-native";
import { COLORS } from "@/constants/theme";

const DRAWER_WIDTH = Dimensions.get("window").width * 0.8;
const SCREEN_WIDTH = Dimensions.get("window").width;

export function SettingsDrawerOverlay({ visible, onOpen, onClose, children, drawerContent }: { visible: boolean; onOpen: () => void; onClose: () => void; children: ReactNode; drawerContent: ReactNode }) {
  const slide = useRef(new Animated.Value(0)).current;
  const current = useRef(0);
  const visibleRef = useRef(visible);
  const animateTo = (value: number, after?: () => void) => {
    Animated.timing(slide, { toValue: value, duration: 220, useNativeDriver: true }).start(({ finished }) => {
      if (finished) {
        current.current = value;
        after?.();
      }
    });
  };

  useEffect(() => {
    visibleRef.current = visible;
    animateTo(visible ? 1 : 0);
  }, [visible]);

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => {
      if (Math.abs(gesture.dx) < 12 || Math.abs(gesture.dx) < Math.abs(gesture.dy) * 1.5) return false;
      if (visibleRef.current) return gesture.dx > 12;
      return gesture.x0 > SCREEN_WIDTH - 40 && gesture.dx < -12;
    },
    onMoveShouldSetPanResponderCapture: (_, gesture) => {
      if (Math.abs(gesture.dx) < 12 || Math.abs(gesture.dx) < Math.abs(gesture.dy) * 1.5) return false;
      if (visibleRef.current) return gesture.dx > 12;
      return gesture.x0 > SCREEN_WIDTH - 40 && gesture.dx < -12;
    },
    onPanResponderGrant: () => slide.stopAnimation(value => { current.current = value; }),
    onPanResponderMove: (_, gesture) => slide.setValue(Math.max(0, Math.min(1, current.current - gesture.dx / DRAWER_WIDTH))),
    onPanResponderRelease: (_, gesture) => {
      const next = current.current - gesture.dx / DRAWER_WIDTH;
      if (visibleRef.current) {
        const shouldClose = gesture.dx > 45 || next < 0.5;
        animateTo(shouldClose ? 0 : 1, shouldClose ? onClose : undefined);
      } else {
        const shouldOpen = gesture.dx < -45 || next > 0.3;
        if (shouldOpen) onOpen();
        animateTo(shouldOpen ? 1 : 0);
      }
    },
  })).current;
  return <View {...pan.panHandlers} style={styles.root}>
    <Animated.View style={[styles.content, { transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [0, -DRAWER_WIDTH] }) }] }]}>
      {children}
    </Animated.View>
    <Animated.View pointerEvents={visible ? "auto" : "none"} style={[styles.drawer, { width: DRAWER_WIDTH, transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [DRAWER_WIDTH, 0] }) }] }]}> 
      {drawerContent}
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: COLORS.background, overflow: "hidden" }, content: { flex: 1, zIndex: 10 }, drawer: { position: "absolute", top: 0, bottom: 0, right: 0, backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderBottomLeftRadius: 28, overflow: "hidden", zIndex: 20, elevation: 20, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 12 }, });
