-- Convert legacy digit-string quantities/counts inside finance JSONB to JSON
-- numbers. Amount money keys were cleaned in 2026-10-05_z_existing_money_data_cleanup.sql;
-- this pass only covers quantity/count/bookings/vatRate leftover strings.

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
      cleaned := replace(replace(cleaned, '.', ''), ',', '.');
    ELSE
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

CREATE OR REPLACE FUNCTION public.normalize_count_jsonb(input JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result JSONB;
  entry RECORD;
  parsed NUMERIC;
  count_keys CONSTANT TEXT[] := ARRAY['quantity', 'count', 'bookings', 'vatRate'];
BEGIN
  IF input IS NULL THEN RETURN NULL; END IF;

  IF jsonb_typeof(input) = 'array' THEN
    SELECT COALESCE(jsonb_agg(public.normalize_count_jsonb(value)), '[]'::jsonb)
      INTO result
    FROM jsonb_array_elements(input);
    RETURN result;
  END IF;

  IF jsonb_typeof(input) <> 'object' THEN RETURN input; END IF;
  result := '{}'::jsonb;

  FOR entry IN SELECT key, value FROM jsonb_each(input)
  LOOP
    IF entry.key = ANY(count_keys) AND jsonb_typeof(entry.value) = 'string' THEN
      parsed := public.parse_legacy_money_text(entry.value #>> '{}');
      result := result || jsonb_build_object(
        entry.key,
        CASE WHEN parsed IS NULL THEN entry.value ELSE to_jsonb(parsed) END
      );
    ELSE
      result := result || jsonb_build_object(
        entry.key,
        public.normalize_count_jsonb(entry.value)
      );
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

UPDATE public.finance_transactions
SET document = public.normalize_count_jsonb(document)
WHERE document IS NOT NULL
  AND document::text ~ '"quantity"\s*:\s*"';

UPDATE public.finance_transactions
SET issued_document = public.normalize_count_jsonb(issued_document)
WHERE issued_document IS NOT NULL
  AND issued_document::text ~ '"quantity"\s*:\s*"';

UPDATE public.sales_addons
SET lines = public.normalize_count_jsonb(lines)
WHERE lines IS NOT NULL
  AND lines::text ~ '"quantity"\s*:\s*"';

UPDATE public.professional_clients
SET recent_services = public.normalize_count_jsonb(recent_services),
    booking_history = public.normalize_count_jsonb(booking_history)
WHERE (recent_services IS NOT NULL AND recent_services::text ~ '"(quantity|bookings|count)"\s*:\s*"')
   OR (booking_history IS NOT NULL AND booking_history::text ~ '"(quantity|bookings|count)"\s*:\s*"');

DROP FUNCTION public.normalize_count_jsonb(JSONB);
DROP FUNCTION public.parse_legacy_money_text(TEXT);
