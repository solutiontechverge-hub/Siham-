-- Booking-scoped activity timeline (real events with timestamps)

CREATE TABLE IF NOT EXISTS booking_activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  booking_code TEXT,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'system',
  actor_label TEXT,
  subtitle TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_activity_events_booking_id
  ON booking_activity_events (booking_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_activity_events_booking_code
  ON booking_activity_events (booking_code, occurred_at DESC)
  WHERE booking_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_booking_activity_events_occurred_at
  ON booking_activity_events (occurred_at DESC);
