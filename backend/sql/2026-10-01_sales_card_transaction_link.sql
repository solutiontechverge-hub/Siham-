-- Make sales cards first-class persisted entities linked to the finance row
-- that represents the sale. The link is nullable for cards created before a
-- payment row exists, then is filled by the metadata upsert endpoint.
ALTER TABLE sales_card_metadata
  ADD COLUMN IF NOT EXISTS finance_transaction_id UUID
    REFERENCES finance_transactions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_card_metadata_transaction
  ON sales_card_metadata (finance_transaction_id);
