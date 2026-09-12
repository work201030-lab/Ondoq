-- Apply this migration to an existing ONDOQ Clinic database before V8.
BEGIN;

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;
ALTER TABLE appointments ADD CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;
ALTER TABLE appointments ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
ALTER TABLE notifications_log DROP CONSTRAINT IF EXISTS notifications_log_clinic_id_fkey;
ALTER TABLE notifications_log ADD CONSTRAINT notifications_log_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
ALTER TABLE notifications_log DROP CONSTRAINT IF EXISTS notifications_log_appointment_id_fkey;
ALTER TABLE notifications_log ADD CONSTRAINT notifications_log_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES clinic_users(id) ON DELETE SET NULL,
  email VARCHAR(150) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON account_deletion_requests(status, created_at DESC);

COMMIT;
