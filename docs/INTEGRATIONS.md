# ONDOQ integrations map

| Integration | Purpose | Where configured | Status |
|---|---|---|---|
| Google Maps | clinic discovery, directions, optional embedded map | `VITE_GOOGLE_MAPS_API_KEY` | wired |
| Paymob | subscriptions/payments | backend `.env` | wired, credentials required |
| Twilio SMS | reminders | backend `.env` | wired, credentials required |
| WhatsApp provider | appointment reminders | backend `.env` + provider config | wired, credentials/template required |
| Cloudinary | durable public clinic/doctor media | backend `.env` | wired, credentials required |
| OpenAI | clinic operations assistant | `OPENAI_API_KEY`, `OPENAI_MODEL` | wired, optional |
| PostgreSQL | multi-tenant data | `DATABASE_URL` | required |

Secrets are server-side only. Never place Paymob, Twilio, Cloudinary, or OpenAI secret keys in the Android app.
