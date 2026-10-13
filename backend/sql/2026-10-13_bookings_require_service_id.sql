-- Require a real subcategory FK on every booking (no free-text-only service).
-- Soft-cancel stays status-only; this does not delete bookings/sales/activity.

-- 1) Backfill from structured link rows
UPDATE bookings b
SET service_id = l.service_id,
    updated_at = NOW()
FROM (
  SELECT DISTINCT ON (booking_id) booking_id, service_id
  FROM booking_service_links
  ORDER BY booking_id, position ASC, created_at ASC
) l
WHERE b.id = l.booking_id
  AND b.service_id IS NULL;

-- 2) Backfill from business setup catalog (first listed service)
UPDATE bookings b
SET service_id = x.candidate_service_id,
    updated_at = NOW()
FROM (
  SELECT DISTINCT ON (b2.id)
    b2.id AS booking_id,
    (elem->>'service_id')::uuid AS candidate_service_id
  FROM bookings b2
  JOIN business_setups bs ON bs.id = b2.business_setup_id
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(bs.service_categories, '[]'::jsonb))
    WITH ORDINALITY AS t(elem, ord)
  WHERE b2.service_id IS NULL
    AND (elem->>'service_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ORDER BY b2.id, ord
) x
JOIN subcategories s ON s.id = x.candidate_service_id
WHERE b.id = x.booking_id
  AND b.service_id IS NULL;

-- 3) Legacy seed rows with empty catalogs: attach first catalog service
UPDATE bookings b
SET service_id = (
      SELECT s.id FROM subcategories s ORDER BY s.title ASC, s.id ASC LIMIT 1
    ),
    updated_at = NOW()
WHERE b.service_id IS NULL
  AND EXISTS (SELECT 1 FROM subcategories LIMIT 1);

-- Fail loud if anything remains null (blocks NOT NULL)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM bookings WHERE service_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot enforce bookings.service_id NOT NULL: null rows remain';
  END IF;
END $$;

-- Sync link table for every booking primary service
INSERT INTO booking_service_links (booking_id, service_id, position)
SELECT b.id, b.service_id, 0
FROM bookings b
WHERE b.service_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Tighten FK: deleting a service must not null-out bookings
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_service_id_fkey;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_service_id_fkey
  FOREIGN KEY (service_id) REFERENCES subcategories(id) ON DELETE RESTRICT;

ALTER TABLE bookings
  ALTER COLUMN service_id SET NOT NULL;
