# أوندوك — خطة الإطلاق الإنتاجي

هذه النسخة هي مرحلة تجهيز ما قبل النشر. لا تُنشر إلى Google Play قبل إكمال العناصر التي تعتمد على بيانات وخدمات المالك.

## يجب ضبطه قبل أول Release

1. `backend/.env`:
   - `DATABASE_URL`
   - `JWT_SECRET` عشوائي قوي
   - `CORS_ORIGIN` بعنوان التطبيق/الموقع الإنتاجي فقط
   - مفاتيح Paymob الحقيقية
   - `PAYMOB_DEFAULT_EMAIL` بريد حقيقي
2. استضافة Backend عبر HTTPS.
3. PostgreSQL إنتاجي وتشغيل `database/schema.sql`.
4. نشر `public/legal.html#privacy` و`public/legal.html#delete` على رابط HTTPS عام.
5. استبدال البريد التجريبي في سياسة الخصوصية ببريد دعم حقيقي.
6. إنشاء Android signing key محفوظ خارج المستودع.
7. بناء AAB Release واستكمال اختبارات تسجيل الدخول، إنشاء عيادة، المرضى، الأطباء، المواعيد، الدفع والحذف.
8. في Play Console: Data Safety، Data deletion، Privacy Policy، Content Rating، وHealth Apps declaration حسب وظائف الإصدار المنشور.

## فحص محلي

```bash
cd backend
npm install
npm test
```

ثم من جذر المشروع:

```bash
./scripts/check-release.sh
```

## ملاحظة أمنية

لا تضع مفاتيح الدفع أو JWT secret أو ملف keystore داخل Git. استخدم Secrets في بيئة الاستضافة وGitHub Actions.

## V17 integrations
- Google Maps, Paymob, Twilio SMS, WhatsApp provider, Cloudinary and OpenAI operations assistant are wired through environment variables.
- AI uses aggregate clinic metrics only and is not a medical diagnosis tool.
- External deletion pages exist for clinic and patient accounts.
- Play Data Safety and Health Apps declaration drafts are included in `docs/`.
