-- Allow 'invalid' so rejected/invalid bookings stay distinct from cancelled
-- and can remain in Upcoming until the user deletes them.

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_status_check
    CHECK (status IN (
      'requested',
      'cancelled',
      'completed',
      'confirmed',
      'in_progress',
      'no_show',
      'invalid'
    ));

ALTER TABLE calendar_entries
  DROP CONSTRAINT IF EXISTS calendar_entries_status_check;

ALTER TABLE calendar_entries
  ADD CONSTRAINT calendar_entries_status_check
    CHECK (status IN (
      'requested',
      'cancelled',
      'completed',
      'confirmed',
      'blocked',
      'in_progress',
      'no_show',
      'invalid'
    ));
