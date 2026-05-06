ALTER TABLE calendar_entries
  ADD COLUMN IF NOT EXISTS team_member_id BIGINT REFERENCES business_team_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS booking_type TEXT CHECK (booking_type IS NULL OR booking_type IN ('online', 'offline', 'project', 'request')),
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE TABLE IF NOT EXISTS calendar_settings (
  id BIGSERIAL PRIMARY KEY,
  professional_profile_id BIGINT NOT NULL UNIQUE REFERENCES professional_profiles(id) ON DELETE CASCADE,
  availability JSONB NOT NULL DEFAULT '{}'::JSONB,
  design JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_entries_team_member_id
  ON calendar_entries(team_member_id);
