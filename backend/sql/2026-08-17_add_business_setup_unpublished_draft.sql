ALTER TABLE business_setups
  ADD COLUMN IF NOT EXISTS unpublished_draft JSONB,
  ADD COLUMN IF NOT EXISTS has_unpublished_changes BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_business_setups_has_unpublished_changes
  ON business_setups (has_unpublished_changes)
  WHERE has_unpublished_changes = true;
