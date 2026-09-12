# أوندوك — Android

واجهة أولية قابلة للتشغيل ومتصلة بـ ONDOQ Clinic API.

## التشغيل
1. `npm install`
2. `npm run dev`
3. للمحاكي Android: `npm run android:add` ثم `npm run android:sync` ثم `npm run android:open`.

قبل الإنتاج غيّر `apiUrl` في localStorage إلى HTTPS API حقيقي، وغيّر package ID إذا لزم.

## Google Play
Target SDK يجب أن يكون 36+ وفق متطلبات Google Play الحالية. لا تطلب أذونات صحية غير لازمة. التطبيق يحتاج Privacy Policy وData Safety وHealth apps declaration.


## قبل النشر
- استبدل صفحة الخصوصية التجريبية بصفحة منشورة على HTTPS ودومين تملكه.
- حدّث بريد الدعم/الخصوصية في سياسة الخصوصية.
- اضبط VITE_API_URL على عنوان API الحقيقي.
- أنشئ مشروع Android عبر Capacitor ثم اضبط target/compile SDK على 36 قبل رفع AAB إلى Google Play.


### Maps
The nearby-clinics screen includes an embedded Google Maps panel. Set `VITE_GOOGLE_MAPS_API_KEY` for the official Embed API experience; otherwise the app falls back to a Google Maps embed URL and always provides full Google Maps links for search and navigation.

### اكتشاف العيادات والحجز
- يمكن للمستخدم البحث حسب المسافة والتخصص وحالة العيادة الآن.
- يمكنه اختيار العيادة ثم الطبيب والتاريخ والموعد والحجز مباشرة.
