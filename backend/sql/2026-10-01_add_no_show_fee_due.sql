ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS no_show_fee_due NUMERIC(12, 2);
