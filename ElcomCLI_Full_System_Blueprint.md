# ElcomCLI: The Sovereignty Blueprint [2026]

## 1. Project Identity
- **Name**: ElcomCLI
- **Concept**: A high-performance, terminal-inspired AI chat application for Android/iOS.
- **Vision**: Zero-latency, privacy-first, and premium minimalist aesthetics.
- **Domain**: `cli.elcomlab.site` (The entry point for APK downloads and landing page).

---

## 2. Technical Stack
- **Core**: React Native (0.81+) via Expo (SDK 52+).
- **Language**: TypeScript (Strict Mode).
- **Styling**: Tailwind CSS v4 (Integrated via NativeWind) for UI consistency.
- **Database**: Local SQLite (Expo-SQLite) for 100% offline chat history and settings.
- **API**: OpenRouter (Streaming SSE) for model-agnostic AI access.
- **State Management**: Custom React Hooks (no heavy Redux/Zustand needed for this architecture).
- **Package Manager**: `pnpm` (Mandatory - no npm/yarn allowed).

---

## 3. Directory Structure
```text
/
├── App.tsx             # Root entry point, navigation container
├── app.json            # Expo configuration (icons, theme, splash removal)
├── package.json        # Dependencies and build scripts
├── android/            # Native Android project (Gradle configuration)
│   ├── app/build.gradle # Split APK (arm64-v8a) & Signing settings
│   └── gradle.properties # R8/ProGuard obfuscation & Performance flags
├── src/
│   ├── components/     # UI Components (TerminalInput, MessageBubble, etc.)
│   ├── hooks/          # Business logic (useChat, useSettings, useImagePicker)
│   ├── services/       # External integrations (database.ts, openrouter.ts)
│   ├── constants/      # Design tokens (theme.ts), Prompts, and Model Presets
│   ├── types/          # Centralized TypeScript interfaces
│   └── screens/        # Main pages (Chat, History, Settings, Setup)
└── landing_page/       # Web deployment (HTML/JS/APK distribution point)
```

---

## 4. Database Schema (SQLite)
The application uses a persistent encrypted-like storage for absolute privacy.
- **`settings`**: Table for API Keys, Context Length, and AI Temperature.
- **`conversations`**: Metadata for chat sessions (ID, Title, Model used).
- **`messages`**: Multi-modal chat logs (Content, Reasoning/Thoughts, Media URIs).
- **`custom_models`**: User-defined OpenRouter endpoints.

---

## 5. Critical Workflows

### A. Development (Local)
```bash
# Start Metro Bundler with clear cache
pnpm expo start --clear

# Run on Android connected device
pnpm run android
```

### B. Production Build (Android Optimized)
We use a **Hardened Production Pipeline**:
1. **R8/ProGuard**: Enabled in `android/gradle.properties` to obfuscate code (100% code encryption) and shrink size.
2. **APK Splits**: Configured in `android/app/build.gradle` to generate independent APKs per CPU architecture.
3. **Command**:
```bash
export ANDROID_HOME=/path/to/sdk
cd android && ./gradlew assembleRelease
```
*Generated file (Preferred): `android/app/build/outputs/apk/release/app-arm64-v8a-release.apk`*

### C. Git Sync & Web Deployment
```bash
# Copy new APK to public web directory
cp android/app/build/outputs/apk/release/app-arm64-v8a-release.apk landing_page/app.apk

# Final Push
git add .
git commit -m "feat: core system update [VERSION_STAMP]"
git push origin main:main
```

---

## 6. Logic & Safety Features (AI Memory)
- **Reasoning Box**: Only appears if the AI actually sends reasoning/thoughts. Empty thoughts are filtered out at the service layer (`openrouter.ts`).
- **Streaming UI**: Uses `onContentSizeChange` in `ChatScreen.tsx` to freeze scrolling during AI generation so the user can read without "screen jumping".
- **Safety Logs**: OpenRouter error responses (400, 429, etc.) are parsed from JSON into clean terminal-style notifications.
- **RTL Support**: Native RTL (Right-To-Left) is disabled in `AndroidManifest.xml` via `android:supportsRtl="false"` to prevent UI mirroring in Arabic, keeping the terminal aesthetics intact and consistent (LTR).

---

## 7. Future AI Directives
- **Max File Length**: 250 lines (Split if larger).
- **Design Rule**: No shadows, no gradients, Zinc-centric color palette.
- **Code Priority**: Performance over features. Never access `process.env` directly (use Zod validation).
- **Stability**: Never use `npx` or `npm`. ONLY `pnpm`.
