ALTER TABLE finance_transactions
  ADD COLUMN IF NOT EXISTS issued_document JSONB,
  ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ;

UPDATE finance_transactions
SET issued_document = document,
    issued_at = COALESCE(issued_at, created_at)
WHERE issued_document IS NULL
  AND document IS NOT NULL;
