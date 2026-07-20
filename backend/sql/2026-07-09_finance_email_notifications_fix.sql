-- Ensure finance email notification dedup table exists (required by invoice reminder job)

CREATE TABLE IF NOT EXISTS finance_email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES finance_transactions(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (transaction_id, email_type)
);

CREATE INDEX IF NOT EXISTS idx_finance_email_notifications_transaction_id
  ON finance_email_notifications(transaction_id);
