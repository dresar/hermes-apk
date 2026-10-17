# SPECIFICATION 03: CAPACITOR ANDROID BUILD & PACKAGING

## 1. Project Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Language** | TypeScript 5.8+ | End-to-end type safety for JSON-RPC payloads, pets, and UI state |
| **Frontend Framework** | React 19 (`.tsx`) | Component hierarchy, virtualized message feeds, hooks |
| **Styling** | Tailwind CSS v4 | Lightweight utility styles adhering to Anti-Slop tokens |
| **Icons** | Lucide React | Clean, scalable monospace and interface icons |
| **Build Tool** | Vite 6 | Sub-second HMR and production bundle optimization |
| **Mobile Runtime** | Capacitor 7 | Native Android shell, Web-to-Native bridge, APK packaging |
| **Storage Plugin** | `@capacitor/preferences` | Android `EncryptedSharedPreferences` for gateway credentials & pets |
| **Notification Plugin**| `@capacitor/local-notifications`| Native status alerts for background turn completion |
| **Haptics Plugin** | `@capacitor/haptics` | Subtle physical feedback on button taps and approvals |

---

## 2. Directory Structure

```text
hermes-mobile/
├── android/                        # Capacitor Android native project
│   ├── app/
│   │   ├── src/main/AndroidManifest.xml
│   │   └── build.gradle
│   └── gradlew
├── src/
│   ├── api/
│   │   ├── hermes-client.ts        # Typed HTTP & WebSocket client (tui_gateway)
│   │   ├── jsonrpc.ts              # JSON-RPC 2.0 message envelope & batching
│   │   ├── petdex-api.ts           # Manifest fetcher & thumbnail cropper
│   │   └── types.ts                # Session, Model, Pet, Approval, Request types
│   ├── components/
│   │   ├── Header.tsx              # Floating top bar, session & model chips
│   │   ├── Transcript.tsx          # Virtualized message list, code highlighting
│   │   ├── MessageTurn.tsx         # User & Assistant turn renderers
│   │   ├── ThinkingDrawer.tsx      # Collapsible reasoning drawer (reasoning.delta)
│   │   ├── ToolCallCard.tsx        # Inline tool output & status indicator
│   │   ├── Composer.tsx            # Bottom input bar, dictation, attachments
│   │   ├── PetSprite.tsx           # 8x9 Canvas sprite stepper engine
│   │   ├── PetPicker.tsx           # 5,086 Petdex search & gallery bottom sheet
│   │   ├── VibeHearts.tsx          # Affection reaction floating hearts canvas
│   │   ├── ApprovalModal.tsx       # Dangerous action authorization with 300s timer
│   │   ├── ClarifyModal.tsx        # Multi-choice question answering chips
│   │   ├── GoalTracker.tsx         # Autonomous goal tree & loop monitor
│   │   ├── RollbackSheet.tsx       # Pre-mutation Git checkpoints & restore
│   │   ├── GatewayVault.tsx        # Multi-gateway connection manager
│   │   └── ProviderSettings.tsx    # Custom AI provider & key settings form
│   ├── store/
│   │   └── useHermesStore.ts       # Unified Zustand / reactive state store
│   ├── App.tsx                     # Main layout & routing shell
│   ├── index.css                   # Tailwind theme tokens & fluid typography
│   └── main.tsx                    # React application entrypoint
├── capacitor.config.ts             # Capacitor project configuration
├── package.json                    # Node dependencies
├── tsconfig.json                   # Strict TypeScript compiler options
└── vite.config.ts                  # Vite bundler configuration
```

---

## 3. Configuration Files

### 3.1 `capacitor.config.ts`
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.hermes.gateway',
  appName: 'Hermes',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_hermes',
      iconColor: '#ff6347',
    },
  },
};

export default config;
```

### 3.2 `AndroidManifest.xml` (Native Permissions & Cleartext)
Ensure `android/app/src/main/AndroidManifest.xml` includes cleartext traffic support (essential for private Tailscale IP connections) and background capabilities:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_REMOTE_MESSAGING" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Hermes"
        android:usesCleartextTraffic="true"
        android:theme="@style/AppTheme">
        <activity
            android:name=".MainActivity"
            android:label="Hermes"
            android:theme="@style/AppTheme.NoActionBar"
            android:launchMode="singleTask"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|uiMode">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

---

## 4. End-to-End Build & Compilation Pipeline

Run these commands in order to build `HERMES.APK`:

### Step 1: Install Dependencies
```bash
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/preferences @capacitor/local-notifications @capacitor/status-bar @capacitor/network @capacitor/haptics lucide-react clsx tailwind-merge zustand
```

### Step 2: Build Web Production Bundle
```bash
npm run build
```
Generates optimized static web assets inside the `dist/` directory.

### Step 3: Synchronize with Android Native Project
```bash
npx cap add android
npx cap sync android
```
Copies the web build and native plugin bindings into `android/`.

### Step 4: Compile Android APK
Execute Gradle inside the `android/` directory:
```powershell
# On Windows
cd android
.\gradlew.bat assembleDebug
cd ..
Copy-Item android\app\build\outputs\apk\debug\app-debug.apk HERMES.APK
```
Or for an optimized release build:
```powershell
cd android
.\gradlew.bat assembleRelease
cd ..
Copy-Item android\app\build\outputs\apk\release\app-release-unsigned.apk HERMES.APK
```

The compiled output file will be generated directly at the root workspace as:  
`HERMES.APK`
