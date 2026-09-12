# ONDOQ Android cloud build

The repository includes `.github/workflows/android-build.yml`.

It builds a debug APK on GitHub Actions whenever mobile code changes on `main`, or when manually dispatched.

Artifact: `ondoq-debug-apk`.

This workflow intentionally produces a debug APK for device testing. A Google Play release AAB requires a release signing key and GitHub Actions secrets; no signing credentials are stored in the repository.
