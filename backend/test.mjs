import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
const files = [
  'server.js',
  'config.js',
  'routes/auth.js',
  'routes/appointments.js',
  'routes/doctors.js',
  'routes/patients.js',
  'routes/reviews.js',
  'routes/media.js',
  'routes/webhooks.js',
  'services/payment.js',
  'middleware/tenant.js',
  'routes/analytics.js',
  'services/audit.js',
  'services/notify.js'
];

for (const file of files) {
  const full = path.join(root, file);
  assert.ok(fs.existsSync(full), `missing ${file}`);
  const source = fs.readFileSync(full, 'utf8');
  assert.ok(!source.includes('example.com'), `${file} contains example.com placeholder`);
}

const config = fs.readFileSync(path.join(root, 'config.js'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
assert.match(server, /helmet\(\)/);
assert.match(server, /express\.json\(\{ limit: '1mb' \}\)/);
assert.match(config, /CORS_ORIGIN/);
assert.match(server, /app\.use\('\/webhooks'/);
assert.match(server, /app\.use\('\/api\/analytics'/);
assert.match(server, /processDueReminders/);

const auth = fs.readFileSync(path.join(root, 'routes/auth.js'), 'utf8');
assert.match(auth, /router\.delete\('\/account'/);
assert.match(auth, /requireRole\('owner'\)/);
assert.match(auth, /request-deletion/);

const clinics = fs.readFileSync(path.join(root, 'routes/clinics.js'), 'utf8');
assert.match(clinics, /router\.get\('\/nearby'/);
assert.match(clinics, /specialty/);
assert.match(clinics, /openNow/);
assert.match(clinics, /router\.get\('\/:clinicId\/doctors'/);
assert.match(clinics, /router\.get\('\/:clinicId\/available'/);

const appointments = fs.readFileSync(path.join(root, 'routes/appointments.js'), 'utf8');
assert.match(appointments, /router\.post\('\/public'/);
assert.match(appointments, /لا يمكن حجز موعد في وقت مضى/);
assert.match(appointments, /review_token/);
assert.match(appointments, /status/);

const schema = fs.readFileSync(path.join(root, '..', 'database', 'schema.sql'), 'utf8');
assert.match(schema, /account_deletion_requests/);
assert.match(schema, /audit_logs/);
assert.match(schema, /reviews/);
assert.match(schema, /clinic_images/);
assert.match(schema, /photo_url/);
assert.match(schema, /default_language/);
assert.match(schema, /notification_type/);
assert.match(schema, /clinic_users_role_check/);

console.log('Release smoke tests passed.');

const media = fs.readFileSync(path.join(root, 'routes/media.js'), 'utf8');
assert.match(media, /multer/);
assert.match(media, /5\*1024\*1024/);
const reviews = fs.readFileSync(path.join(root, 'routes/reviews.js'), 'utf8');
assert.match(reviews, /status!=='completed'/);
const i18n = fs.readFileSync(path.join(root, '..', 'mobile', 'src', 'i18n.js'), 'utf8');
for (const lang of ['ar','en','fr','es','de']) assert.match(i18n, new RegExp(lang));
console.log('Global ratings/media/i18n checks passed.');

const analytics=fs.readFileSync(path.join(root,'routes/analytics.js'),'utf8');
assert.match(analytics,/dashboard/);
assert.match(analytics,/revenue/);
const notify=fs.readFileSync(path.join(root,'services/notify.js'),'utf8');
assert.match(notify,/processDueReminders/);
assert.match(notify,/CLOUDINARY|WHATSAPP/);
console.log('V16 operations/security checks passed.');

assert.match(config, /requiredInProduction/);
assert.match(config, /APP_URL must use HTTPS/);
assert.match(server, /config\.isProduction/);
assert.match(server, /localDevOrigins/);
const mobile = fs.readFileSync(path.join(root, '..', 'mobile', 'src', 'main.jsx'), 'utf8');
assert.ok(!mobile.includes('10.0.2.2:4000'), 'mobile release must not hardcode emulator API URL');
console.log('V21 clean configuration/security checks passed.');
