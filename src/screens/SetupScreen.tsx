import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Linking,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react-native";
import { COLORS, FONTS } from "../constants/theme";

import { AppBrand } from "../components/AppBrand";

interface SetupScreenProps {
  onConnect: (key: string) => void;
}

export const SetupScreen = ({ onConnect }: SetupScreenProps) => {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleConnect = () => {
    if (!key.trim()) return;
    onConnect(key.trim());
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
          <AppBrand fontSize={10} style={styles.brandContainer} />

          <View style={styles.form}>
            <Text style={styles.label}>ENTER_API_KEY:</Text>

            <View style={styles.inputRow}>
              <TextInput
                value={key}
                onChangeText={setKey}
                secureTextEntry={!showKey}
                placeholder="SK-OR-..."
                placeholderTextColor="#333333"
                style={styles.input}
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
              />
              <TouchableOpacity
                onPress={() => setShowKey(!showKey)}
                style={styles.eyeButton}
              >
                {showKey ? (
                  <EyeOff size={18} color={COLORS.primary} />
                ) : (
                  <Eye size={18} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleConnect}
              disabled={!key.trim()}
              activeOpacity={0.8}
              style={[
                styles.connectButton,
                !key.trim() && styles.connectDisabled,
              ]}
            >
              <Text style={styles.connectText}>CONNECT</Text>
            </TouchableOpacity>

            <View style={styles.linkWrap}>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(
                    process.env.EXPO_PUBLIC_OPENROUTER_KEYS_URL || "",
                  )
                }
              >
                <Text style={styles.linkText}>GET KEY: openrouter.ai</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  inner: {
    alignItems: "center",
  },
  brandContainer: {
    marginBottom: 32,
  },
  ascii: {
    color: COLORS.primary,
    fontFamily: FONTS.mono,
    fontSize: 8,
    lineHeight: 9,
    marginBottom: 32,
  },
  form: {
    width: "100%",
    maxWidth: 400,
  },
  label: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: 13,
    height: 40,
    padding: 0,
  },
  eyeButton: {
    marginLeft: 12,
  },
  connectButton: {
    width: "100%",
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    opacity: 1,
  },
  connectDisabled: {
    opacity: 0.3,
  },
  connectText: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: 15,
  },
  linkWrap: {
    marginTop: 32,
    alignItems: "center",
  },
  linkText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: 10,
    textDecorationLine: "underline",
  },
});
