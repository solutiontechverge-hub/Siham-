-- Relational audit/index of sold catalog references. Catalog rows remain owned
-- by their source list; this table stores only the sold item's identifier.
CREATE TABLE IF NOT EXISTS finance_transaction_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finance_transaction_id UUID NOT NULL REFERENCES finance_transactions(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('serviceId', 'productId', 'uniqueItemCode')),
  source_reference TEXT NOT NULL CHECK (length(trim(source_reference)) > 0),
  quantity NUMERIC(12, 3) NOT NULL DEFAULT 1,
  description TEXT NOT NULL DEFAULT '',
  unit_price NUMERIC(12, 2),
  total_price NUMERIC(12, 2),
  vat_rate NUMERIC(5, 2),
  UNIQUE (finance_transaction_id, source_type, source_reference)
);

CREATE INDEX IF NOT EXISTS idx_finance_line_items_source
  ON finance_transaction_line_items (source_type, source_reference);

INSERT INTO finance_transaction_line_items
  (finance_transaction_id, source_type, source_reference, quantity, description, vat_rate)
SELECT ft.id,
       line->>'sourceType',
       trim(line->>'sourceReference'),
       COALESCE(NULLIF(line->>'quantity', '')::numeric, 1),
       COALESCE(line->>'description', ''),
       NULLIF(line->>'vatRate', '')::numeric
FROM finance_transactions ft
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(ft.document->'lineItems', '[]'::jsonb)) AS line
WHERE line->>'sourceType' IN ('serviceId', 'productId', 'uniqueItemCode')
  AND length(trim(COALESCE(line->>'sourceReference', ''))) > 0
ON CONFLICT (finance_transaction_id, source_type, source_reference) DO NOTHING;
