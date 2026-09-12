import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';
const list = (value) => String(value || '').split(',').map((v) => v.trim()).filter(Boolean);

const requiredInProduction = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN', 'APP_URL'];
if (isProduction) {
  const missing = requiredInProduction.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  if ((process.env.JWT_SECRET || '').length < 32) throw new Error('JWT_SECRET must be at least 32 characters long in production');
  if (!/^https:\/\//i.test(process.env.APP_URL || '')) throw new Error('APP_URL must use HTTPS in production');
}

const corsOrigins = list(process.env.CORS_ORIGIN || (isProduction ? '' : 'http://localhost:5173,capacitor://localhost'));

export const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || '',
  pgssl: String(process.env.PGSSL || 'true').toLowerCase() === 'true',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  patientJwtExpiresIn: process.env.PATIENT_JWT_EXPIRES_IN || '30d',
  corsOrigins,
  appUrl: (process.env.APP_URL || '').replace(/\/$/, ''),
  publicWebUrl: (process.env.PUBLIC_WEB_URL || '').replace(/\/$/, ''),
  supportEmail: process.env.SUPPORT_EMAIL || '',
  paymob: Object.freeze({
    baseUrl: (process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com').replace(/\/$/, ''),
    secretKey: process.env.PAYMOB_SECRET_KEY || '',
    publicKey: process.env.PAYMOB_PUBLIC_KEY || '',
    hmacSecret: process.env.PAYMOB_HMAC_SECRET || '',
    cardIntegrationId: process.env.PAYMOB_INTEGRATION_ID_CARD || '',
  }),
  twilio: Object.freeze({
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  }),
  media: Object.freeze({
    publicBaseUrl: (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, ''),
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || '',
  }),
  reminderWorker: String(process.env.ENABLE_REMINDER_WORKER ?? 'true').toLowerCase() === 'true',
  whatsappTemplateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US',
  openai: Object.freeze({
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-5',
  }),
});
