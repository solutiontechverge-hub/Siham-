-- Cross-device UI preferences (messaging hide/block, booking update-seen, etc.).
-- Replaces browser localStorage for non-auth durable client state.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ui_prefs JSONB NOT NULL DEFAULT '{}'::jsonb;
