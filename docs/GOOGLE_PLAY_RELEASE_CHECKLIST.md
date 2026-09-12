# Google Play Release Checklist — أوندوك

## التطبيق
- [ ] اسم الحزمة النهائي: com.ondoq.clinic أو اسم تملكه الشركة.
- [x] Target SDK requirement documented: Android 16 / API 36 or higher.
- [ ] HTTPS API فقط في الإنتاج.
- [ ] إزالة أي مفاتيح سرية من التطبيق.
- [ ] أيقونة 512x512 وAdaptive Icon.
- [ ] Splash Screen.
- [ ] Screenshots للهاتف.
- [ ] وصف عربي وإنجليزي.

## الخصوصية والبيانات
- [ ] Privacy Policy على URL عام HTTPS وليس PDF.
- [ ] رابط الخصوصية داخل التطبيق.
- [ ] Data Safety مكتمل ومتطابق مع التطبيق والـSDKs.
- [x] Account deletion API added for clinic owner; production URL and in-app UI must be finalized.
- [ ] Health apps declaration في Play Console.
- [ ] لا نطلب Health permissions غير الضرورية.

## الاختبار
- [ ] Unit/API tests.
- [ ] اختبار تسجيل الحساب والدخول.
- [ ] اختبار Multi-Tenant.
- [ ] اختبار الحجز المتزامن.
- [ ] اختبار الدفع والـwebhooks.
- [ ] اختبار إلغاء الموعد.
- [ ] اختبار فقدان الشبكة.
- [ ] Closed testing.

## الإصدار
- [ ] Build signed AAB.
- [ ] Internal testing.
- [ ] Closed testing حسب متطلبات حساب Play.
- [ ] Production access.


## Policy notes (verified Sep 2026)
- Google Play requires new apps and updates submitted from 31 Aug 2026 to target Android 16 / API 36 or higher.
- Health-related apps must complete the Health apps declaration.
- A public HTTPS privacy policy is required in Play Console and in the app.
- Apps with account creation need a clear account deletion mechanism and deletion of associated user data.

## Release preflight added in V5
- Run `scripts/check-release.sh` before packaging.
- Do not submit while `example.com` placeholders remain in production configuration.
- Replace the placeholder privacy/support email before submission.
- Build a signed Android App Bundle (AAB), not a debug APK.
