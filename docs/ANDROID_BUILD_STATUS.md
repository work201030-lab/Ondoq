# Android build status — V6

## What is ready
- Capacitor mobile project is configured with application ID `com.ondoq.clinic`.
- Release scripts are included.
- GitHub Actions workflow can install Android 16 / API 36, generate the Android project, sync Capacitor, and build an unsigned release AAB.
- Backend syntax preflight passes.

## Current environment blocker
This execution environment does not have Android SDK/ADB configured, and `npm install` timed out. Therefore an actual AAB cannot honestly be claimed as built here.

## Recommended production build
Run the included GitHub Actions workflow manually (`Android Release Build`) or use Android Studio with Android 16 / API 36 installed. Google Play requires new apps and updates to target API 36+ from August 31, 2026.

## Before Play submission
1. Set a real HTTPS API URL and CORS origin.
2. Set a real privacy/support contact.
3. Publish `public/legal.html#privacy` and `public/legal.html#delete` on the public HTTPS domain.
4. Configure a production PostgreSQL database and secrets.
5. Generate a signed AAB; do not upload an unsigned debug build.
6. Complete Play Console Data safety, account deletion, and Health apps declarations as applicable.
