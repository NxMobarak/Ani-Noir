# 🚀 Building AniNoir APK (Real Native Android App)

## Prerequisites

You need ONE of these on your PC:

### Option A: Android Studio (Easiest — GUI)
- Download: https://developer.android.com/studio
- Free, works on Windows/Mac/Linux

### Option B: Command Line Only (No Android Studio)
- Install JDK 17: https://adoptium.net/
- Install Android SDK command-line tools: https://developer.android.com/studio#command-line-tools-only

---

## Method 1: Using Android Studio (Recommended)

### Step 1: Pull the repo and open project

```bash
git clone https://github.com/NxMobarak/Ani-Noir.git
cd Ani-Noir
npm install
npm run build
npx cap sync android
```

### Step 2: Open in Android Studio

```bash
npx cap open android
```

This opens the `android/` folder in Android Studio.

### Step 3: Generate Signed APK

1. Wait for Gradle sync to finish (bottom progress bar)
2. Go to **Build → Generate Signed Bundle / APK**
3. Select **APK** → Next
4. Click **Create new...** (first time only):
   - Key store path: Choose a location (e.g., `~/aninoir-key.jks`)
   - Password: Create a strong password (SAVE THIS!)
   - Key alias: `aninoir`
   - Key password: Same or different password
   - Fill in at least one field (your name)
   - Click OK
5. Select **release** build type → Next
6. Click **Create**

Your APK will be at:
```
android/app/release/app-release.apk
```

### Step 4: Install on your phone

- Transfer APK to your phone
- Tap to install (enable "Install from unknown sources" if prompted)
- Done! It's a real native app now.

---

## Method 2: Command Line (No Android Studio)

### Step 1: Build the web app

```bash
npm install
npm run build
npx cap sync android
```

### Step 2: Generate debug APK (for testing)

```bash
cd android
./gradlew assembleDebug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 3: Generate release APK (for distribution)

```bash
# Create a signing key (one-time)
keytool -genkey -v -keystore ~/aninoir-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias aninoir

# Build release
cd android
./gradlew assembleRelease
```

Before running release, add signing config to `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file(System.getenv("HOME") + "/aninoir-key.jks")
            storePassword "YOUR_PASSWORD"
            keyAlias "aninoir"
            keyPassword "YOUR_PASSWORD"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

---

## Method 3: GitHub Actions (Build in Cloud — No Local Setup!)

Add this file to your repo as `.github/workflows/build-apk.yml`:

```yaml
name: Build Android APK

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Install dependencies
        run: npm install

      - name: Build web app
        run: npm run build

      - name: Sync Capacitor
        run: npx cap sync android

      - name: Make gradlew executable
        run: chmod +x android/gradlew

      - name: Build Debug APK
        run: |
          cd android
          ./gradlew assembleDebug

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: AniNoir-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

After pushing, go to GitHub → Actions tab → Download the APK artifact!

---

## 📱 Publishing the APK

| Store | Fee | Steps |
|---|---|---|
| **Direct share** | Free | Send APK to anyone, they install it |
| **Amazon Appstore** | Free | Upload APK at developer.amazon.com |
| **Samsung Galaxy Store** | Free | Upload APK at seller.samsungapps.com |
| **Huawei AppGallery** | Free | Upload APK at developer.huawei.com |
| **Google Play** | $25 | Upload AAB at play.google.com/console |

### To generate AAB (for Google Play):

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

---

## ⚠️ Important Notes

1. **NEVER lose your keystore file** (`aninoir-key.jks`) — you can't update your app without it
2. **Keep your keystore password safe** — write it down somewhere secure
3. **Same keystore** must be used for all future updates
4. The debug APK works for testing but can't be uploaded to stores
5. Your app icon uses the Capacitor default — replace files in `android/app/src/main/res/mipmap-*` with your own icons

---

## 🔄 Updating the App

Whenever you change your code:

```bash
npm run build
npx cap sync android
# Then rebuild APK using any method above
```

---

## ✅ What Makes This Different from PWABuilder

| Feature | PWABuilder (TWA) | Capacitor (This) |
|---|---|---|
| Splash screen | Browser splash | Native dark splash |
| Status bar | Chrome colored | Fully black, immersive |
| Navigation bar | System default | Dark, matches app |
| URL bar flash | Sometimes visible | Never |
| Native APIs | Limited | Full access |
| Feels like | Website in wrapper | Real native app |
