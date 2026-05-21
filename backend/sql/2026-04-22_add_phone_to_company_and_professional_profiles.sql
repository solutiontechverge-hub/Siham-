ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE professional_profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;
