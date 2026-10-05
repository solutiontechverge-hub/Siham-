-- Freeze the response deadline at issue/creation time. Runtime watchers must
-- read this value instead of recalculating it from today's settings.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS response_deadline_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bookings_response_deadline
  ON bookings (response_deadline_at)
  WHERE response_deadline_at IS NOT NULL;
