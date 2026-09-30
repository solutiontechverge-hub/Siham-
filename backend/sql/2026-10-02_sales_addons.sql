CREATE TABLE IF NOT EXISTS sales_addons (
  id TEXT NOT NULL,
  professional_profile_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  booking_id TEXT NOT NULL,
  booking_code TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  discount JSONB,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  note TEXT,
  voided BOOLEAN NOT NULL DEFAULT FALSE,
  refunded BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (professional_profile_id, id)
);

CREATE INDEX IF NOT EXISTS idx_sales_addons_professional_booking
  ON sales_addons (professional_profile_id, booking_id);
