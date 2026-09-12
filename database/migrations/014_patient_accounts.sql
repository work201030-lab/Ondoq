-- Global patient accounts: one account can see appointments across clinics by normalized phone.
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
