-- Persist the payment/due deadline independently of the document snapshot.
ALTER TABLE finance_transactions
  ADD COLUMN IF NOT EXISTS payment_deadline DATE;

CREATE INDEX IF NOT EXISTS idx_finance_transactions_payment_deadline
  ON finance_transactions (payment_deadline)
  WHERE payment_deadline IS NOT NULL;
