-- Convert legacy formatted money strings inside JSONB into JSON numbers and
-- backfill first-class numeric finance columns. VAT labels remain unchanged.

CREATE OR REPLACE FUNCTION public.parse_legacy_money_text(input TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cleaned TEXT;
  last_comma INTEGER;
  last_dot INTEGER;
BEGIN
  IF input IS NULL OR btrim(input) = '' THEN RETURN NULL; END IF;
  cleaned := regexp_replace(input, '[^0-9,.-]', '', 'g');
  IF cleaned = '' OR cleaned = '-' THEN RETURN NULL; END IF;

  last_comma := strpos(reverse(cleaned), ',');
  last_dot := strpos(reverse(cleaned), '.');

  IF position(',' IN cleaned) > 0 AND position('.' IN cleaned) > 0 THEN
    IF last_comma < last_dot THEN
      -- Last comma occurs later in the original value: European 1.234,56.
      cleaned := replace(replace(cleaned, '.', ''), ',', '.');
    ELSE
      -- Last dot occurs later: 1,234.56.
      cleaned := replace(cleaned, ',', '');
    END IF;
  ELSIF position(',' IN cleaned) > 0 THEN
    IF cleaned ~ ',[0-9]{1,2}$' THEN
      cleaned := replace(cleaned, ',', '.');
    ELSE
      cleaned := replace(cleaned, ',', '');
    END IF;
  END IF;

  RETURN cleaned::numeric;
EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_money_jsonb(input JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result JSONB;
  entry RECORD;
  parsed NUMERIC;
  money_keys CONSTANT TEXT[] := ARRAY[
    'price', 'amount', 'totalPrice', 'unitPrice', 'pricePerUnit',
    'discountAmount', 'refundAmount', 'prepaymentAmount', 'paidAmount',
    'penaltyAmount', 'grossAmount', 'netAmount', 'stripeFee', 'mollureFee',
    'originalPrice', 'paymentAmount', 'feeAmount', 'subtotal', 'total'
  ];
BEGIN
  IF input IS NULL THEN RETURN NULL; END IF;

  IF jsonb_typeof(input) = 'array' THEN
    SELECT COALESCE(jsonb_agg(public.normalize_money_jsonb(value)), '[]'::jsonb)
      INTO result
    FROM jsonb_array_elements(input);
    RETURN result;
  END IF;

  IF jsonb_typeof(input) <> 'object' THEN RETURN input; END IF;
  result := '{}'::jsonb;

  FOR entry IN SELECT key, value FROM jsonb_each(input)
  LOOP
    IF entry.key = ANY(money_keys) AND jsonb_typeof(entry.value) = 'string' THEN
      parsed := public.parse_legacy_money_text(entry.value #>> '{}');
      result := result || jsonb_build_object(
        entry.key,
        CASE WHEN parsed IS NULL THEN entry.value ELSE to_jsonb(parsed) END
      );
    ELSE
      result := result || jsonb_build_object(
        entry.key,
        public.normalize_money_jsonb(entry.value)
      );
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

-- Preserve original snapshots structurally; only money leaf values change
-- from formatted strings to JSON numbers.
UPDATE public.finance_transactions
SET document = public.normalize_money_jsonb(document)
WHERE document IS NOT NULL;

UPDATE public.finance_transactions
SET issued_document = public.normalize_money_jsonb(issued_document)
WHERE issued_document IS NOT NULL;

UPDATE public.professional_finance_settings
SET invoice_settings = public.normalize_money_jsonb(invoice_settings)
WHERE invoice_settings IS NOT NULL;

UPDATE public.business_setups
SET service_categories = public.normalize_money_jsonb(service_categories)
WHERE service_categories IS NOT NULL;

UPDATE public.sales_addons
SET lines = public.normalize_money_jsonb(lines),
    discount = public.normalize_money_jsonb(discount)
WHERE lines IS NOT NULL OR discount IS NOT NULL;

UPDATE public.professional_clients
SET recent_services = public.normalize_money_jsonb(recent_services),
    booking_history = public.normalize_money_jsonb(booking_history)
WHERE recent_services IS NOT NULL OR booking_history IS NOT NULL;

-- Backfill canonical transaction amounts from normalized document snapshots.
UPDATE public.finance_transactions
SET discount_amount = COALESCE(
      discount_amount,
      public.parse_legacy_money_text(document->>'discountAmount'),
      0
    ),
    refund_amount = COALESCE(
      refund_amount,
      public.parse_legacy_money_text(document->>'refundAmount'),
      0
    ),
    prepayment_amount = COALESCE(
      prepayment_amount,
      public.parse_legacy_money_text(document->>'prepaymentAmount'),
      0
    ),
    paid_amount = COALESCE(
      paid_amount,
      public.parse_legacy_money_text(document->>'paidAmount'),
      0
    );

-- Fill relational line-item prices from the now-normalized JSON snapshot.
UPDATE public.finance_transaction_line_items AS target
SET unit_price = COALESCE(
      target.unit_price,
      public.parse_legacy_money_text(source.line->>'unitPrice'),
      public.parse_legacy_money_text(source.line->>'pricePerUnit')
    ),
    total_price = COALESCE(
      target.total_price,
      public.parse_legacy_money_text(source.line->>'totalPrice')
    )
FROM (
  SELECT ft.id AS transaction_id, line
  FROM public.finance_transactions AS ft
  CROSS JOIN LATERAL jsonb_array_elements(
    COALESCE(ft.document->'lineItems', '[]'::jsonb)
  ) AS line
) AS source
WHERE target.finance_transaction_id = source.transaction_id
  AND target.source_type = source.line->>'sourceType'
  AND target.source_reference = source.line->>'sourceReference';

DROP FUNCTION public.normalize_money_jsonb(JSONB);
DROP FUNCTION public.parse_legacy_money_text(TEXT);

