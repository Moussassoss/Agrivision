# CropVana — Mobile App

React Native / Expo mobile app for CropVana — an AI-powered crop recommendation system for smallholder farmers in Rwanda.

---

## Features

- **AI Crop Recommendations** — top 3 crops ranked by confidence, based on your GPS location
- **Satellite Soil Data** — nitrogen, phosphorus, potassium, pH fetched from iSDAsoil at 30 m resolution
- **Live Weather** — current temperature, humidity, and 10-year rainfall average from OpenWeather + NASA POWER
- **Planting Guide** — step-by-step growing instructions for 21 crops
- **Fertilizer Advice** — tailored NPK fertilizer recommendations per crop
- **History** — full log of past recommendations with soil and weather data
- **Dark Mode** — full system-aware dark theme
- **Bilingual** — English and Kinyarwanda (Ikinyarwanda) with in-app language toggle
- **Onboarding** — illustrated first-launch flow
- **Offline-aware** — graceful error states when API is unreachable

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Language | TypeScript |
| Navigation | React Navigation 7 (Stack) |
| State | React Context API (Auth, Theme, Language, Onboarding) |
| Secure storage | expo-secure-store (JWT token) |
| Persistent prefs | @react-native-async-storage/async-storage |
| Localisation | react-i18next + i18next |
| Location | expo-location |
| HTTP | fetch (native) |
| Icons | Expo vector icons |

---

## App Structure

```
mobile/
├── App.tsx                        # Root: providers + navigation guard
├── app.json                       # Expo config (App Store metadata)
├── eas.json                       # EAS Build / Submit config
├── src/
│   ├── context/
│   │   ├── AuthContext.tsx        # JWT auth state
│   │   ├── ThemeContext.tsx       # Dark / light mode
│   │   ├── LanguageContext.tsx    # EN / RW toggle
│   │   └── OnboardingContext.tsx  # First-launch flag (AsyncStorage)
│   ├── screens/
│   │   ├── OnboardingScreen.tsx   # First-launch illustrated slides
│   │   ├── WelcomeScreen.tsx      # Login / Register entry
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── ForgotPasswordScreen.tsx
│   │   ├── HomeScreen.tsx         # GPS scan + recommendation trigger
│   │   ├── ResultScreen.tsx       # Top 3 crops with confidence bars
│   │   ├── HistoryScreen.tsx      # Past recommendation log
│   │   ├── PlantingGuideScreen.tsx# Step-by-step crop guides
│   │   ├── HowItWorksScreen.tsx   # ML pipeline explainer
│   │   └── ProfileScreen.tsx      # Account info + settings
│   ├── i18n/
│   │   ├── en.json                # English strings
│   │   └── rw.json                # Kinyarwanda strings
│   └── api/
│       └── client.ts              # Typed API wrapper (base URL, JWT inject)
└── assets/
    ├── icon.png                   # App icon (1024×1024)
    ├── splash-icon.png            # Splash screen
    └── adaptive-icon.png          # Android adaptive icon
```

---

## Navigation Flow

```
App start
   │
   ├─ AsyncStorage: onboarded?
   │      │
   │      ├── NO  ──► OnboardingScreen
   │      │
   │      └── YES ──► SecureStore: JWT token?
   │                      │
   │                      ├── YES ──► HomeScreen (authenticated stack)
   │                      │            ├── ResultScreen
   │                      │            ├── HistoryScreen
   │                      │            ├── PlantingGuideScreen
   │                      │            ├── HowItWorksScreen
   │                      │            └── ProfileScreen
   │                      │
   │                      └── NO  ──► WelcomeScreen (unauthenticated stack)
   │                                   ├── LoginScreen
   │                                   ├── RegisterScreen
   │                                   └── ForgotPasswordScreen
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo`
- iOS Simulator (macOS only) or Android Emulator, or the **Expo Go** app on a physical device

### 1 — Install dependencies

```bash
cd mobile
npm install
```

### 2 — Configure the API URL

Open `src/api/client.ts` and set your backend URL:

```ts
const BASE_URL = "https://cropvana-api.onrender.com";  // production
// or for local development:
// const BASE_URL = "http://192.168.x.x:8000";
```

### 3 — Start

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `i` for iOS simulator / `a` for Android emulator.

---

## Building for Production

This project uses [EAS Build](https://docs.expo.dev/build/introduction/).

### Setup EAS (first time)

```bash
npm install -g eas-cli
eas login
eas build:configure
```

Update `eas.json` with your Apple credentials:
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your@apple.id",
      "ascAppId": "your_app_store_connect_app_id",
      "appleTeamId": "your_team_id"
    }
  }
}
```

### Build for iOS (App Store)

```bash
eas build --platform ios --profile production
```

### Submit to App Store

```bash
eas submit --platform ios --profile production
```

### Build for Android

```bash
eas build --platform android --profile production
```

---

## App Store Requirements Checklist

Before submitting to Apple App Store Review, ensure:

- [ ] `app.json` — `bundleIdentifier` is unique and registered in App Store Connect
- [ ] `app.json` — `extra.eas.projectId` is set (run `eas build:configure` to get it)
- [ ] `eas.json` — Apple ID, ASC App ID, and Team ID are filled in
- [ ] App icons are 1024×1024 px PNG, no alpha channel, no rounded corners
- [ ] Privacy Policy is publicly accessible at the URL in `app.json > extra.privacyPolicyUrl`
- [ ] Privacy Policy URL is added in App Store Connect under App Information
- [ ] Age rating is set correctly in App Store Connect (this app: 4+)
- [ ] App screenshot set prepared for all required device sizes
- [ ] `usesNonExemptEncryption: false` is confirmed in `app.json` (the app uses only HTTPS, which is standard)

---

## Supported Crops (21)

avocado · banana · blackgram · cassava · coconut · coffee · kidneybeans · lentil · maize · mango · orange · papaya · potato · rice · sorghum · soybean · sweetpotato · tea · tomato · watermelon · wheat

---

## Localisation

The app ships with full translations in:
- **English** (`src/i18n/en.json`)
- **Kinyarwanda / Ikinyarwanda** (`src/i18n/rw.json`)

Language is persisted to AsyncStorage and can be toggled from the Profile screen.
To add a new language: add a JSON file to `src/i18n/` and register it in `LanguageContext.tsx`.
