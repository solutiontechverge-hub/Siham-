ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS ccc_number TEXT,
  ADD COLUMN IF NOT EXISTS vat_number TEXT,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS street_number TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS municipality TEXT,
  ADD COLUMN IF NOT EXISTS contact_first_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_last_name TEXT;

UPDATE company_profiles
SET
  legal_name = COALESCE(legal_name, company_name),
  ccc_number = COALESCE(ccc_number, registration_number)
WHERE
  legal_name IS NULL
  OR ccc_number IS NULL;
