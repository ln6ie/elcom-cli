import React, { useState, useEffect } from "react";
import { Text, TextStyle, StyleSheet } from "react-native";
import { COLORS, FONTS } from "../constants/theme";

interface TypewriterTextProps {
  phrases: string[];
  speed?: number;
  deleteSpeed?: number;
  pause?: number;
  style?: TextStyle;
  onComplete?: () => void;
}

const isArabic = (text: string) => {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
  return arabicPattern.test(text);
};

export const TypewriterText = ({
  phrases,
  speed = 40,
  deleteSpeed = 20,
  pause = 1500,
  style,
  onComplete,
}: TypewriterTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentPhrase = phrases[phraseIndex] || "";
  const rtl = isArabic(currentPhrase);

  useEffect(() => {
    if (phraseIndex < phrases.length) {
      const currentPhrase = phrases[phraseIndex];

      if (!isDeleting && charIndex < currentPhrase.length) {
        // Typing
        const timeout = setTimeout(() => {
          setDisplayedText(currentPhrase.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, speed);
        return () => clearTimeout(timeout);
      } else if (isDeleting && charIndex > 0) {
        // Deleting
        const timeout = setTimeout(() => {
          setDisplayedText(currentPhrase.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        }, deleteSpeed);
        return () => clearTimeout(timeout);
      } else if (!isDeleting && charIndex === currentPhrase.length) {
        // Pause after typing
        const timeout = setTimeout(() => setIsDeleting(true), pause);
        return () => clearTimeout(timeout);
      } else if (isDeleting && charIndex === 0) {
        // Switch to next phrase with Loop
        setIsDeleting(false);
        setPhraseIndex((phraseIndex + 1) % phrases.length);
        if (phraseIndex === phrases.length - 1 && onComplete) onComplete();
      }
    }
  }, [
    charIndex,
    isDeleting,
    phraseIndex,
    phrases,
    speed,
    deleteSpeed,
    pause,
    onComplete,
  ]);

  return (
    <Text
      style={[
        styles.text,
        {
          textAlign: rtl ? "right" : "left",
          writingDirection: rtl ? "rtl" : "ltr",
        },
        style,
      ]}
    >
      {displayedText}
      <Text style={styles.cursor}>█</Text>
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    color: COLORS.text,
    fontFamily: FONTS.mono,
  },
  cursor: {
    color: COLORS.primary,
  },
});
