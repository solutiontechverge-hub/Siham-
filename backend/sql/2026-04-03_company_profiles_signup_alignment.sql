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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'company_profiles'
      AND column_name = 'company_name'
  ) THEN
    UPDATE company_profiles
    SET legal_name = COALESCE(legal_name, company_name)
    WHERE legal_name IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'company_profiles'
      AND column_name = 'registration_number'
  ) THEN
    UPDATE company_profiles
    SET ccc_number = COALESCE(ccc_number, registration_number)
    WHERE ccc_number IS NULL;
  END IF;
END $$;
