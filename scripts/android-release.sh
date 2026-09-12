#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/mobile"

command -v node >/dev/null || { echo 'Node.js is required'; exit 1; }
command -v npm >/dev/null || { echo 'npm is required'; exit 1; }
command -v java >/dev/null || { echo 'Java is required'; exit 1; }

npm install --no-audit --no-fund
npm run build
if [[ ! -d android ]]; then npx cap add android; fi
npx cap sync android
python3 "$ROOT/scripts/prepare-android-icons.py" || true

python3 - <<'PY'
from pathlib import Path
p=Path('android/app/build.gradle')
if p.exists():
    s=p.read_text()
    s=s.replace('compileSdk = 35', 'compileSdk = 36').replace('compileSdkVersion 35', 'compileSdkVersion 36')
    s=s.replace('targetSdk = 35', 'targetSdk = 36').replace('targetSdkVersion 35', 'targetSdkVersion 36')
    s=s.replace('versionCode 1', 'versionCode 2')
    s=s.replace('versionName \"1.0\"', 'versionName \"1.2.0\"')
    s=s.replace("versionName '1.0'", "versionName '1.2.0'")
    p.write_text(s)
PY

if [[ -n "${ANDROID_HOME:-}" && -x "$ANDROID_HOME/platform-tools/adb" ]]; then
  echo "Android SDK detected: $ANDROID_HOME"
else
  echo 'WARNING: Android SDK not detected. Install Platform 36 + Build Tools 36 before Gradle build.'
fi

cd android
if [[ -x ./gradlew ]]; then
  ./gradlew bundleRelease
else
  echo 'ERROR: Gradle wrapper missing after Capacitor Android generation.'
  exit 1
fi

echo "AAB: $ROOT/mobile/android/app/build/outputs/bundle/release/app-release.aab"
