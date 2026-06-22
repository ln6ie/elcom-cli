import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { FolderGit, Key } from "lucide-react-native";
import { COLORS, FONTS, FONT_SIZES } from "../constants/theme";
import { TRANSLATIONS, Language } from "../constants/translations";

interface GithubConnectProps {
  loginWithOAuth: () => void;
  loginWithToken: (token: string) => Promise<boolean>;
  redirectUri?: string;
  language?: Language;
  isLoading?: boolean;
}

export const GithubConnect: React.FC<GithubConnectProps> = ({
  loginWithOAuth,
  loginWithToken,
  redirectUri,
  language = "ar",
  isLoading,
}) => {
  const t = TRANSLATIONS[language];
  const [patInput, setPatInput] = useState("");

  const handlePatLogin = async () => {
    if (!patInput.trim()) return;
    const success = await loginWithToken(patInput.trim());
    if (success) setPatInput("");
  };

  return (
    <ScrollView contentContainerStyle={styles.authContainer}>
      <FolderGit size={64} color={COLORS.primary} style={{ marginBottom: 16 }} />
      <Text style={styles.authTitle}>{t.connect_github}</Text>

      <TouchableOpacity style={styles.oauthBtn} onPress={loginWithOAuth} disabled={isLoading}>
        <Text style={styles.oauthBtnText}>
          {isLoading ? t.authenticating : t.github_oauth}
        </Text>
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t.or_pat}</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.patForm}>
        <View style={styles.inputWrapper}>
          <Key size={16} color={COLORS.textDim} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.patInput}
            value={patInput}
            onChangeText={setPatInput}
            placeholder={t.paste_pat}
            placeholderTextColor={COLORS.textDim}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity
          style={[styles.patBtn, (!patInput.trim() || isLoading) && styles.disabledBtn]}
          onPress={handlePatLogin}
          disabled={!patInput.trim() || isLoading}
        >
          <Text style={styles.patBtnText}>{t.authenticate}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  authContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  authTitle: {
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.heading1,
    color: COLORS.primary,
    marginBottom: 24,
  },
  oauthBtn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 16,
  },
  oauthBtnText: { color: "#0E0E0E", fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.body },
  dividerRow: { flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.small,
    marginHorizontal: 12,
  },
  patForm: { width: "100%" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  patInput: { flex: 1, color: COLORS.text, fontFamily: FONTS.mono, fontSize: FONT_SIZES.body },
  patBtn: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.primaryDim,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  patBtnText: { color: COLORS.primaryDim, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.body },
  disabledBtn: { opacity: 0.5 },
});
