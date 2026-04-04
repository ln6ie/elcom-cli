import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { COLORS, FONTS } from "../constants/theme";

export const ThinkingDots = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>THINKING</Text>
      <Animated.Text style={[styles.dots, { opacity }]}>...</Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  label: {
    color: COLORS.success,
    fontFamily: FONTS.mono,
    fontSize: 13,
  },
  dots: {
    color: COLORS.success,
    fontFamily: FONTS.mono,
    fontSize: 13,
  },
});
