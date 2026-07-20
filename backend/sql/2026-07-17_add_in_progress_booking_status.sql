-- Allow the 'in_progress' status so a professional can mark a confirmed booking
-- as currently being served. Auto-complete later transitions it to 'completed'.

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_status_check
    CHECK (status IN ('requested', 'cancelled', 'completed', 'confirmed', 'in_progress', 'no_show'));

ALTER TABLE calendar_entries
  DROP CONSTRAINT IF EXISTS calendar_entries_status_check;

ALTER TABLE calendar_entries
  ADD CONSTRAINT calendar_entries_status_check
    CHECK (status IN ('requested', 'cancelled', 'completed', 'confirmed', 'blocked', 'in_progress', 'no_show'));
