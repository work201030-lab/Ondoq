-- ============================================================
-- أوندوك SaaS — قاعدة بيانات متعددة العيادات (Multi-Tenant)
-- PostgreSQL 14+
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- العيادات (المستأجرون / Tenants) ----------
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(80) UNIQUE NOT NULL,          -- يستخدم في الرابط: clinic.app/slug
  phone VARCHAR(20),
  email VARCHAR(150),
  city VARCHAR(80),
  address TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  maps_place_id VARCHAR(255),
  logo_url TEXT,
  default_language VARCHAR(5) DEFAULT 'en' CHECK (default_language IN ('ar','en','fr','es','de')),
  status VARCHAR(20) DEFAULT 'trial',        -- trial | active | suspended | cancelled
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- خطط الاشتراك ----------
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,                 -- أساسي | احترافي | مؤسسات
  price_egp NUMERIC(10,2) NOT NULL,
  billing_cycle VARCHAR(10) DEFAULT 'monthly', -- monthly | yearly
  max_doctors INT NOT NULL,
  max_appointments_month INT,                -- NULL = غير محدود
  sms_credits_month INT DEFAULT 0,
  whatsapp_enabled BOOLEAN DEFAULT false,
  online_payment_enabled BOOLEAN DEFAULT false,
  features JSONB DEFAULT '{}'
);

-- ---------- اشتراكات العيادات ----------
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status VARCHAR(20) DEFAULT 'trialing',     -- trialing | active | past_due | cancelled
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  payment_gateway VARCHAR(20),               -- paymob
  gateway_subscription_id VARCHAR(120),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- فواتير الاشتراك الشهري ----------
CREATE TABLE subscription_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount_egp NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',      -- pending | paid | failed
  gateway_transaction_id VARCHAR(120),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- مستخدمو لوحة تحكم العيادة ----------
CREATE TABLE clinic_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'owner',          -- owner | receptionist
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- الأطباء ----------
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  specialty VARCHAR(80),
  bio TEXT,
  photo_url TEXT,
  price_egp NUMERIC(10,2),
  work_days INT[] DEFAULT '{0,1,2,3,4}',     -- 0=أحد ... 6=سبت
  start_hour INT DEFAULT 10,
  end_hour INT DEFAULT 18,
  slot_minutes INT DEFAULT 30,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- المرضى ----------
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, phone)
);


-- ---------- حسابات المرضى العالمية ----------
CREATE TABLE IF NOT EXISTS patient_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(150),
  name VARCHAR(120) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patient_accounts_phone ON patient_accounts(phone);

-- ---------- المواعيد ----------
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',    -- confirmed | cancelled | completed | no_show
  payment_status VARCHAR(20) DEFAULT 'unpaid', -- unpaid | paid | refunded
  amount_egp NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(doctor_id, appointment_date, appointment_time)  -- يمنع التعارض تلقائيًا
);

-- ---------- مدفوعات الكشوفات (دفع أونلاين من المريض) ----------
CREATE TABLE appointment_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  amount_egp NUMERIC(10,2) NOT NULL,
  gateway VARCHAR(20),                       -- paymob
  gateway_transaction_id VARCHAR(120),
  status VARCHAR(20) DEFAULT 'pending',       -- pending | success | failed | refunded
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- سجل الإشعارات (SMS / واتساب) ----------
CREATE TABLE notifications_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  channel VARCHAR(10),                        -- sms | whatsapp
  recipient_phone VARCHAR(20),
  message TEXT,
  status VARCHAR(20) DEFAULT 'queued',         -- queued | sent | failed
  provider_message_id VARCHAR(120),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- فهارس أساسية للأداء ----------
CREATE INDEX idx_appt_clinic_date ON appointments(clinic_id, appointment_date);
CREATE INDEX idx_appt_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_patients_phone ON patients(clinic_id, phone);
CREATE INDEX idx_notifications_status ON notifications_log(status);

-- ---------- بيانات ابتدائية لخطط الاشتراك ----------
INSERT INTO subscription_plans (name, price_egp, max_doctors, max_appointments_month, sms_credits_month, whatsapp_enabled, online_payment_enabled)
VALUES
('أساسي', 299, 2, 200, 50, false, false),
('احترافي', 699, 8, 1500, 300, true, true),
('مؤسسات', 1499, 999, NULL, 1000, true, true);

-- ---------- Production hardening ----------
ALTER TABLE clinic_users ADD CONSTRAINT clinic_users_email_lower CHECK (email = lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_subscription_per_clinic ON subscriptions(clinic_id) WHERE status IN ('trialing','active','past_due');
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_gateway_tx ON appointment_payments(gateway, gateway_transaction_id) WHERE gateway_transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_clinic_status ON subscriptions(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_doctors_clinic_active ON doctors(clinic_id, active);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES clinic_users(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  entity VARCHAR(80),
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_clinic_created ON audit_logs(clinic_id, created_at DESC);


-- ---------- طلبات حذف الحساب (لصفحة الحذف الخارجية في Google Play) ----------
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES clinic_users(id) ON DELETE SET NULL,
  email VARCHAR(150) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'requested', -- requested | completed | rejected
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON account_deletion_requests(status, created_at DESC);


-- Ensure dependent rows are deleted with the clinic in production.
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;
ALTER TABLE appointments ADD CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;
ALTER TABLE appointments ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
ALTER TABLE notifications_log DROP CONSTRAINT IF EXISTS notifications_log_clinic_id_fkey;
ALTER TABLE notifications_log ADD CONSTRAINT notifications_log_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
ALTER TABLE notifications_log DROP CONSTRAINT IF EXISTS notifications_log_appointment_id_fkey;
ALTER TABLE notifications_log ADD CONSTRAINT notifications_log_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE;


-- ---------- التقييمات الموثقة بعد إكمال الموعد ----------
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS default_language VARCHAR(5) DEFAULT 'en';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS review_token UUID DEFAULT uuid_generate_v4();
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointment_review_token ON appointments(review_token);
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_clinic_created ON reviews(clinic_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_doctor_created ON reviews(doctor_id,created_at DESC);


-- ---------- معرض صور العيادة ----------
CREATE TABLE IF NOT EXISTS clinic_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption VARCHAR(200),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_clinic_images_clinic ON clinic_images(clinic_id,sort_order,created_at);

-- ---------- V16 production operations ----------
ALTER TABLE clinic_users DROP CONSTRAINT IF EXISTS clinic_users_role_check;
ALTER TABLE clinic_users ADD CONSTRAINT clinic_users_role_check CHECK (role IN ('owner','receptionist'));
ALTER TABLE notifications_log ADD COLUMN IF NOT EXISTS notification_type VARCHAR(30) DEFAULT 'transactional';
CREATE INDEX IF NOT EXISTS idx_appt_clinic_status_date ON appointments(clinic_id,status,appointment_date);
CREATE INDEX IF NOT EXISTS idx_appt_patient_date ON appointments(patient_id,appointment_date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user_created ON audit_logs(user_id,created_at DESC);


CREATE TABLE IF NOT EXISTS patient_account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_account_id UUID REFERENCES patient_accounts(id) ON DELETE SET NULL,
  phone TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patient_delete_requests_status ON patient_account_deletion_requests(status, created_at DESC);
