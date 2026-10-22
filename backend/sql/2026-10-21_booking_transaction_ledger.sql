-- Event-driven booking money ledger (Fresha-style).
-- Distinct from finance_transactions (mutable invoice/document rows for the Finance UI).
-- Every monetary change is an immutable row; void via status → voided only.

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  client_id UUID,
  professional_profile_id UUID REFERENCES professional_profiles(id) ON DELETE SET NULL,
  finance_transaction_id UUID REFERENCES finance_transactions(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (
    type IN (
      'PAYMENT',
      'PREPAYMENT',
      'ADD_ON',
      'CANCELLATION_FEE',
      'REFUND',
      'DISCOUNT'
    )
  ),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (
    status IN ('pending', 'completed', 'voided', 'failed')
  ),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT transactions_booking_or_client_chk CHECK (
    booking_id IS NOT NULL OR client_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_transactions_booking_id
  ON transactions (booking_id, created_at);

CREATE INDEX IF NOT EXISTS idx_transactions_client_id
  ON transactions (client_id, created_at);

CREATE INDEX IF NOT EXISTS idx_transactions_booking_type_status
  ON transactions (booking_id, type, status);

CREATE INDEX IF NOT EXISTS idx_transactions_finance_tx
  ON transactions (finance_transaction_id)
  WHERE finance_transaction_id IS NOT NULL;

-- Immutability: block DELETE; UPDATE may only change status → voided.
CREATE OR REPLACE FUNCTION transactions_enforce_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'transactions rows are immutable; void with status=voided instead of DELETE';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.booking_id IS DISTINCT FROM OLD.booking_id
     OR NEW.client_id IS DISTINCT FROM OLD.client_id
     OR NEW.professional_profile_id IS DISTINCT FROM OLD.professional_profile_id
     OR NEW.finance_transaction_id IS DISTINCT FROM OLD.finance_transaction_id
     OR NEW.type IS DISTINCT FROM OLD.type
     OR NEW.amount IS DISTINCT FROM OLD.amount
     OR NEW.metadata IS DISTINCT FROM OLD.metadata
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'transactions rows are immutable; only status may change to voided';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'voided' THEN
    RAISE EXCEPTION 'transactions status may only transition to voided';
  END IF;

  IF OLD.status = 'voided' AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'voided transactions cannot change status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_transactions_immutability ON transactions;
CREATE TRIGGER trg_transactions_immutability
  BEFORE UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION transactions_enforce_immutability();
