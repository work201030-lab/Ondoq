# ONDOQ Backend — Render Free deployment

This repository contains a Render Blueprint for the ONDOQ Node/Express backend.

## Required secrets/values in Render
- `DATABASE_URL`: Supabase PostgreSQL connection string
- `JWT_SECRET`: random secret, 32+ characters
- `CORS_ORIGIN`: deployed ONDOQ frontend URL(s), comma-separated
- `APP_URL`: the public backend URL after Render creates it
- `PAYMOB_SECRET_KEY`: Paymob Test Secret Key
- `PAYMOB_PUBLIC_KEY`: Paymob Test Public Key
- `PAYMOB_HMAC_SECRET`: Paymob Test HMAC Secret

`PAYMOB_INTEGRATION_ID_CARD` is already set to `5902404` for Test Mode.

## After deployment
Use the Render public URL as `APP_URL`. Then configure the Paymob transaction callback to:

`<APP_URL>/webhooks/paymob`

The return URL used by ONDOQ is:

`<APP_URL>/payment/complete`

The callback is the source of truth for payment status; ONDOQ verifies Paymob HMAC before changing a payment to successful.
