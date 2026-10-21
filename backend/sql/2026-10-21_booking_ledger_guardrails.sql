-- Production guardrails: prevent duplicate money events under concurrent clicks.
-- Soft app-level idempotency remains; these unique indexes are the hard backstop.

-- Void duplicate active rows (keep oldest) so the unique index can apply.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY finance_transaction_id, type
           ORDER BY created_at ASC, id ASC
         ) AS rn
    FROM transactions
   WHERE finance_transaction_id IS NOT NULL
     AND status <> 'voided'
)
UPDATE transactions t
   SET status = 'voided'
  FROM ranked r
 WHERE t.id = r.id
   AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS ux_transactions_finance_type_active
  ON transactions (finance_transaction_id, type)
  WHERE finance_transaction_id IS NOT NULL
    AND status <> 'voided';

-- Explicit client/server idempotency keys (refund/payment double-submit).
CREATE UNIQUE INDEX IF NOT EXISTS ux_transactions_idempotency_key_active
  ON transactions ((metadata->>'idempotency_key'))
  WHERE COALESCE(metadata->>'idempotency_key', '') <> ''
    AND status <> 'voided';
