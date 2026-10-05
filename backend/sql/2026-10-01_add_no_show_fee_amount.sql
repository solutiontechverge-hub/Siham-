ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS no_show_fee_amount NUMERIC(12, 2);
