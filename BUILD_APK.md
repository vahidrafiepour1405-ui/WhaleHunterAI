# Android APK build
1. Install Node.js and Expo/EAS CLI in a build environment.
2. Run npm install.
3. Run eas build -p android --profile preview.
4. The project is configured with android.buildType=apk.
5. For live blockchain data, configure the provider secret outside source control.
6. Never commit API keys to this repository.
7. Replace the mock provider only after the live provider credentials are configured.
