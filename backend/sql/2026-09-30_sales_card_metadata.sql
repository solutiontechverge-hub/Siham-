CREATE TABLE IF NOT EXISTS sales_card_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_profile_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  card_kind TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (professional_profile_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_sales_card_metadata_professional_booking
  ON sales_card_metadata (professional_profile_id, booking_id);
