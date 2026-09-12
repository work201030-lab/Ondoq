# ONDOQ — Free-first professional email

## Recommended first-stage address

`ondoq.clinic@gmail.com`

This is a free Gmail mailbox and is suitable for the first testing / launch stage when a custom domain has not been purchased yet.

### Important
The account itself cannot be created automatically from the project because Google requires interactive account creation and may require phone / identity verification. Create it manually, then keep the recovery email and phone secured.

Official creation page:
https://accounts.google.com/signup

## Better branded email later

Once ONDOQ owns a domain such as `ondoq.app`, use:

- `support@ondoq.app`
- `privacy@ondoq.app`
- `hello@ondoq.app`

Cloudflare Email Routing can receive messages for custom addresses and forward them to the Gmail inbox for free. Sending as the custom address requires an outbound email provider; Cloudflare's current Email Sending is a paid Workers feature.

## Current project setting

`SUPPORT_EMAIL=ondoq.clinic@gmail.com`

Change it after creating the account if the exact Gmail address is unavailable.
