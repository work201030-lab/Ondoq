# ONDOQ V15 — Patient account hardening

- Added an in-app patient account deletion control.
- Deletion requires an explicit confirmation and clears the local patient session after success.
- Added localized patient-account strings for Arabic, English, French, Spanish and German.
- Kept clinic appointment records separate from the patient login account; clinics may retain records where legally required.
- Removed the unused temporary public-booking route file.

## Production note
Before launch, add phone OTP verification for patient registration/login. Appointment history is currently associated with the patient's normalized phone number, so OTP verification is recommended before exposing historical records in production.
