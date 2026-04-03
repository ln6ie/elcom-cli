import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface WalkingCharacterProps {
  isLoading: boolean;
  inputTopY: number;
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const WalkingCharacter = ({ isLoading, inputTopY }: WalkingCharacterProps) => {
  const translateX = useRef(new Animated.Value(-60)).current;
  const leftLegY = useRef(new Animated.Value(0)).current;
  const rightLegY = useRef(new Animated.Value(0)).current;
  const eyeScaleY = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let horizontalAnim: any = null;
    let legAnim: any = null;
    let blinkAnim: any = null;

    if (isLoading) {
      setIsVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Horizontal walking loop - SLOWER (approx 50px/sec)
      horizontalAnim = Animated.loop(
        Animated.timing(translateX, {
          toValue: SCREEN_WIDTH + 60,
          duration: (SCREEN_WIDTH + 120) / 0.05, 
          useNativeDriver: true,
        })
      );
      horizontalAnim.start();

      // Leg walking cycle - SLOWER cycle
      legAnim = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(leftLegY, { toValue: -4, duration: 300, useNativeDriver: true }),
            Animated.timing(rightLegY, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(leftLegY, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(rightLegY, { toValue: -4, duration: 300, useNativeDriver: true }),
          ]),
        ])
      );
      legAnim.start();

      // Blinking cycle
      blinkAnim = Animated.loop(
        Animated.sequence([
          Animated.delay(2000 + Math.random() * 2000),
          Animated.timing(eyeScaleY, { toValue: 0.1, duration: 60, useNativeDriver: true }),
          Animated.timing(eyeScaleY, { toValue: 1, duration: 100, useNativeDriver: true }),
        ])
      );
      blinkAnim.start();
    } else {
      // Finish walking off screen before hiding
      Animated.timing(translateX, {
        toValue: SCREEN_WIDTH + 60,
        duration: 1200, 
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setIsVisible(false);
            translateX.setValue(-60);
          });
        }
      });

      if (legAnim) legAnim.stop();
      if (blinkAnim) blinkAnim.stop();
    }

    return () => {
      if (horizontalAnim) horizontalAnim.stop();
      if (legAnim) legAnim.stop();
      if (blinkAnim) blinkAnim.stop();
    };
  }, [isLoading]);

  if (!isVisible || inputTopY === 0) return null;

  return (
    <Animated.View 
      style={[
        styles.overlay, 
        { 
          top: inputTopY - 40,
          opacity,
          transform: [{ translateX }]
        }
      ]}
    >
      <Svg width="32" height="40" viewBox="0 0 140 190">
        {/* Body */}
        <Rect x="20" y="20" width="100" height="120" fill="#00a3e0"/>
        
        {/* Eye left */}
        <AnimatedRect 
          x="38" y="55" width="20" height="20" fill="#0E0E0E"
          transform={[{ translateY: 65 }, { scaleY: eyeScaleY }, { translateY: -65 }]}
        />
        <AnimatedRect 
          x="38" y="55" width="7" height="7" fill="#00e0a3"
          transform={[{ translateY: 65 }, { scaleY: eyeScaleY }, { translateY: -65 }]}
        />
        
        {/* Eye right */}
        <AnimatedRect 
          x="82" y="55" width="20" height="20" fill="#0E0E0E"
          transform={[{ translateY: 65 }, { scaleY: eyeScaleY }, { translateY: -65 }]}
        />
        <AnimatedRect 
          x="82" y="55" width="7" height="7" fill="#00e0a3"
          transform={[{ translateY: 65 }, { scaleY: eyeScaleY }, { translateY: -65 }]}
        />
        
        {/* Mouth */}
        <Rect x="48" y="100" width="10" height="8" fill="#0E0E0E"/>
        <Rect x="58" y="105" width="24" height="8" fill="#0E0E0E"/>
        <Rect x="82" y="100" width="10" height="8" fill="#0E0E0E"/>
        
        {/* Arms */}
        <Rect x="0" y="60" width="20" height="16" fill="#00a3e0"/>
        <Rect x="120" y="60" width="20" height="16" fill="#00a3e0"/>
        
        {/* Leg left */}
        <AnimatedRect 
          x="32" y="140" width="24" height="40" fill="#00a3e0"
          transform={[{ translateY: leftLegY }]}
        />
        <AnimatedRect 
          x="24" y="172" width="32" height="16" fill="#0077a8"
          transform={[{ translateY: leftLegY }]}
        />
        
        {/* Leg right */}
        <AnimatedRect 
          x="84" y="140" width="24" height="40" fill="#00a3e0"
          transform={[{ translateY: rightLegY }]}
        />
        <AnimatedRect 
          x="76" y="172" width="32" height="16" fill="#0077a8"
          transform={[{ translateY: rightLegY }]}
        />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    width: 32,
    height: 40,
    zIndex: 999,
  },
});
