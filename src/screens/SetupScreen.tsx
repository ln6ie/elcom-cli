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
import { COLORS, FONTS, FONT_SIZES, isTablet } from "../constants/theme";
import { AppBrand } from "../components/AppBrand";

type Provider = "openrouter" | "opencode";
type Step = { text: string; url?: string };

interface SetupScreenProps {
  onConnect: (key: string, lang: "ar" | "en", provider: Provider) => void;
}

const INSTRUCTIONS: Record<string, Record<Provider, { title: string; placeholder: string; stepsTitle: string; steps: Step[] }>> = {
  ar: {
    openrouter: {
      title: "أدخل مفتاح OpenRouter API:",
      placeholder: "sk-or-v1-...",
      stepsTitle: "خطوات الحصول على مفتاح API مجاناً:",
      steps: [
        { text: "1. اذهب إلى", url: "https://openrouter.ai/keys" },
        { text: "2. قم بإنشاء حساب جديد (بثواني عن طريق Google أو إيميل)." },
        { text: "3. اذهب لتبويب المطورين ثم انقر على زر (Create Key)." },
        { text: "4. انسخ المفتاح المتولد بالكامل (sk-or-...) والصقه في الحقل أعلى." },
      ],
    },
    opencode: {
      title: "أدخل مفتاح OpenCode API:",
      placeholder: "oc_...",
      stepsTitle: "خطوات الحصول على مفتاح API:",
      steps: [
        { text: "1. اذهب إلى", url: "https://opencode.ai/auth" },
        { text: "2. سجل الدخول بحساب GitHub أو Google." },
        { text: "3. أضف تفاصيل الدفع (أو استخدم الرصيد المجاني إن وجد)." },
        { text: "4. انسخ المفتاح المتولد والصقه في الحقل أعلى." },
      ],
    },
  },
  en: {
    openrouter: {
      title: "ENTER OPENROUTER API KEY:",
      placeholder: "sk-or-v1-...",
      stepsTitle: "STEPS TO GET YOUR FREE API KEY:",
      steps: [
        { text: "1. Go to", url: "https://openrouter.ai/keys" },
        { text: "2. Create a free account (via Google or Email in seconds)." },
        { text: "3. Go to Keys tab and click the (Create Key) button." },
        { text: "4. Copy the generated key (starts with sk-or-...) and paste it above." },
      ],
    },
    opencode: {
      title: "ENTER OPENCODE API KEY:",
      placeholder: "oc_...",
      stepsTitle: "STEPS TO GET YOUR API KEY:",
      steps: [
        { text: "1. Go to", url: "https://opencode.ai/auth" },
        { text: "2. Sign in with GitHub or Google." },
        { text: "3. Add billing details (or use free credits if available)." },
        { text: "4. Copy the generated key and paste it above." },
      ],
    },
  },
};

export const SetupScreen = ({ onConnect }: SetupScreenProps) => {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [provider, setProvider] = useState<Provider>("openrouter");
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
    onConnect(key.trim(), lang, provider);
  };

  const t = INSTRUCTIONS[lang];

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
          <AppBrand fontSize={isTablet ? 14 : 10} style={styles.brandContainer} />

          <View style={styles.form}>
            {/* Provider Toggle */}
            <View style={styles.providerRow}>
              <TouchableOpacity
                style={[styles.providerBtn, provider === "openrouter" && styles.activeProvider]}
                onPress={() => setProvider("openrouter")}
              >
                <Text style={[styles.providerBtnText, provider === "openrouter" && styles.activeProviderText]}>OpenRouter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.providerBtn, provider === "opencode" && styles.activeProvider]}
                onPress={() => setProvider("opencode")}
              >
                <Text style={[styles.providerBtnText, provider === "opencode" && styles.activeProviderText]}>OpenCode</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>{t[provider].title}</Text>

            <View style={styles.inputRow}>
              <TextInput
                value={key}
                onChangeText={setKey}
                secureTextEntry={!showKey}
                placeholder={t[provider].placeholder}
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
              <Text style={styles.stepsHeader}>{t[provider].stepsTitle}</Text>
              {t[provider].steps.map((step, idx) => (
                step.url ? (
                  <Text key={idx} style={styles.stepText}>
                    {step.text}{" "}
                    <Text style={styles.stepLink} onPress={() => Linking.openURL(step.url!)}>
                      {step.url}
                    </Text>
                  </Text>
                ) : (
                  <Text key={idx} style={styles.stepText}>
                    {step.text}
                  </Text>
                )
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
              <Text style={styles.connectText}>{lang === "ar" ? "اتصال ومزامنة" : "CONNECT & SYNC"}</Text>
            </TouchableOpacity>


          </View>
        </Animated.View>
      </ScrollView>

      {/* Floating Language Toggle */}
      <View style={styles.floatingLang}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  floatingLang: {
    position: "absolute",
    top: 50,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 3,
    zIndex: 100,
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  langBtnText: {
    color: COLORS.textDim,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.small,
  },
  activeLang: {
    backgroundColor: COLORS.primary,
  },
  activeLangText: {
    color: "#0E0E0E",
  },
  langSeparator: {
    color: COLORS.border,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.small,
    marginHorizontal: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 4,
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
  providerRow: {
    flexDirection: "row",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  providerBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  activeProvider: {
    backgroundColor: COLORS.primary,
  },
  providerBtnText: {
    color: COLORS.textDim,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.small,
  },
  activeProviderText: {
    color: "#0E0E0E",
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
  stepLink: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    textDecorationLine: "underline",
  },
});
