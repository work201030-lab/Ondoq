# ONDOQ — Paymob Test Mode Setup

## Current test integration
- Paymob mode: Test
- Card Integration ID: `5902404`
- Never commit Secret Key, HMAC Secret, API Key, or other credentials.

## Backend environment
Set these variables in the backend hosting provider:

```env
PAYMOB_BASE_URL=https://accept.paymob.com
PAYMOB_SECRET_KEY=<Paymob Test Secret Key>
PAYMOB_PUBLIC_KEY=<Paymob Test Public Key>
PAYMOB_HMAC_SECRET=<Paymob Test HMAC Secret>
PAYMOB_INTEGRATION_ID_CARD=5902404
APP_URL=https://api.ondoq.app
```

`PAYMOB_API_KEY` may be kept for future reconciliation/transaction-inquiry flows, but it is not used to create payments in the current Intention API flow.

## Payment flow implemented
1. ONDOQ backend creates a Paymob Intention with `POST /v1/intention/`.
2. The backend returns a Unified Checkout URL built from the Public Key + returned client secret.
3. Paymob sends the transaction callback to `POST /webhooks/paymob`.
4. ONDOQ verifies the callback HMAC using SHA-512.
5. Only a verified callback with `success=true` and `pending=false` marks the appointment payment as paid.
6. Browser redirection is UX only; it does not determine payment status.

## URLs after backend deployment
- Transaction webhook: `https://api.ondoq.app/webhooks/paymob`
- Browser return: `https://api.ondoq.app/payment/complete`

## Important
The backend must be deployed publicly before Paymob can call the webhook. Do not paste any Paymob secret into chat, source control, the mobile app, or frontend environment variables.

## Validation performed
- Release syntax checks run after the Paymob changes.
- No Paymob secrets are stored in the project archive.
- The payment-start route keeps its payment reference in scope for failure cleanup.
- Paymob callbacks remain the source of truth and HMAC verification is required before changing payment state.
