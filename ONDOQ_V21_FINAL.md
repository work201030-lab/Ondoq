# ONDOQ V21 Final Hardening

- Centralized backend configuration in `backend/config.js`.
- Production requires DATABASE_URL, JWT_SECRET, CORS_ORIGIN and HTTPS APP_URL.
- Localhost CORS exceptions are disabled in production.
- Upload directory and reminder-worker settings use centralized config.
- Mobile release no longer hardcodes an emulator API URL.
- Unified legal/privacy/delete pages remain available, with legacy URLs preserved as redirects.
- Mobile branding uses the ONDOQ icon instead of the legacy placeholder letter.
- Release smoke tests include configuration and production-safety checks.

Production secrets remain external environment variables and are not committed.
