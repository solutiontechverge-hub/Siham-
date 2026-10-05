-- Date-range rendering must be indexable and must not depend on list pagination.
CREATE INDEX IF NOT EXISTS idx_bookings_business_setup_date
  ON bookings (business_setup_id, booking_date, start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_professional_range
  ON calendar_entries (professional_profile_id, start_date, start_time);

-- Canonical action label for both client and professional timelines.
ALTER TABLE booking_activity_events
  ADD COLUMN IF NOT EXISTS action TEXT;
UPDATE booking_activity_events
   SET action = COALESCE(NULLIF(action, ''), title)
 WHERE action IS NULL OR action = '';
ALTER TABLE booking_activity_events
  ALTER COLUMN action SET DEFAULT '';
