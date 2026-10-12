-- Backfill stored deadlines from existing snapshots (column already added earlier).
-- Bookings: notes meta respondBy → response_deadline_at
UPDATE bookings
SET response_deadline_at = (
  NULLIF((regexp_match(notes, '"respondBy"\s*:\s*"([^"]+)"'))[1], '')
)::timestamptz
WHERE response_deadline_at IS NULL
  AND notes ILIKE '%"respondBy"%'
  AND (regexp_match(notes, '"respondBy"\s*:\s*"([^"]+)"'))[1] IS NOT NULL;

-- Finance: document dueDate → payment_deadline
UPDATE finance_transactions
SET payment_deadline = NULLIF(document->>'dueDate', '')::date
WHERE payment_deadline IS NULL
  AND NULLIF(document->>'dueDate', '') IS NOT NULL;
