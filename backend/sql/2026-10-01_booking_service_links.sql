-- Structured booking/service relationship. Notes remain human-readable only.
CREATE TABLE IF NOT EXISTS booking_service_links (
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (booking_id, service_id)
);
CREATE INDEX IF NOT EXISTS idx_booking_service_links_service ON booking_service_links(service_id);
INSERT INTO booking_service_links (booking_id, service_id)
SELECT id, service_id FROM bookings WHERE service_id IS NOT NULL ON CONFLICT DO NOTHING;
