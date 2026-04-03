# ElcomCLI

Mobile CLI-style AI chat application built with React Native and Expo.

## Tech Stack
- **Framework**: Expo SDK 55
- **Styling**: NativeWind v5 (Tailwind CSS v4)
- **API**: OpenRouter (LLM)
- **Icons**: Lucide React Native
- **Storage**: AsyncStorage
- **Animation**: React Native Reanimated

## Features
- Sharp, brutalist terminal aesthetic
- Secure local API key storage
- OpenRouter reasoning support
- Monospace-only typography (SpaceMono)
- Dynamic thinking indicators

## Getting Started
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Start the development server:
   ```bash
   pnpm start
   ```
3. Open on your device or emulator.
4. Obtain an API key from [openrouter.ai](https://openrouter.ai/keys) and enter it in the setup screen.

## Project Structure
- `src/constants/`: Theme and configuration constants.
- `src/types/`: TypeScript definitions and Zod schemas.
- `src/services/`: API client and storage utilities.
- `src/hooks/`: Business logic and state management.
- `src/components/`: Reusable UI components.
- `src/screens/`: Main application screens (Setup, Chat).
- `global.css`: Tailwind CSS v4 styling rules.
