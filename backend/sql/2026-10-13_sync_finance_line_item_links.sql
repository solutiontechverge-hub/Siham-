-- Keep finance_transaction_line_items in sync with document snapshots (same
-- pattern as finance_documents). Catalog masters stay outside the sale row;
-- this table stores only sourceType + sourceReference (+ issued snapshot fields).

CREATE OR REPLACE FUNCTION sync_finance_entity_records()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  invoice_number TEXT;
  receipt_number TEXT;
  line_payload JSONB;
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

  line_payload := COALESCE(NEW.issued_document->'lineItems', NEW.document->'lineItems', '[]'::jsonb);
  DELETE FROM finance_transaction_line_items WHERE finance_transaction_id = NEW.id;
  INSERT INTO finance_transaction_line_items
    (finance_transaction_id, source_type, source_reference, quantity, description, unit_price, total_price, vat_rate)
  SELECT NEW.id,
         line->>'sourceType',
         trim(line->>'sourceReference'),
         COALESCE(NULLIF(line->>'quantity', '')::numeric, 1),
         COALESCE(line->>'description', ''),
         NULLIF(line->>'pricePerUnit', '')::numeric,
         NULLIF(line->>'totalPrice', '')::numeric,
         NULLIF(line->>'vatRate', '')::numeric
  FROM jsonb_array_elements(line_payload) AS line
  WHERE line->>'sourceType' IN ('serviceId', 'productId', 'uniqueItemCode')
    AND length(trim(COALESCE(line->>'sourceReference', ''))) > 0
  ON CONFLICT (finance_transaction_id, source_type, source_reference) DO UPDATE
    SET quantity = EXCLUDED.quantity,
        description = EXCLUDED.description,
        unit_price = EXCLUDED.unit_price,
        total_price = EXCLUDED.total_price,
        vat_rate = EXCLUDED.vat_rate;

  RETURN NEW;
END;
$$;

-- Heal empty / text-only document lines from booking.service_id without inventing
-- catalog rows. Snapshot name/price stay; only sourceType/sourceReference are filled.
UPDATE finance_transactions ft
SET document = jsonb_set(
      COALESCE(ft.document, '{}'::jsonb),
      '{lineItems}',
      CASE
        WHEN jsonb_array_length(COALESCE(ft.document->'lineItems', '[]'::jsonb)) = 0 THEN
          jsonb_build_array(
            jsonb_build_object(
              'description', COALESCE(NULLIF(trim(s.title), ''), 'Service'),
              'sourceType', 'serviceId',
              'sourceReference', b.service_id::text,
              'quantity', '1',
              'vat', '0%',
              'vatRate', 0,
              'pricePerUnit', COALESCE(ft.gross_amount, 0),
              'totalPrice', COALESCE(ft.gross_amount, 0)
            )
          )
        ELSE (
          SELECT COALESCE(jsonb_agg(
            CASE
              WHEN NULLIF(trim(COALESCE(line->>'sourceReference', '')), '') IS NULL
                AND NULLIF(trim(COALESCE(line->>'description', '')), '') IS NOT NULL
              THEN line || jsonb_build_object(
                'sourceType', 'serviceId',
                'sourceReference', b.service_id::text
              )
              ELSE line
            END
          ), '[]'::jsonb)
          FROM jsonb_array_elements(COALESCE(ft.document->'lineItems', '[]'::jsonb)) AS line
        )
      END
    ),
    issued_document = CASE
      WHEN ft.issued_document IS NULL THEN ft.issued_document
      ELSE jsonb_set(
        ft.issued_document,
        '{lineItems}',
        CASE
          WHEN jsonb_array_length(COALESCE(ft.issued_document->'lineItems', '[]'::jsonb)) = 0 THEN
            jsonb_build_array(
              jsonb_build_object(
                'description', COALESCE(NULLIF(trim(s.title), ''), 'Service'),
                'sourceType', 'serviceId',
                'sourceReference', b.service_id::text,
                'quantity', '1',
                'vat', '0%',
                'vatRate', 0,
                'pricePerUnit', COALESCE(ft.gross_amount, 0),
                'totalPrice', COALESCE(ft.gross_amount, 0)
              )
            )
          ELSE (
            SELECT COALESCE(jsonb_agg(
              CASE
                WHEN NULLIF(trim(COALESCE(line->>'sourceReference', '')), '') IS NULL
                  AND NULLIF(trim(COALESCE(line->>'description', '')), '') IS NOT NULL
                THEN line || jsonb_build_object(
                  'sourceType', 'serviceId',
                  'sourceReference', b.service_id::text
                )
                ELSE line
              END
            ), '[]'::jsonb)
            FROM jsonb_array_elements(COALESCE(ft.issued_document->'lineItems', '[]'::jsonb)) AS line
          )
        END
      )
    END,
    updated_at = NOW()
FROM bookings b
LEFT JOIN subcategories s ON s.id = b.service_id
WHERE b.service_id IS NOT NULL
  AND (b.unique_code = ft.booking_id OR b.id::text = ft.booking_id)
  AND (
    jsonb_array_length(COALESCE(ft.document->'lineItems', '[]'::jsonb)) = 0
    -- Single text-only line: safe to attach bookings.service_id. Multi-line
    -- text-only rows are left alone (would invent the wrong catalog link).
    OR (
      jsonb_array_length(COALESCE(ft.document->'lineItems', '[]'::jsonb)) = 1
      AND NULLIF(trim(COALESCE(ft.document->'lineItems'->0->>'sourceReference', '')), '') IS NULL
      AND NULLIF(trim(COALESCE(ft.document->'lineItems'->0->>'description', '')), '') IS NOT NULL
    )
  );

-- Full relational backfill after heal (trigger only fires on future writes).
DELETE FROM finance_transaction_line_items;
INSERT INTO finance_transaction_line_items
  (finance_transaction_id, source_type, source_reference, quantity, description, unit_price, total_price, vat_rate)
SELECT ft.id,
       line->>'sourceType',
       trim(line->>'sourceReference'),
       COALESCE(NULLIF(line->>'quantity', '')::numeric, 1),
       COALESCE(line->>'description', ''),
       NULLIF(line->>'pricePerUnit', '')::numeric,
       NULLIF(line->>'totalPrice', '')::numeric,
       NULLIF(line->>'vatRate', '')::numeric
FROM finance_transactions ft
CROSS JOIN LATERAL jsonb_array_elements(
  COALESCE(ft.issued_document->'lineItems', ft.document->'lineItems', '[]'::jsonb)
) AS line
WHERE line->>'sourceType' IN ('serviceId', 'productId', 'uniqueItemCode')
  AND length(trim(COALESCE(line->>'sourceReference', ''))) > 0
ON CONFLICT (finance_transaction_id, source_type, source_reference) DO NOTHING;
