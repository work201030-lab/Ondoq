import { config } from './config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import doctorsRoutes from './routes/doctors.js';
import patientsRoutes from './routes/patients.js';

import appointmentsRoutes from './routes/appointments.js';
import paymentsRoutes from './routes/payments.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import notificationsRoutes from './routes/notifications.js';
import clinicsRoutes from './routes/clinics.js';
import webhooksRoutes from './routes/webhooks.js';
import reviewsRoutes from './routes/reviews.js';
import mediaRoutes from './routes/media.js';
import patientAuthRoutes from './routes/patient-auth.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';
import path from 'path';
import { processDueReminders } from './services/notify.js';

const app = express();

if (config.isProduction && config.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long in production');
}

// ملاحظة: webhooks لازم تستقبل الـ raw body قبل express.json() للتحقق من التوقيع
app.use('/webhooks', webhooksRoutes);

app.use(helmet());
const allowedOrigins = new Set(config.corsOrigins);
const localDevOrigins = new Set(['capacitor://localhost','https://localhost','http://localhost','http://localhost:5173']);
app.use(cors({ origin: (origin, callback) => {
  if (!origin || allowedOrigins.has(origin) || (!config.isProduction && localDevOrigins.has(origin))) return callback(null, true);
  return callback(new Error('Origin not allowed by CORS'));
}, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '1mb' }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'محاولات كثيرة. حاول مرة أخرى لاحقًا.' } });
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/patient-auth', authLimiter, patientAuthRoutes);
app.use('/api/clinics', clinicsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/uploads', express.static(path.resolve(config.media.uploadDir), {maxAge:'7d',index:false}));
app.use('/api/doctors', doctorsRoutes);
app.use('/api/patients', patientsRoutes);
const publicBookingLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false, message: { error: 'طلبات حجز كثيرة. حاول مرة أخرى لاحقًا.' } });
app.use('/api/appointments/public', publicBookingLimiter);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.get('/payment/complete', (req, res) => {
  res.status(200).send(`<!doctype html><html lang="ar"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ONDOQ Payment</title><body style="font-family:Arial,sans-serif;max-width:600px;margin:60px auto;padding:24px;text-align:center"><h1>تمت العودة إلى ONDOQ</h1><p>سيتم اعتماد حالة الدفع من إشعار Paymob الآمن. يمكنك إغلاق هذه الصفحة والعودة للتطبيق.</p></body></html>`);
});

app.use('/', express.static(path.resolve('public'), { maxAge: '1h', index: 'index.html' }));

app.get('/health', async (req, res) => {
  try {
    const { query } = await import('./db.js');
    await query('SELECT 1');
    res.json({ ok: true, service: 'ondoq-clinic', database: 'ok', time: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ ok: false, service: 'ondoq-clinic', database: 'unavailable' });
  }
});

app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'حدث خطأ غير متوقع' }); });

const PORT = config.port;
app.listen(PORT, () => { console.log(`✅ ONDOQ Clinic API running on port ${PORT}`); if(config.reminderWorker) setInterval(()=>processDueReminders().catch(e=>console.error('reminder worker',e.message)),10*60*1000); });
