-- Canonical document records. The JSON snapshot remains an immutable payload,
-- while invoice/receipt identity and linkage live in relational rows.
CREATE TABLE IF NOT EXISTS finance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finance_transaction_id UUID NOT NULL REFERENCES finance_transactions(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('invoice', 'receipt')),
  document_number TEXT NOT NULL,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'issued',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (finance_transaction_id, document_type, document_number)
);

CREATE INDEX IF NOT EXISTS idx_finance_documents_transaction
  ON finance_documents (finance_transaction_id);

ALTER TABLE finance_transactions
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION sync_finance_entity_records()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  invoice_number TEXT;
  receipt_number TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at = NOW();
  END IF;

  invoice_number := NULLIF(TRIM(COALESCE(NEW.issued_document->>'documentNumber', NEW.document->>'documentNumber', '')), '');
  receipt_number := NULLIF(TRIM(COALESCE(NEW.issued_document->>'receiptNumber', NEW.document->>'receiptNumber', '')), '');

  IF invoice_number IS NOT NULL THEN
    INSERT INTO finance_documents (finance_transaction_id, document_type, document_number, snapshot, status, issued_at, updated_at)
    VALUES (NEW.id, 'invoice', invoice_number, COALESCE(NEW.issued_document, NEW.document, '{}'::jsonb), NEW.status, COALESCE(NEW.issued_at, NOW()), NOW())
    ON CONFLICT (finance_transaction_id, document_type, document_number)
    DO UPDATE SET snapshot = EXCLUDED.snapshot, status = EXCLUDED.status, updated_at = NOW();
  END IF;

  IF receipt_number IS NOT NULL THEN
    INSERT INTO finance_documents (finance_transaction_id, document_type, document_number, snapshot, status, issued_at, updated_at)
    VALUES (NEW.id, 'receipt', receipt_number, COALESCE(NEW.issued_document, NEW.document, '{}'::jsonb), NEW.status, COALESCE(NEW.issued_at, NOW()), NOW())
    ON CONFLICT (finance_transaction_id, document_type, document_number)
    DO UPDATE SET snapshot = EXCLUDED.snapshot, status = EXCLUDED.status, updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_finance_entity_records ON finance_transactions;
CREATE TRIGGER trg_sync_finance_entity_records
BEFORE INSERT OR UPDATE OF status, document, issued_document, issued_at ON finance_transactions
FOR EACH ROW EXECUTE FUNCTION sync_finance_entity_records();

-- Backfill document entities for transactions that predate this migration.
INSERT INTO finance_documents (finance_transaction_id, document_type, document_number, snapshot, status, issued_at)
SELECT id, 'invoice', NULLIF(TRIM(COALESCE(issued_document->>'documentNumber', document->>'documentNumber', '')), ''),
       COALESCE(issued_document, document, '{}'::jsonb), status, COALESCE(issued_at, created_at)
FROM finance_transactions
WHERE NULLIF(TRIM(COALESCE(issued_document->>'documentNumber', document->>'documentNumber', '')), '') IS NOT NULL
ON CONFLICT (finance_transaction_id, document_type, document_number) DO NOTHING;

INSERT INTO finance_documents (finance_transaction_id, document_type, document_number, snapshot, status, issued_at)
SELECT id, 'receipt', NULLIF(TRIM(COALESCE(issued_document->>'receiptNumber', document->>'receiptNumber', '')), ''),
       COALESCE(issued_document, document, '{}'::jsonb), status, COALESCE(issued_at, created_at)
FROM finance_transactions
WHERE NULLIF(TRIM(COALESCE(issued_document->>'receiptNumber', document->>'receiptNumber', '')), '') IS NOT NULL
ON CONFLICT (finance_transaction_id, document_type, document_number) DO NOTHING;
