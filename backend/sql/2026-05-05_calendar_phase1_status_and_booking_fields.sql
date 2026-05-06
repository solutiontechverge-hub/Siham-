ALTER TABLE calendar_entries
  DROP CONSTRAINT IF EXISTS calendar_entries_status_check;

ALTER TABLE calendar_entries
  ADD CONSTRAINT calendar_entries_status_check
    CHECK (status IN ('requested', 'cancelled', 'completed', 'confirmed', 'blocked', 'no_show'));

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booking_type TEXT,
  ADD COLUMN IF NOT EXISTS unique_code TEXT;

ALTER TABLE bookings
  ALTER COLUMN booking_type SET DEFAULT 'online';

UPDATE bookings
SET booking_type = CASE
  WHEN booking_type IS NULL OR booking_type = '' THEN 'online'
  ELSE booking_type
END;

UPDATE bookings
SET unique_code = CONCAT('123', id::TEXT)
WHERE unique_code IS NULL OR unique_code = '';

ALTER TABLE bookings
  ALTER COLUMN unique_code SET NOT NULL;

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_booking_type_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_booking_type_check
    CHECK (booking_type IN ('online', 'offline', 'project', 'request'));

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_status_check
    CHECK (status IN ('requested', 'cancelled', 'completed', 'confirmed', 'no_show'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_code
  ON bookings(unique_code);
