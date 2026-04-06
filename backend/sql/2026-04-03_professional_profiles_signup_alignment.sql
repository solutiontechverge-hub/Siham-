ALTER TABLE professional_profiles
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS ccc_number TEXT,
  ADD COLUMN IF NOT EXISTS vat_number TEXT,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS street_number TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS municipality TEXT,
  ADD COLUMN IF NOT EXISTS business_type TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS other_link TEXT,
  ADD COLUMN IF NOT EXISTS contact_first_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_last_name TEXT;

UPDATE professional_profiles
SET
  contact_first_name = COALESCE(contact_first_name, first_name),
  contact_last_name = COALESCE(contact_last_name, last_name)
WHERE
  contact_first_name IS NULL
  OR contact_last_name IS NULL;
