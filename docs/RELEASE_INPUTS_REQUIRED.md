# ONDOQ — بيانات الإطلاق المطلوبة منك فقط

الكود تم تجهيزه قدر الإمكان، لكن لا يمكنني اختراع بيانات ملكية أو مفاتيح خدمات. قبل النشر الفعلي أعطني/ضع في بيئة الإنتاج:

1. `PUBLIC_WEB_URL` — دومين HTTPS حقيقي تملكه.
2. `SUPPORT_EMAIL` — بريد دعم حقيقي على الدومين.
3. `DATABASE_URL` — PostgreSQL production.
4. `JWT_SECRET` — سر عشوائي 32+ حرفًا.
5. Paymob: `PAYMOB_API_KEY`, `PAYMOB_HMAC_SECRET`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_IFRAME_ID`.
6. SMS: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` إذا أردت SMS.
7. WhatsApp: إعدادات Meta/Twilio WhatsApp template/provider إذا أردت WhatsApp.
8. Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET` للإعلام العام للعيادة/الأطباء.
9. OpenAI: `OPENAI_API_KEY` لتفعيل مساعد إدارة العيادة. المفتاح يبقى على الخادم فقط.
10. Google Maps: `VITE_GOOGLE_MAPS_API_KEY` إذا أردت Embed API داخل التطبيق؛ روابط Google Maps تعمل بدونه.
11. Google Play Developer account + App signing/keystore عند مرحلة الإصدار.

## مهم
- لا تضع أي Secret داخل تطبيق Android.
- لا تستخدم مفاتيح المثال في الإنتاج.
- مساعد AI الحالي تشغيلي فقط: مواعيد، تذكيرات، توزيع العمل، مؤشرات الأداء. لا يرسل أسماء المرضى أو أرقامهم أو السجلات الطبية إلى النموذج ضمن هذه الوظيفة ولا يقدم تشخيصًا أو وصف علاج.
- بعد وضع الدومين الحقيقي، استبدل الروابط العامة في Play Console بسياسة الخصوصية وحذف الحساب.
