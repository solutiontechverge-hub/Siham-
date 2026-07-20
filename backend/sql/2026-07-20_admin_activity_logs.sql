-- Admin dashboard activity log (platform audit feed)

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email TEXT NOT NULL,
  actor_name TEXT,
  action TEXT NOT NULL,
  detail TEXT,
  color TEXT NOT NULL DEFAULT 'teal'
    CHECK (color IN ('teal', 'navy', 'warning', 'mint')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at
  ON admin_activity_logs (created_at DESC);
