-- The trigger creates finance_documents using NEW.id. It must run after the
-- finance_transactions row exists, otherwise the FK rejects every new sale.
DROP TRIGGER IF EXISTS trg_sync_finance_entity_records ON finance_transactions;

CREATE TRIGGER trg_sync_finance_entity_records
AFTER INSERT OR UPDATE OF status, document, issued_document, issued_at
ON finance_transactions
FOR EACH ROW EXECUTE FUNCTION sync_finance_entity_records();
