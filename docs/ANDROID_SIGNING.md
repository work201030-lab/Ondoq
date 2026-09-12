# Android signing for Google Play

The GitHub Actions release workflow expects these repository secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Use a dedicated upload key and keep the keystore out of Git. Google Play App Signing can protect the app-signing key while you use this upload key for releases.

The workflow builds against Android API 36, prepares the ONDOQ icon, signs the AAB, verifies the signature, and uploads the AAB as a workflow artifact.
