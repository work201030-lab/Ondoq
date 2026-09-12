# Android Release Configuration

The production Android project should be generated with Capacitor and configured for Google Play's current requirement:

- compileSdk = 36
- targetSdk = 36
- minSdk = 23 (or the minimum supported by the chosen Capacitor version)
- applicationId = com.ondoq.clinic
- versionCode = increment for every Play upload
- versionName = semantic product version

After `npx cap add android`, verify `android/app/build.gradle` (or `.kts`) and set compile/target SDK to 36.

Use Android Studio Meerkat 2024.3.1 or newer with Android SDK Platform 36 and Build Tools 36 installed.

Before release, test:
- login/register
- tenant isolation
- doctor creation
- patient listing
- appointment creation/cancellation
- account deletion
- privacy/deletion URLs over public HTTPS
- Android 16 edge-to-edge and back navigation behavior
