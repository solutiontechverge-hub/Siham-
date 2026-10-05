-- Finance module: settings + transactions for professionals

CREATE TABLE IF NOT EXISTS professional_finance_settings (
  professional_profile_id UUID PRIMARY KEY REFERENCES professional_profiles(id) ON DELETE CASCADE,
  subscription_status TEXT NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active')),
  stripe_connect_status TEXT NOT NULL DEFAULT 'not_connected' CHECK (stripe_connect_status IN ('not_connected', 'onboarding', 'connected')),
  transaction_options JSONB NOT NULL DEFAULT '{
    "onlineImmediate": true,
    "onlineInvoiceDueDate": true,
    "offlineImmediate": true,
    "offlineInvoiceDueDate": false
  }'::jsonb,
  invoice_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_profile_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('onlineBooking', 'offlineBooking', 'manualEntry')),
  entry_id TEXT,
  transaction_date DATE,
  payment_deadline DATE,
  entry_label TEXT,
  client_name TEXT NOT NULL DEFAULT '',
  client_email TEXT NOT NULL DEFAULT '',
  client_type TEXT NOT NULL DEFAULT 'guest' CHECK (client_type IN ('mollure', 'nonMollure', 'business', 'guest')),
  gross_amount NUMERIC(12, 2),
  stripe_fee NUMERIC(12, 2),
  mollure_fee NUMERIC(12, 2),
  net_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  method_title TEXT NOT NULL DEFAULT '',
  method_detail TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending',
  status_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status_detail TEXT,
  note TEXT,
  booking_id TEXT,
  document JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_professional
  ON finance_transactions (professional_profile_id);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_professional_date
  ON finance_transactions (professional_profile_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_status
  ON finance_transactions (professional_profile_id, status);
