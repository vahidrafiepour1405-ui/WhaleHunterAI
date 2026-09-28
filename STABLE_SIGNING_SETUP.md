# Stable Android signing setup

WhaleHunterAI release APKs are configured to use a permanent release signing key so future APK updates can install over the existing app without uninstalling it.

GitHub Actions is intentionally manual until the encrypted repository secrets are configured.

Required repository secrets:
- SIGNING_KEYSTORE_BASE64
- SIGNING_STORE_PASSWORD
- SIGNING_KEY_PASSWORD
- SIGNING_KEY_ALIAS

The private keystore must never be committed to this public repository.

After the four secrets are added, run the "Build Whale Hunter AI APK" workflow manually. The resulting v23 APK becomes the new signed baseline. The currently installed v22 debug-signed APK may need to be removed once when moving to this new signing key; after v23 is installed, later versions can update in place.

Keep the keystore and its passwords backed up securely. Losing the release key prevents future APK updates over installations signed with that key.
