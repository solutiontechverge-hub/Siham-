-- Extend admin activity logs for richer audit metadata

ALTER TABLE admin_activity_logs
  ADD COLUMN IF NOT EXISTS module TEXT,
  ADD COLUMN IF NOT EXISTS action_type TEXT,
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS actor_user_id UUID;

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_action_type
  ON admin_activity_logs (action_type);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_module
  ON admin_activity_logs (module);
