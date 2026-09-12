# ONDOQ V14 — Patient Accounts

Patients can create one global ONDOQ account using their phone number and password.
The account can list appointments across clinics because clinic patient records are matched by normalized phone number.

Endpoints:
- POST /api/patient-auth/register
- POST /api/patient-auth/login
- GET /api/patient-auth/me
- GET /api/patient-auth/appointments
- DELETE /api/patient-auth/account

The clinic booking flow remains available without an account. If the booking phone matches a ONDOQ patient account, the account's display name is refreshed.
