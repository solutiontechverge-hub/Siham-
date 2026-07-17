CREATE TABLE IF NOT EXISTS booking_email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id, email_type)
);

CREATE INDEX IF NOT EXISTS idx_booking_email_notifications_booking_id
  ON booking_email_notifications(booking_id);
