CREATE TABLE IF NOT EXISTS in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  audience TEXT NOT NULL CHECK (audience IN ('client', 'professional')),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  status_type TEXT NOT NULL DEFAULT 'updated'
    CHECK (status_type IN ('pending', 'accepted', 'rejected', 'updated')),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  booking_ref TEXT,
  actor_name TEXT,
  href TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_recipient_created
  ON in_app_notifications(recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_unread
  ON in_app_notifications(recipient_user_id)
  WHERE read_at IS NULL;
