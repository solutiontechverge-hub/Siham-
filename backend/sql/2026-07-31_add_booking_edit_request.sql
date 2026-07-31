-- Confirmed Edit Request (ER) — source of truth on bookings (not browser localStorage).
-- Shape example:
-- {
--   "status": "pending",
--   "note": "...",
--   "initiated_by": "client",
--   "requested_at": "ISO",
--   "responded_at": null,
--   "edit_grant_active": false
-- }

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS edit_request JSONB NULL;

COMMENT ON COLUMN bookings.edit_request IS
  'Confirmed booking Edit Request (ER): pending/approved/rejected + one-save grant.';
