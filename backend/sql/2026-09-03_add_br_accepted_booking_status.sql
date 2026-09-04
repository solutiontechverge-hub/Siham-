-- Booking request accepted but not yet fully confirmed (e.g. awaiting prepayment or OK).

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_status_check
    CHECK (status IN (
      'requested',
      'br_accepted',
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
      'br_accepted',
      'cancelled',
      'completed',
      'confirmed',
      'blocked',
      'in_progress',
      'no_show',
      'invalid'
    ));
