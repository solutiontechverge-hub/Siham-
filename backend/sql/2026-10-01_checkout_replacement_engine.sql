-- Frozen checkout state and explicit replacement lineage.
ALTER TABLE finance_transactions
  ADD COLUMN IF NOT EXISTS checkout_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES finance_transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_link_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_link_active BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_finance_transactions_superseded_by
  ON finance_transactions (superseded_by);

CREATE OR REPLACE FUNCTION protect_replaced_finance_checkout()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.checkout_snapshot IS NULL THEN
    NEW.checkout_snapshot = COALESCE(NEW.document, '{}'::jsonb);
  END IF;
  IF NEW.status IN ('Voided', 'Paid', 'Prepaid', 'Refunded') THEN
    NEW.payment_link_active = FALSE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_replaced_finance_checkout ON finance_transactions;
CREATE TRIGGER trg_protect_replaced_finance_checkout
BEFORE INSERT OR UPDATE OF status, document, payment_link_active ON finance_transactions
FOR EACH ROW EXECUTE FUNCTION protect_replaced_finance_checkout();

UPDATE finance_transactions
   SET checkout_snapshot = COALESCE(document, '{}'::jsonb)
 WHERE checkout_snapshot IS NULL;
