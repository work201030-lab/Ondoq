# ONDOQ V21 — Configuration & Operations

## Single source of truth
Runtime configuration is centralized in `backend/config.js`. Environment templates are maintained in `backend/.env.example` and `mobile/.env.example`.

### Required production variables
`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `APP_URL`.

### Payment variables
Paymob credentials are never committed. Use Test credentials for Test Mode and Live credentials for Live Mode. The card integration ID is configurable via `PAYMOB_INTEGRATION_ID_CARD`.

### Legal/account UX
Use `/legal.html` as the canonical public page for privacy and account deletion. The legacy `/privacy.html`, `/delete-account.html`, and `/patient-delete-account.html` paths redirect to the unified page so existing Google Play links remain valid.

### Release checks
1. Run `npm test` from `backend/`.
2. Run `bash scripts/check-release.sh`.
3. Verify `/health` against the production database.
4. Confirm no real secrets are committed.
5. Publish the canonical legal URL over HTTPS before store submission.

## Superseded documents
`ONDOQ_FREE_FIRST_SETUP.md`, `ONDOQ_V20_FREE_FIRST_STATUS.md`, and `ONDOQ_V20_PAYMOB_TEST_READY.md` describe earlier milestones. This document is the current V21 operational reference.
