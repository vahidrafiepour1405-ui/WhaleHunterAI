# Build status
The Expo configuration already requests APK artifacts for both preview and production profiles.
Official Expo guidance confirms android.buildType=apk produces an installable APK.
Build command: npx eas-cli@latest build -p android --profile preview --non-interactive
CI workflow: .github/workflows/eas-build.yml
Required CI secret: EXPO_TOKEN
No signing key or API secret is committed to this repository.
