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

CREATE INDEX IF NOT EXISTS idx_business_team_members_business_setup_id
  ON business_team_members(business_setup_id);
