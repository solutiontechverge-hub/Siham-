CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  user_type TEXT NOT NULL CHECK (user_type IN ('individual', 'company', 'professional')),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS individual_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  country_code TEXT,
  phone TEXT,
  profile_picture TEXT
);

CREATE TABLE IF NOT EXISTS company_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  legal_name TEXT,
  ccc_number TEXT,
  vat_number TEXT,
  street TEXT,
  street_number TEXT,
  postal_code TEXT,
  province TEXT,
  municipality TEXT,
  contact_first_name TEXT,
  contact_last_name TEXT,
  logo TEXT
);

CREATE TABLE IF NOT EXISTS professional_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  legal_name TEXT,
  ccc_number TEXT,
  vat_number TEXT,
  street TEXT,
  street_number TEXT,
  postal_code TEXT,
  province TEXT,
  municipality TEXT,
  business_type TEXT,
  website TEXT,
  instagram TEXT,
  other_link TEXT,
  contact_first_name TEXT,
  contact_last_name TEXT,
  profile_picture TEXT,
  service_location_mode TEXT
);

CREATE TABLE IF NOT EXISTS email_verifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id
  ON email_verifications(user_id);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token
  ON email_verifications(token);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
  ON password_reset_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token
  ON password_reset_tokens(token);

ALTER TABLE individual_profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS country_code TEXT,
  ADD COLUMN IF NOT EXISTS profile_picture TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

UPDATE individual_profiles
SET display_name = COALESCE(display_name, first_name)
WHERE display_name IS NULL;

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
  ADD COLUMN IF NOT EXISTS contact_last_name TEXT,
  ADD COLUMN IF NOT EXISTS logo TEXT;

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
  ADD COLUMN IF NOT EXISTS contact_last_name TEXT,
  ADD COLUMN IF NOT EXISTS profile_picture TEXT,
  ADD COLUMN IF NOT EXISTS service_location_mode TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'professional_profiles'
      AND column_name = 'first_name'
  ) THEN
    UPDATE professional_profiles
    SET contact_first_name = COALESCE(contact_first_name, first_name)
    WHERE contact_first_name IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'professional_profiles'
      AND column_name = 'last_name'
  ) THEN
    UPDATE professional_profiles
    SET contact_last_name = COALESCE(contact_last_name, last_name)
    WHERE contact_last_name IS NULL;
  END IF;
END $$;

ALTER TABLE password_reset_tokens
  ALTER COLUMN token TYPE TEXT,
  ALTER COLUMN otp_code TYPE TEXT;
