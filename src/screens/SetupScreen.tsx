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
import { Eye, EyeOff, Globe } from "lucide-react-native";
import { COLORS, FONTS, FONT_SIZES, isTablet } from "../constants/theme";
import { AppBrand } from "../components/AppBrand";

interface SetupScreenProps {
  onConnect: (key: string, lang: "ar" | "en") => void;
}

const INSTRUCTIONS = {
  ar: {
    title: "أدخل مفتاح واجهة البرمجة (API Key):",
    connect: "اتصال ومزامنة",
    getKey: "الذهاب لإنشاء مفتاح: openrouter.ai",
    stepsTitle: " خطوات الحصول على مفتاح API مجاناً:",
    steps: [
      "1. انقر على الرابط في الأسفل لفتح موقع OpenRouter الرسمي.",
      "2. قم بإنشاء حساب جديد (بثواني عن طريق Google أو إيميل).",
      "3. اذهب لتبويب المطورين ثم انقر على زر (Create Key).",
      "4. انسخ المفتاح المتولد بالكامل (sk-or-...) والصقه في الحقل أعلاه."
    ]
  },
  en: {
    title: "ENTER OPENROUTER API KEY:",
    connect: "CONNECT & SYNC",
    getKey: "CREATE API KEY: openrouter.ai ",
    stepsTitle: " STEPS TO GET YOUR FREE API KEY:",
    steps: [
      "1. Click the link below to open the official OpenRouter website.",
      "2. Create a free account (via Google or Email in seconds).",
      "3. Go to Keys tab and click the (Create Key) button.",
      "4. Copy the generated key (starts with sk-or-...) and paste it above."
    ]
  }
} as const;

export const SetupScreen = ({ onConnect }: SetupScreenProps) => {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [lang, setLang] = useState<"ar" | "en">("ar");
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
    onConnect(key.trim(), lang);
  };

  const t = INSTRUCTIONS[lang];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Small Dynamic Language Toggle */}
      <View style={styles.langHeader}>
        <Globe size={14} color={COLORS.primaryDim} style={{ marginRight: 6 }} />
        <TouchableOpacity
          onPress={() => setLang("ar")}
          style={[styles.langBtn, lang === "ar" && styles.activeLang]}
        >
          <Text style={[styles.langBtnText, lang === "ar" && styles.activeLangText]}>العربية</Text>
        </TouchableOpacity>
        <Text style={styles.langSeparator}>|</Text>
        <TouchableOpacity
          onPress={() => setLang("en")}
          style={[styles.langBtn, lang === "en" && styles.activeLang]}
        >
          <Text style={[styles.langBtnText, lang === "en" && styles.activeLangText]}>EN</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
          <AppBrand fontSize={isTablet ? 14 : 10} style={styles.brandContainer} />

          <View style={styles.form}>
            <Text style={styles.label}>{t.title}</Text>

            <View style={styles.inputRow}>
              <TextInput
                value={key}
                onChangeText={setKey}
                secureTextEntry={!showKey}
                placeholder="sk-or-v1-..."
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

            {/* Step-by-Step Instructions Container */}
            <View style={styles.stepsContainer}>
              <Text style={styles.stepsHeader}>{t.stepsTitle}</Text>
              {t.steps.map((step, idx) => (
                <Text key={idx} style={styles.stepText}>
                  {step}
                </Text>
              ))}
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
              <Text style={styles.connectText}>{t.connect}</Text>
            </TouchableOpacity>

            <View style={styles.linkWrap}>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(
                    process.env.EXPO_PUBLIC_OPENROUTER_KEYS_URL || "https://openrouter.ai/keys",
                  )
                }
              >
                <Text style={styles.linkText}>{t.getKey}</Text>
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
  langHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  langBtnText: {
    color: COLORS.textDim,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.small,
  },
  activeLang: {
    backgroundColor: "rgba(0, 224, 163, 0.1)",
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  activeLangText: {
    color: COLORS.success,
  },
  langSeparator: {
    color: COLORS.border,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.small,
    marginHorizontal: 4,
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
    marginBottom: 24,
  },
  form: {
    width: "100%",
    maxWidth: 400,
  },
  label: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.label,
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
    marginBottom: 20,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.body,
    height: 40,
    padding: 0,
  },
  eyeButton: {
    marginLeft: 12,
  },
  stepsContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 24,
  },
  stepsHeader: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.label,
    marginBottom: 12,
  },
  stepText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.small,
    lineHeight: Math.round(FONT_SIZES.small * 1.6),
    marginBottom: 8,
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
    fontSize: FONT_SIZES.body,
  },
  linkWrap: {
    marginTop: 24,
    alignItems: "center",
  },
  linkText: {
    color: COLORS.text,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.label,
    textDecorationLine: "underline",
  },
});
