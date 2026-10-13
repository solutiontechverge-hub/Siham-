-- Server-driven activity: action_type + actor (user_id / actor_role).
-- kind remains the internal event key; action_type is the logged action contract.

ALTER TABLE booking_activity_events
  ADD COLUMN IF NOT EXISTS action_type TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS actor_role TEXT;

UPDATE booking_activity_events
SET
  action_type = COALESCE(NULLIF(action_type, ''), kind),
  actor_role = COALESCE(NULLIF(actor_role, ''), actor)
WHERE action_type IS NULL OR action_type = ''
   OR actor_role IS NULL OR actor_role = '';

CREATE INDEX IF NOT EXISTS idx_booking_activity_events_user_id
  ON booking_activity_events (user_id, occurred_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_booking_activity_events_action_type
  ON booking_activity_events (action_type, occurred_at DESC);
