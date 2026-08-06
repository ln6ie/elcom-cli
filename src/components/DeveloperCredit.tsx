import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";
import { COLORS, FONTS, FONT_SIZES } from "@/constants/theme";

export const DEVELOPER_ASCII = `
 █████╗ ██████╗ ██╗   ██╗██╗     ██╗      █████╗ ██╗  ██╗
██╔══██╗██╔══██╗██║   ██║██║     ██║     ██╔══██╗██║  ██║
███████║██████╔╝██║   ██║██║     ██║     ███████║███████║
██╔══██║██╔══██╗██║   ██║██║     ██║     ██╔══██║██╔══██║
██║  ██║██████╔╝╚██████╔╝███████╗███████╗██║  ██║██║  ██║
╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝

                    K A R E E M
`;

/** Shared English-only terminal attribution shown on the intro and settings screens. */
export function DeveloperCredit({ showInstagram = false, compact = false }: { showInstagram?: boolean; compact?: boolean }) {
  return (
    <View style={styles.wrapper}>
      {compact ? <Text style={styles.compactName}>BY : ABDULLAH KAREEM</Text> : (
        <>
          <Text style={styles.prompt}>// DESIGN & DEVELOPMENT</Text>
          <Text style={styles.ascii}>{DEVELOPER_ASCII}</Text>
          <Text style={styles.name}>BY : ABDULLAH KAREEM</Text>
        </>
      )}
      {showInstagram ? (
        <Pressable
          style={styles.instagramLink}
          onPress={() => void Linking.openURL("https://instagram.com/elcom.lab")}
          accessibilityRole="button"
          accessibilityLabel="Open Instagram elcom.lab"
        >
          <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
            <Rect x="3" y="3" width="18" height="18" rx="5" stroke={COLORS.primary} strokeWidth="2" />
            <Circle cx="12" cy="12" r="4" stroke={COLORS.primary} strokeWidth="2" />
            <Circle cx="17.5" cy="6.5" r="1" fill={COLORS.primary} />
          </Svg>
          <Text style={styles.instagramText}>@elcom.lab</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%", alignItems: "center" },
  prompt: { color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small, marginBottom: 3, textAlign: "center" },
  ascii: { color: COLORS.primary, fontFamily: FONTS.mono, fontSize: 6, lineHeight: 7, textAlign: "center" },
  name: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small, marginTop: 5, textAlign: "center", letterSpacing: 1 },
  compactName: { color: COLORS.primary, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, marginTop: 18, textAlign: "center" },
  instagramLink: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  instagramText: { color: COLORS.textDim, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small },
});
