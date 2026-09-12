# ONDOQ — Supabase production database

Supabase project created for ONDOQ Clinic:
- Project ref: `bzhowxsseybvcwrhipta`
- Region: `eu-central-1`
- Project URL: `https://bzhowxsseybvcwrhipta.supabase.co`

The ONDOQ PostgreSQL schema has been provisioned in this project and verified.

## Backend connection
The current ONDOQ backend uses `pg` and `DATABASE_URL`. Set `DATABASE_URL` in the backend deployment to the Supabase PostgreSQL connection string from the Supabase dashboard. Do not put the database password in source control.

## Frontend
The publishable Supabase URL/key may be used only for client-side Supabase features. Never expose a service-role/secret key in the mobile app.

## Security
All public tables have Row Level Security enabled. The ONDOQ API currently owns authorization in the Express backend, so no anonymous/authenticated Data API policies are granted to the tables.

## Plans seeded
- أساسي — 299 EGP/month
- احترافي — 699 EGP/month
- مؤسسات — 1499 EGP/month
