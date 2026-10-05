-- Remove known dashboard placeholder transactions that do not represent real
-- bookings. Keep this list deliberately explicit and repeatable.
DELETE FROM finance_transactions
 WHERE COALESCE(booking_id, '') IN ('BK-DASH-R001', 'BK-DASH-R003', 'OF123', 'OF456')
    OR COALESCE(entry_id, '') IN ('BK-DASH-R001', 'BK-DASH-R003', 'OF123', 'OF456');

-- Keep the newest row for a single booking/phase/payer and remove older rows
-- created by repeated sync/retry requests.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY professional_profile_id,
             booking_id,
             COALESCE(document->>'paymentPhase', ''),
             COALESCE(document->>'payerKey', '')
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
         ) AS duplicate_rank
    FROM finance_transactions
   WHERE NULLIF(booking_id, '') IS NOT NULL
)
DELETE FROM finance_transactions ft
 USING ranked r
 WHERE ft.id = r.id
   AND r.duplicate_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS ux_finance_transaction_sync_identity
  ON finance_transactions (
    professional_profile_id,
    booking_id,
    (COALESCE(document->>'paymentPhase', '')),
    (COALESCE(document->>'payerKey', ''))
  )
  WHERE NULLIF(booking_id, '') IS NOT NULL
    AND status <> 'Voided';
