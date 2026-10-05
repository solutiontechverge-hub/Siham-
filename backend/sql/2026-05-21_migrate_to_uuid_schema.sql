-- Rebuild application schema with UUID primary keys (destructive for app tables).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS calendar_entries CASCADE;
DROP TABLE IF EXISTS calendar_settings CASCADE;
DROP TABLE IF EXISTS business_team_members CASCADE;
DROP TABLE IF EXISTS business_setups CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS email_verifications CASCADE;
DROP TABLE IF EXISTS professional_profiles CASCADE;
DROP TABLE IF EXISTS company_profiles CASCADE;
DROP TABLE IF EXISTS individual_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type TEXT NOT NULL CHECK (user_type IN ('individual', 'company', 'professional')),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE individual_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  country_code TEXT,
  phone TEXT,
  profile_picture TEXT
);

CREATE TABLE company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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
  phone TEXT,
  logo TEXT
);

CREATE TABLE professional_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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
  phone TEXT,
  profile_picture TEXT,
  service_location_mode TEXT
);

CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, title)
);

CREATE TABLE business_setups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_profile_id UUID NOT NULL UNIQUE REFERENCES professional_profiles(id) ON DELETE CASCADE,
  location_mode TEXT NOT NULL CHECK (location_mode IN ('fixed', 'desired', 'both')),
  business_name TEXT,
  business_about TEXT,
  business_keywords TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  business_media TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  salon_name TEXT,
  fixed_location_address TEXT,
  fixed_location_street_number TEXT,
  fixed_location_postal_code TEXT,
  fixed_location_province TEXT,
  fixed_location_municipality TEXT,
  service_for TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  service_categories JSONB NOT NULL DEFAULT '[]'::JSONB,
  project TEXT,
  book_service_notes TEXT,
  book_service_combinations JSONB NOT NULL DEFAULT '[]'::JSONB,
  team_member_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  additional_notes TEXT,
  price_range TEXT,
  prepayment_percentage NUMERIC(5,2),
  prepayment_instruction TEXT,
  kilometer_allowance NUMERIC(10,2),
  kilometer_allowance_instruction TEXT,
  response_time_hours INTEGER,
  response_time_minutes INTEGER,
  response_deadline_at TIMESTAMPTZ,
  policy_custom_instruction TEXT,
  appointment_before_hours INTEGER,
  appointment_before_minutes INTEGER,
  late_reschedule_fee_percentage NUMERIC(5,2),
  late_reschedule_policy_instruction TEXT,
  cancellation_before_hours INTEGER,
  cancellation_before_minutes INTEGER,
  late_cancellation_fee_percentage NUMERIC(5,2),
  cancellation_policy_instruction TEXT,
  no_show_fee_percentage NUMERIC(5,2),
  no_show_fee_instruction TEXT,
  desired_location_area TEXT,
  desired_location_province TEXT,
  desired_location_services TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (cardinality(business_keywords) <= 3),
  CHECK (cardinality(business_media) <= 10),
  CHECK (prepayment_percentage IS NULL OR (prepayment_percentage >= 0 AND prepayment_percentage <= 100)),
  CHECK (late_reschedule_fee_percentage IS NULL OR (late_reschedule_fee_percentage >= 0 AND late_reschedule_fee_percentage <= 100)),
  CHECK (late_cancellation_fee_percentage IS NULL OR (late_cancellation_fee_percentage >= 0 AND late_cancellation_fee_percentage <= 100)),
  CHECK (no_show_fee_percentage IS NULL OR (no_show_fee_percentage >= 0 AND no_show_fee_percentage <= 100)),
  CHECK (response_time_hours IS NULL OR response_time_hours >= 0),
  CHECK (response_time_minutes IS NULL OR (response_time_minutes >= 0 AND response_time_minutes < 60)),
  CHECK (appointment_before_hours IS NULL OR appointment_before_hours >= 0),
  CHECK (appointment_before_minutes IS NULL OR (appointment_before_minutes >= 0 AND appointment_before_minutes < 60)),
  CHECK (cancellation_before_hours IS NULL OR cancellation_before_hours >= 0),
  CHECK (cancellation_before_minutes IS NULL OR (cancellation_before_minutes >= 0 AND cancellation_before_minutes < 60))
);

CREATE TABLE business_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_setup_id UUID NOT NULL REFERENCES business_setups(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Team member',
  profile_photo TEXT,
  assigned_services JSONB NOT NULL DEFAULT '[]'::JSONB,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE calendar_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_profile_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES business_team_members(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('requested', 'cancelled', 'completed', 'confirmed', 'blocked', 'no_show')),
  title TEXT NOT NULL,
  unique_code TEXT NOT NULL UNIQUE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  start_date DATE,
  end_date DATE,
  blocked_time_start TIMESTAMPTZ,
  blocked_time_end TIMESTAMPTZ,
  location_type TEXT CHECK (location_type IN ('fixed', 'desired')),
  booking_type TEXT CHECK (booking_type IS NULL OR booking_type IN ('online', 'offline', 'project', 'request')),
  client_name TEXT,
  notes TEXT,
  service_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time IS NULL OR start_time IS NULL OR end_time >= start_time),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  CHECK (blocked_time_end IS NULL OR blocked_time_start IS NULL OR blocked_time_end >= blocked_time_start)
);

CREATE TABLE calendar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_profile_id UUID NOT NULL UNIQUE REFERENCES professional_profiles(id) ON DELETE CASCADE,
  availability JSONB NOT NULL DEFAULT '{}'::JSONB,
  design JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_date DATE NOT NULL,
  business_setup_id UUID NOT NULL REFERENCES business_setups(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  team_member_id UUID REFERENCES business_team_members(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  location_type TEXT CHECK (location_type IN ('fixed', 'desired')),
  location_details JSONB NOT NULL DEFAULT '{}'::JSONB,
  notes TEXT,
  prepayment_status TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  booking_type TEXT NOT NULL DEFAULT 'online',
  unique_code TEXT NOT NULL,
  total_price NUMERIC(12,2) CHECK (total_price IS NULL OR total_price >= 0),
  images TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  contact_number TEXT,
  documents TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  province TEXT,
  municipality TEXT,
  street_address TEXT,
  street_number TEXT,
  postal_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time IS NULL OR start_time IS NULL OR end_time >= start_time),
  CHECK (booking_type IN ('online', 'offline', 'project', 'request')),
  CHECK (status IN ('requested', 'cancelled', 'completed', 'confirmed', 'no_show'))
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_business_setups_professional_profile_id ON business_setups(professional_profile_id);
CREATE INDEX IF NOT EXISTS idx_business_team_members_business_setup_id ON business_team_members(business_setup_id);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_professional_profile_id ON calendar_entries(professional_profile_id);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_team_member_id ON calendar_entries(team_member_id);
CREATE INDEX IF NOT EXISTS idx_bookings_business_setup_id ON bookings(business_setup_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_code ON bookings(unique_code);
