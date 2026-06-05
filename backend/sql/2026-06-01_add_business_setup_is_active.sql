ALTER TABLE business_setups
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_business_setups_is_active ON business_setups (is_active);
