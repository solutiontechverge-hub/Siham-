-- Canonical numeric storage for monetary values.
-- Formatting (EUR, euro signs and thousands separators) belongs to the UI.

DO $$
DECLARE
  target RECORD;
  current_type TEXT;
BEGIN
  FOR target IN
    SELECT *
    FROM (VALUES
      ('bookings', 'total_price', 'NUMERIC(12,2)'),
      ('bookings', 'no_show_fee_amount', 'NUMERIC(12,2)'),
      ('bookings', 'no_show_fee_due', 'NUMERIC(12,2)'),
      ('finance_transactions', 'gross_amount', 'NUMERIC(12,2)'),
      ('finance_transactions', 'stripe_fee', 'NUMERIC(12,2)'),
      ('finance_transactions', 'mollure_fee', 'NUMERIC(12,2)'),
      ('finance_transactions', 'net_amount', 'NUMERIC(12,2)'),
      ('sales_addons', 'discount_amount', 'NUMERIC(12,2)'),
      ('sales_addons', 'total_price', 'NUMERIC(12,2)'),
      ('professional_clients', 'total_sales', 'NUMERIC(12,2)'),
      ('professional_clients', 'average_booking_value', 'NUMERIC(12,2)'),
      ('finance_transaction_line_items', 'quantity', 'NUMERIC(12,3)'),
      ('finance_transaction_line_items', 'unit_price', 'NUMERIC(12,2)'),
      ('finance_transaction_line_items', 'total_price', 'NUMERIC(12,2)'),
      ('finance_transaction_line_items', 'vat_rate', 'NUMERIC(5,2)')
    ) AS values_to_normalize(table_name, column_name, target_type)
  LOOP
    SELECT data_type
      INTO current_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND information_schema.columns.table_name = target.table_name
      AND information_schema.columns.column_name = target.column_name;

    IF current_type IS NOT NULL AND current_type <> 'numeric' THEN
      EXECUTE format(
        'ALTER TABLE public.%I ALTER COLUMN %I TYPE %s USING NULLIF(regexp_replace(%I::text, ''[^0-9.-]'', '''', ''g''), '''')::numeric',
        target.table_name,
        target.column_name,
        target.target_type,
        target.column_name
      );
    END IF;
  END LOOP;
END $$;

-- First-class numeric fields for amounts that were previously available only
-- inside formatted JSON document snapshots.
ALTER TABLE public.finance_transactions
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS prepayment_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2);

ALTER TABLE public.finance_transactions
  ALTER COLUMN net_amount SET DEFAULT 0,
  ALTER COLUMN discount_amount SET DEFAULT 0,
  ALTER COLUMN refund_amount SET DEFAULT 0,
  ALTER COLUMN prepayment_amount SET DEFAULT 0,
  ALTER COLUMN paid_amount SET DEFAULT 0;

ALTER TABLE public.finance_transactions
  DROP CONSTRAINT IF EXISTS finance_transactions_discount_amount_nonnegative,
  DROP CONSTRAINT IF EXISTS finance_transactions_refund_amount_nonnegative,
  DROP CONSTRAINT IF EXISTS finance_transactions_prepayment_amount_nonnegative,
  DROP CONSTRAINT IF EXISTS finance_transactions_paid_amount_nonnegative;

ALTER TABLE public.finance_transactions
  ADD CONSTRAINT finance_transactions_discount_amount_nonnegative
    CHECK (discount_amount IS NULL OR discount_amount >= 0),
  ADD CONSTRAINT finance_transactions_refund_amount_nonnegative
    CHECK (refund_amount IS NULL OR refund_amount >= 0),
  ADD CONSTRAINT finance_transactions_prepayment_amount_nonnegative
    CHECK (prepayment_amount IS NULL OR prepayment_amount >= 0),
  ADD CONSTRAINT finance_transactions_paid_amount_nonnegative
    CHECK (paid_amount IS NULL OR paid_amount >= 0);

