import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import Svg, { Defs, G, Line, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { COLORS, FONTS, FONT_SIZES } from "@/constants/theme";

type LoaderSize = "small" | "medium" | "large" | number;

interface ElcomLoaderProps {
  size?: LoaderSize;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

const AnimatedView = Animated.createAnimatedComponent(View);

const getSize = (size: LoaderSize) => {
  if (typeof size === "number") return size;
  if (size === "large") return 84;
  if (size === "medium") return 56;
  return 30;
};

function createGearPath(teeth = 12) {
  const center = 256;
  const outerRadius = 242;
  const rootRadius = 216;
  const points: string[] = [];

  for (let index = 0; index < teeth; index += 1) {
    const angle = (index / teeth) * Math.PI * 2 - Math.PI / 2;
    const toothWidth = Math.PI / teeth;
    const segments = [
      [rootRadius, angle - toothWidth * 0.9],
      [outerRadius, angle - toothWidth * 0.55],
      [outerRadius, angle + toothWidth * 0.55],
      [rootRadius, angle + toothWidth * 0.9],
    ];

    for (const [radius, pointAngle] of segments) {
      points.push(`${center + Math.cos(pointAngle) * radius},${center + Math.sin(pointAngle) * radius}`);
    }
  }

  return `M ${points.join(" L ")} Z`;
}

const GEAR_PATH = createGearPath();

export function ElcomLoader({ size = "medium", label, style }: ElcomLoaderProps) {
  const dimension = getSize(size);
  const rotation = useRef(new Animated.Value(0)).current;
  const gearTransform = useMemo(
    () => rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }),
    [rotation],
  );

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [rotation]);

  return (
    <View style={[styles.container, style]} accessibilityRole="progressbar" accessibilityLabel={label || "Loading"}>
      <View style={{ width: dimension, height: dimension }}>
        <AnimatedView style={[styles.fill, { transform: [{ rotate: gearTransform }] }]} pointerEvents="none">
          <Svg width={dimension} height={dimension} viewBox="0 0 512 512">
            <Defs>
              <LinearGradient id="elcomLoaderBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={COLORS.primaryDim} />
                <Stop offset="50%" stopColor={COLORS.primary} />
                <Stop offset="100%" stopColor="#0050DD" />
              </LinearGradient>
            </Defs>
            <Path d={GEAR_PATH} fill="none" stroke="url(#elcomLoaderBorder)" strokeWidth={22} strokeLinejoin="round" />
            <Path d={GEAR_PATH} fill="none" stroke={COLORS.primaryDim} strokeWidth={4} opacity={0.45} />
          </Svg>
        </AnimatedView>

        <Svg width={dimension} height={dimension} viewBox="0 0 512 512">
          <Defs>
            <LinearGradient id="elcomLoaderSymbol" x1="0%" y1="0%" x2="20%" y2="100%">
              <Stop offset="0%" stopColor={COLORS.primaryDim} />
              <Stop offset="35%" stopColor={COLORS.primary} />
              <Stop offset="100%" stopColor="#0046CC" />
            </LinearGradient>
          </Defs>
          <G>
            <Line x1="90" y1="260" x2="160" y2="150" stroke="url(#elcomLoaderSymbol)" strokeWidth="30" strokeLinecap="round" />
            <Line x1="160" y1="150" x2="230" y2="260" stroke="url(#elcomLoaderSymbol)" strokeWidth="30" strokeLinecap="round" />
            <Line x1="94" y1="253" x2="157" y2="157" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" opacity={0.55} />
            <Line x1="422" y1="150" x2="310" y2="210" stroke="url(#elcomLoaderSymbol)" strokeWidth="30" strokeLinecap="round" />
            <Line x1="310" y1="210" x2="422" y2="270" stroke="url(#elcomLoaderSymbol)" strokeWidth="30" strokeLinecap="round" />
            <Line x1="418" y1="157" x2="315" y2="214" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" opacity={0.55} />
            <Rect x="190" y="325" width="150" height="30" rx="15" fill={COLORS.primary} />
            <Rect x="194" y="327" width="142" height="10" rx="5" fill="#FFFFFF" opacity={0.45} />
          </G>
        </Svg>
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  container: { alignItems: "center", justifyContent: "center" },
  label: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.small, marginTop: 8, textAlign: "center" },
});
