# ONDOQ V16 — Production Operations

Implemented without AI/OTP: analytics dashboard, paid revenue metrics, subscription status card, appointment reminders, role enforcement, audit logging hooks, optional Cloudinary public-media storage with automatic delivery optimization, stronger indexes, and operational configuration.

## Roles
- Owner: billing/subscription cancellation, doctor management, clinic media, audit log.
- Receptionist: patient and appointment operations, reminders.

## Reminders
A server worker checks due appointments every 10 minutes by default. It sends an SMS reminder when Twilio is configured and an approved WhatsApp template when the clinic plan permits it and Meta credentials are configured. Duplicate sent reminders are prevented by notification type.

## Media
Clinic/doctor public images can use Cloudinary when `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_UPLOAD_PRESET` are configured. Otherwise the existing local upload fallback remains available. Cloudinary delivery URLs use `f_auto,q_auto`.

## Billing
Paymob remains the only payment gateway in this release. Stripe configuration has been removed from the environment example.

## Globalization
The mobile app retains Arabic/English/French/Spanish/German support. New operational labels fall back to English where a locale-specific string is not yet supplied.

## Remaining deployment requirements
Set real production domains, database credentials, JWT secret, Paymob credentials, notification provider credentials, Cloudinary credentials if desired, and CORS origins. Build/sign the Android AAB in CI with a release keystore.
