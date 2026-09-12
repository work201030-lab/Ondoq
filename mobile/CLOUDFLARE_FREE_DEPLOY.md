# ONDOQ — Free-first web deployment

## Cloudflare Pages

The mobile web build can be hosted on Cloudflare Pages at a free `*.pages.dev` subdomain. The intended project name is `ondoq`, so the expected address is `https://ondoq.pages.dev` **if that project name is available in your Cloudflare account**. Cloudflare assigns the actual Pages hostname after the first deployment.

### Build settings
- Root directory: `mobile`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=<your API HTTPS URL>`
- Optional: `VITE_PUBLIC_WEB_URL=<your Pages URL>`

### Direct deployment
From `mobile/` after logging in to Cloudflare:

```bash
npx wrangler login
npm run deploy:pages
```

Cloudflare Pages supports direct deployment with `wrangler pages deploy`, and the production site is served from `<PROJECT_NAME>.pages.dev`.

## Important

This makes the **frontend/web address** free. It does not make the Node/PostgreSQL backend automatically free or production-ready. For an initial test environment, Render currently offers free Node web services, but its free services have limitations and free Postgres databases expire after 30 days, so do not use a free Render Postgres database as the permanent production database.

Before Google Play production submission, replace all placeholders for API URL, support email, privacy URL, payment/SMS/WhatsApp credentials, storage, database, and signing keys.
