-- ONDOQ: clinic map/location support
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS maps_place_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_clinics_location
  ON clinics (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

ALTER TABLE clinics DROP CONSTRAINT IF EXISTS clinics_latitude_range;
ALTER TABLE clinics ADD CONSTRAINT clinics_latitude_range CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90);
ALTER TABLE clinics DROP CONSTRAINT IF EXISTS clinics_longitude_range;
ALTER TABLE clinics ADD CONSTRAINT clinics_longitude_range CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);
