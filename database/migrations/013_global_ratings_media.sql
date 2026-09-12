-- Apply to an existing ONDOQ database.
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
CREATE TABLE IF NOT EXISTS clinic_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption VARCHAR(200),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_clinic_created ON reviews(clinic_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_doctor_created ON reviews(doctor_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinic_images_clinic ON clinic_images(clinic_id,sort_order,created_at);
