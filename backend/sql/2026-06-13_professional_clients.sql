CREATE TABLE IF NOT EXISTS professional_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_profile_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  mollure_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  client_kind TEXT NOT NULL CHECK (client_kind IN ('individual', 'company')),
  is_mollure BOOLEAN NOT NULL DEFAULT false,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  technical_note TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  has_no_show BOOLEAN NOT NULL DEFAULT false,
  total_sales NUMERIC(12, 2) NOT NULL DEFAULT 0,
  last_booking_date DATE,
  bookings_completed INTEGER NOT NULL DEFAULT 0,
  average_booking_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  recent_services JSONB NOT NULL DEFAULT '[]'::JSONB,
  booking_history JSONB NOT NULL DEFAULT '[]'::JSONB,
  first_name TEXT,
  last_name TEXT,
  gender TEXT,
  date_of_birth DATE,
  residential_address TEXT,
  legal_name TEXT,
  coc TEXT,
  vat TEXT,
  contact_person_name TEXT,
  business_address TEXT,
  detail_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (professional_profile_id, email)
);

CREATE INDEX IF NOT EXISTS idx_professional_clients_profile_id
  ON professional_clients(professional_profile_id);

CREATE INDEX IF NOT EXISTS idx_professional_clients_mollure_user_id
  ON professional_clients(mollure_user_id);
