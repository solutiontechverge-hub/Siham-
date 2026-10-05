-- Normalize legacy finance amount columns that were previously persisted as
-- formatted text (for example: €1,111,111 or €-10). Current installations
-- already use NUMERIC, so this is intentionally idempotent.
DO $$
DECLARE
  v_column_name text;
  column_type text;
BEGIN
  FOREACH v_column_name IN ARRAY ARRAY['gross_amount', 'stripe_fee', 'mollure_fee', 'net_amount']
  LOOP
    SELECT data_type INTO column_type
      FROM information_schema.columns AS c
     WHERE table_schema = 'public'
       AND table_name = 'finance_transactions'
       AND c.column_name = v_column_name;

    IF column_type IN ('character varying', 'text', 'character') THEN
      EXECUTE format(
        'ALTER TABLE public.finance_transactions ALTER COLUMN %I TYPE NUMERIC(12,2) USING NULLIF(regexp_replace(%I::text, ''[^0-9.-]'', '''', ''g''), '''')::numeric',
        v_column_name, v_column_name
      );
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.finance_transactions
  ALTER COLUMN net_amount SET DEFAULT 0;
