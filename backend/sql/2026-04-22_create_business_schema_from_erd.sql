CREATE TABLE IF NOT EXISTS user_roles (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subcategories (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, title)
);

CREATE TABLE IF NOT EXISTS business_setups (
  id BIGSERIAL PRIMARY KEY,
  professional_profile_id BIGINT NOT NULL UNIQUE REFERENCES professional_profiles(id) ON DELETE CASCADE,
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
  team_member_ids BIGINT[] NOT NULL DEFAULT '{}'::BIGINT[],
  additional_notes TEXT,
  price_range TEXT,
  prepayment_percentage NUMERIC(5,2),
  prepayment_instruction TEXT,
  kilometer_allowance NUMERIC(10,2),
  kilometer_allowance_instruction TEXT,
  response_time_hours INTEGER,
  response_time_minutes INTEGER,
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
  CHECK (cardinality(business_media) <= 4),
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

CREATE TABLE IF NOT EXISTS business_service_details (
  id BIGSERIAL PRIMARY KEY,
  business_setup_id BIGINT NOT NULL REFERENCES business_setups(id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_setup_id, service_id)
);

CREATE TABLE IF NOT EXISTS business_team_members (
  id BIGSERIAL PRIMARY KEY,
  business_setup_id BIGINT NOT NULL REFERENCES business_setups(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Team member',
  profile_photo TEXT,
  assigned_services JSONB NOT NULL DEFAULT '{}'::JSONB,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calendar_entries (
  id BIGSERIAL PRIMARY KEY,
  professional_profile_id BIGINT NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('requested', 'cancelled', 'completed', 'confirmed', 'blocked')),
  title TEXT NOT NULL,
  unique_code TEXT NOT NULL UNIQUE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  start_date DATE,
  end_date DATE,
  blocked_time_start TIMESTAMPTZ,
  blocked_time_end TIMESTAMPTZ,
  location_type TEXT CHECK (location_type IN ('fixed', 'desired')),
  service_ids BIGINT[] NOT NULL DEFAULT '{}'::BIGINT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time IS NULL OR start_time IS NULL OR end_time >= start_time),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  CHECK (blocked_time_end IS NULL OR blocked_time_start IS NULL OR blocked_time_end >= blocked_time_start)
);

CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  booking_date DATE NOT NULL,
  business_setup_id BIGINT NOT NULL REFERENCES business_setups(id) ON DELETE CASCADE,
  customer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id BIGINT REFERENCES subcategories(id) ON DELETE SET NULL,
  team_member_id BIGINT REFERENCES business_team_members(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  location_type TEXT CHECK (location_type IN ('fixed', 'desired')),
  location_details JSONB NOT NULL DEFAULT '{}'::JSONB,
  notes TEXT,
  prepayment_status TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
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
  CHECK (end_time IS NULL OR start_time IS NULL OR end_time >= start_time)
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category_id
  ON subcategories(category_id);

CREATE INDEX IF NOT EXISTS idx_business_setups_professional_profile_id
  ON business_setups(professional_profile_id);

CREATE INDEX IF NOT EXISTS idx_business_service_details_business_setup_id
  ON business_service_details(business_setup_id);

CREATE INDEX IF NOT EXISTS idx_business_service_details_service_id
  ON business_service_details(service_id);

CREATE INDEX IF NOT EXISTS idx_business_team_members_business_setup_id
  ON business_team_members(business_setup_id);

CREATE INDEX IF NOT EXISTS idx_calendar_entries_professional_profile_id
  ON calendar_entries(professional_profile_id);

CREATE INDEX IF NOT EXISTS idx_bookings_business_setup_id
  ON bookings(business_setup_id);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id
  ON bookings(customer_id);

CREATE INDEX IF NOT EXISTS idx_bookings_service_id
  ON bookings(service_id);
