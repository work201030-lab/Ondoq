# أوندوك SaaS — دليل التشغيل والنشر

## 1. تشغيل الباك إند محليًا
```bash
cd backend
cp .env.example .env    # املأ المفاتيح
npm install
# أنشئ قاعدة بيانات Postgres ونفّذ عليها:
psql -d clinic_saas -f ../database/schema.sql
npm run dev
```

## 2. استضافة حقيقية (اختر واحد، كلها بتدعم Postgres وNode مباشرة)
| المنصة | التكلفة الشهرية التقريبية | ملاحظات |
|---|---|---|
| Railway | من 5$ | الأسهل للبدء |
| Render | من 7$ | يدعم قاعدة بيانات مُدارة |
| DigitalOcean App Platform | من 12$ | تحكم أوسع |

بعد الرفع هتاخد رابط API ثابت (مثلاً `api.3yadty.com`) تستخدمه بدل `localhost` في التطبيق.

## 3. الدفع الأونلاين — الخطوات الفعلية
1. **Paymob** (الأنسب لمصر): سجّل تجاري على accept.paymob.com، فعّل باقة "Online Card"، هتاخد الموافقة عادة خلال 3-7 أيام عمل بعد تقديم الأوراق (سجل تجاري/سجل ضريبي).
2. أضف المفاتيح في `.env`.
3. اختبر بالكروت التجريبية اللي بيوفرها Paymob قبل التفعيل الحقيقي.
4. **الدفع حاليًا عبر Paymob فقط**، وStripe غير مطلوب لتشغيل النظام.

## 4. SMS و واتساب
- **SMS (Twilio)**: تسجيل فوري، شحن رصيد، رقم مصري يحتاج طلب "Sender ID" مسجل عشان الرسايل ما توقفش كـ سبام (يومين تقريبًا).
- **واتساب (Meta Cloud API)**: تسجيل Meta Business + رقم تليفون مخصص لا يُستخدم على واتساب عادي + **قوالب رسائل معتمدة من Meta** (مثال: "appointment_confirmation") — الموافقة على القالب بتاخد من ساعات لـ 2-3 أيام. لازم تلتزم بسياسة Meta: ما ترسلش رسائل تسويقية بدون موافقة المستخدم.

## 5. اشتراك العيادات الشهري (SaaS Billing)
النظام جاهز في `schema.sql` (جداول subscription_plans/subscriptions/subscription_invoices) وفي `routes/subscriptions.js`:
- فترة تجريبية 14 يوم تلقائية عند التسجيل
- تجديد شهري عبر webhook من Paymob (`/webhooks/paymob/subscription`)
- لو حبيت تشغيل تلقائي بالكامل (تجديد بدون تدخل يدوي)، استخدم **Paymob Subscriptions API** أو **Stripe Billing** بدل الفوترة اليدوية.

## 6. تحويل التطبيق لتطبيق موبايل (Android + iOS)
التطبيق الحالي HTML/JS، وأسرع طريق لنشره كتطبيق حقيقي بدون إعادة بناء الواجهة من الصفر:

**الخيار المُوصى به: Capacitor** (يغلّف نفس الواجهة في تطبيق أصلي حقيقي)
```bash
npm install @capacitor/core @capacitor/cli
npx cap init "أوندوك" "com.ondoq.clinic"
npx cap add android
npx cap add ios
npx cap sync
```

### Google Play
- حساب مطوّر: **25$ مرة واحدة**
- `npx cap open android` → Build → Generate Signed Bundle (.aab)
- ارفع على Google Play Console، املأ بيانات الخصوصية (لازم سياسة خصوصية حقيقية لأنك بتجمع بيانات مرضى)
- المراجعة عادة **يوم لـ 3 أيام**

### Apple App Store
- حساب Apple Developer: **99$/سنة**
- **لازم جهاز Mac** لفتح Xcode والتوقيع والرفع (أو خدمة CI سحابية زي Codemagic/EAS لو مفيش Mac)
- `npx cap open ios` → Archive → Upload to App Store Connect
- المراجعة عادة **1-3 أيام**، وقد تُرفض أول مرة لو الخصوصية أو صلاحيات البيانات مش موضحة بدقة

### بيانات حساسة (تنبيه مهم)
بما إن التطبيق هيجمع بيانات مرضى (اسم، تليفون، حالة صحية أحيانًا في الملاحظات)، المتجرين هيطلبوا:
- سياسة خصوصية منشورة برابط عام
- تشفير البيانات أثناء النقل (HTTPS إجباري)
- في مصر: مراعاة **قانون حماية البيانات الشخصية المصري** إذا كنت بتخزن بيانات مرضى فعليين

## 7. الميزانية التقديرية الشهرية لبدء التشغيل
| البند | التكلفة |
|---|---|
| استضافة الباك إند + قاعدة البيانات | ~$10-15 |
| SMS (حسب الحجم) | ~$0.01-0.03 لكل رسالة |
| واتساب (Meta) | أول 1000 محادثة/شهر مجانية تقريبًا ثم تسعير لكل محادثة |
| Paymob | بدون اشتراك شهري غالبًا، عمولة % على كل معاملة (~2.5-3%) |
| Apple Developer | $99/سنة |
| Google Play | $25 مرة واحدة |

## 8. الخطوات التالية المقترحة بالترتيب
1. شغّل الباك إند محليًا واختبر تدفق الحجز كامل
2. سجّل حساب Paymob وابدأ إجراءات التفعيل (الأبطأ زمنيًا فابدأ بيه بدري)
3. استضف الباك إند على Railway/Render
4. غلّف الواجهة بـ Capacitor واختبر على جهاز حقيقي
5. جهّز سياسة الخصوصية وشروط الاستخدام
6. قدّم على المتجرين

## Production / Google Play checklist
- Configure `DATABASE_URL`, `JWT_SECRET`, payment secrets, and `CORS_ORIGIN`.
- Run the hardened schema migration before production.
- Build a separate Android client against `/api`.
- Target Android 16 / API 36 for Google Play submissions from 31 Aug 2026.
- Add a public HTTPS privacy-policy URL and complete Play Console Data safety + Health apps declaration.
- Never ship payment/API secrets inside the Android app.

## Google Maps & nearest clinic
- Clinics can save latitude/longitude from the owner's device using the native Capacitor Geolocation plugin (with browser fallback).
- `GET /api/clinics/nearby?lat=...&lng=...&radiusKm=...` returns up to 20 nearby active/trial clinics sorted by Haversine distance.
- The mobile app provides "أقرب عيادة" and opens each clinic in Google Maps for place view or directions.
- This first release uses official Google Maps URLs, so it does **not** require a Google Maps API key for the open/search/directions actions. Google documents Maps URLs as cross-device links for search and directions. citeturn0search1
- If we later add an embedded interactive Google map or Places autocomplete, create a billing-enabled Google Cloud project, enable the relevant Maps/Places SDKs, create and restrict an API key, and keep the key out of source control. citeturn0search0turn0search4turn0search9
