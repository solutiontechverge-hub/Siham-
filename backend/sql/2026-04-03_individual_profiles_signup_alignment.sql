ALTER TABLE individual_profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS country_code TEXT;

UPDATE individual_profiles
SET
  display_name = COALESCE(display_name, first_name)
WHERE display_name IS NULL;
