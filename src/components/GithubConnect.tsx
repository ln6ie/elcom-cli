import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { FolderGit, Key } from "lucide-react-native";
import { COLORS, FONTS, FONT_SIZES } from "../constants/theme";

interface GithubConnectProps {
  loginWithOAuth: () => void;
  loginWithToken: (token: string) => Promise<boolean>;
}

// مكون تسجيل الدخول إلى جيت هاب
export const GithubConnect: React.FC<GithubConnectProps> = ({
  loginWithOAuth,
  loginWithToken,
}) => {
  const [patInput, setPatInput] = useState("");

  // معالجة تسجيل الدخول برمز الوصول الشخصي
  const handlePatLogin = async () => {
    if (!patInput.trim()) return;
    const success = await loginWithToken(patInput.trim());
    if (success) {
      setPatInput("");
    }
  };

  return (
    <View style={styles.authContainer}>
      <FolderGit size={64} color={COLORS.primary} style={{ marginBottom: 16 }} />
      <Text style={styles.authTitle}>CONNECT_GITHUB</Text>
      <Text style={styles.authDesc}>
        Authenticate to pull, edit, and push code repositories directly.
      </Text>

      <TouchableOpacity style={styles.oauthBtn} onPress={loginWithOAuth}>
        <Text style={styles.oauthBtnText}>AUTHENTICATE_WITH_OAUTH</Text>
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR_PAT</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.patForm}>
        <View style={styles.inputWrapper}>
          <Key size={16} color={COLORS.textDim} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.patInput}
            value={patInput}
            onChangeText={setPatInput}
            placeholder="Paste GitHub PAT (ghp_...)"
            placeholderTextColor={COLORS.textDim}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity
          style={[styles.patBtn, !patInput.trim() && styles.disabledBtn]}
          onPress={handlePatLogin}
          disabled={!patInput.trim()}
        >
          <Text style={styles.patBtnText}>CONNECT_WITH_PAT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  authContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, width: "100%" },
  authTitle: {
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.heading1,
    color: COLORS.primary,
    marginBottom: 8,
  },
  authDesc: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.body,
    color: COLORS.textDim,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  oauthBtn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 24,
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
