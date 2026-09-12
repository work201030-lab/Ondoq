# ONDOQ V13 — Global, Ratings & Media

## Ratings
- Reviews are accepted only for appointments whose status is `completed`.
- Each appointment has a unique review token and can receive one review.
- Clinic and doctor aggregate ratings are returned in discovery and doctor lists.
- Clinic owners/receptionists can mark appointments completed.

## Images
- Clinic logo/cover image upload: JPG/PNG/WebP, max 5 MB.
- Clinic gallery: up to 6 images per upload request.
- Doctor profile photo: JPG/PNG/WebP, max 5 MB.
- Files are served from `/uploads`; production should use durable object storage and HTTPS.
- Set `UPLOAD_DIR` and `PUBLIC_BASE_URL` in production.

## Languages
The mobile app includes Arabic, English, French, Spanish and German, with RTL for Arabic. The selected language is persisted locally.

## Production note
For a worldwide deployment, translate backend transactional/error messages and clinic-entered content as a separate localization layer. Do not machine-translate medical advice without review.
