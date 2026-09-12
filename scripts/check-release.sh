#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "== ONDOQ Clinic release checks =="
cd "$ROOT/backend"
node --check server.js
node --check routes/auth.js
node --check routes/appointments.js
node --check routes/doctors.js
node --check routes/patients.js
node --check routes/payments.js
node --check routes/subscriptions.js
node --check routes/webhooks.js
node --check services/payment.js
node test.mjs

if grep -Rqs 'https://example.com\|https://api.example.com' "$ROOT/mobile/public" "$ROOT/mobile/src"; then
  echo "ERROR: public/mobile production URLs still contain example.com"
  exit 1
fi

if grep -Rqs 'YOUR_PUBLIC_APP_DOMAIN' "$ROOT/mobile" "$ROOT/docs"; then
  echo "ERROR: production domain placeholder remains"
  exit 1
fi

echo "Release source checks passed. Android SDK/Gradle and production credentials are required for the final AAB build."
