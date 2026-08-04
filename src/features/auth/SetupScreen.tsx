import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react-native";
import { COLORS, FONTS, FONT_SIZES, SPACING, isTablet } from "@/constants/theme";
import { AppBrand } from "@/components/AppBrand";
import { OnboardingButton } from "@/components/onboarding/OnboardingButton";
import { OnboardingInput } from "@/components/onboarding/OnboardingInput";
import { OnboardingOptionGroup } from "@/components/onboarding/OnboardingOptionGroup";

export type SetupProvider = "openrouter" | "opencode";
type Step = { text: string; url?: string };

export interface SetupScreenProps {
  onConnect: (key: string, lang: "ar" | "en", provider: SetupProvider) => void | Promise<void>;
  onSkip?: () => void | Promise<void>;
  language?: "ar" | "en";
  onLanguageChange?: (language: "ar" | "en") => void;
  embedded?: boolean;
}

const INSTRUCTIONS: Record<string, Record<SetupProvider, { title: string; placeholder: string; stepsTitle: string; steps: Step[] }>> = {
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

export const SetupScreen = ({ onConnect, onSkip, language, onLanguageChange, embedded = false }: SetupScreenProps) => {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [lang, setLang] = useState<"ar" | "en">(language || "ar");
  const [provider, setProvider] = useState<SetupProvider>("openrouter");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (language) setLang(language);
  }, [language]);

  const handleConnect = () => {
    if (!key.trim()) return;
    onConnect(key.trim(), lang, provider);
  };

  const t = INSTRUCTIONS[lang];
  const changeLanguage = (next: "ar" | "en") => { setLang(next); onLanguageChange?.(next); };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, embedded && styles.embeddedScrollContent]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
          {!embedded ? <AppBrand fontSize={isTablet ? 14 : 10} style={styles.brandContainer} /> : null}

          <View style={[styles.form, embedded && styles.embeddedForm]}>
            {/* Provider Toggle */}
            <OnboardingOptionGroup
              options={[{ id: "openrouter", label: "OpenRouter" }, { id: "opencode", label: "OpenCode" }]}
              selected={provider}
              onSelect={(id) => setProvider(id as SetupProvider)}
              fullBleed={embedded}
            />

            <View style={embedded && styles.embeddedInset}>
              <OnboardingInput
                label={t[provider].title}
                value={key}
                onChangeText={setKey}
                secureTextEntry={!showKey}
                placeholder={t[provider].placeholder}
                language={lang}
                rightAccessory={<TouchableOpacity onPress={() => setShowKey(!showKey)} style={styles.eyeButton}>{showKey ? <EyeOff size={18} color={COLORS.primary} /> : <Eye size={18} color={COLORS.primary} />}</TouchableOpacity>}
              />
            </View>

            {/* Step-by-Step Instructions Container */}
            <View style={[styles.stepsContainer, embedded && styles.embeddedStepsContainer, lang === "ar" && styles.rtlContent]}>
              <Text style={styles.stepsHeader}>{t[provider].stepsTitle}</Text>
              {t[provider].steps.map((step, idx) => (
                step.url ? (
                  <Text key={idx} style={[styles.stepText, lang === "ar" && styles.rtlText]}>
                    {step.text}{" "}
                    <Text style={styles.stepLink} onPress={() => Linking.openURL(step.url!)}>
                      {step.url}
                    </Text>
                  </Text>
                ) : (
                  <Text key={idx} style={[styles.stepText, lang === "ar" && styles.rtlText]}>
                    {step.text}
                  </Text>
                )
              ))}
            </View>

            <View style={embedded && styles.embeddedInset}>
              <OnboardingButton onPress={handleConnect} disabled={!key.trim()} label={lang === "ar" ? "اتصال ومزامنة" : "CONNECT & SYNC"} />
            </View>
            {onSkip ? <OnboardingButton variant="ghost" onPress={onSkip} label={lang === "ar" ? "تخطي الآن" : "SKIP FOR NOW"} /> : null}


          </View>
        </Animated.View>
      </ScrollView>

      {/* Floating Language Toggle */}
      {!embedded ? <View style={styles.floatingLang}>
        <TouchableOpacity
          onPress={() => changeLanguage("ar")}
          style={[styles.langBtn, lang === "ar" && styles.activeLang]}
        >
          <Text style={[styles.langBtnText, lang === "ar" && styles.activeLangText]}>العربية</Text>
        </TouchableOpacity>
        <Text style={styles.langSeparator}>|</Text>
        <TouchableOpacity
          onPress={() => changeLanguage("en")}
          style={[styles.langBtn, lang === "en" && styles.activeLang]}
        >
          <Text style={[styles.langBtnText, lang === "en" && styles.activeLangText]}>EN</Text>
        </TouchableOpacity>
      </View> : null}
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
    paddingTop: 44,
    paddingBottom: 24,
  },
  embeddedScrollContent: { justifyContent: "flex-start", paddingHorizontal: 0, paddingTop: 20, paddingBottom: 24 },
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
  embeddedForm: { maxWidth: undefined },
  embeddedInset: { marginHorizontal: SPACING.md },
  skipButton: { alignItems: "center", paddingVertical: 14, marginTop: 4 },
  skipText: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.small },
  providerRow: {
    flexDirection: "row",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  embeddedProviderRow: { borderWidth: 0, borderBottomWidth: 1, borderRadius: 0, marginBottom: 16 },
  providerBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  embeddedProviderBtn: { borderWidth: 0, backgroundColor: "transparent", paddingVertical: 10 },
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
  embeddedInputRow: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, backgroundColor: COLORS.surface, marginHorizontal: 0, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.md },
  input: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.body,
    height: 40,
    padding: 0,
  },
  rtlInput: { writingDirection: "rtl" },
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
  embeddedStepsContainer: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, borderRadius: 0, backgroundColor: COLORS.surface, marginHorizontal: 0, padding: SPACING.md, marginBottom: SPACING.lg },
  rtlContent: { alignItems: "stretch" },
  rtlText: { textAlign: "right", writingDirection: "rtl" },
  embeddedConnectButton: { backgroundColor: COLORS.primary, borderWidth: 0, paddingVertical: SPACING.md },
  embeddedConnectText: { color: "#001018" },
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
