-- Mollure subscription billing anniversary + auto-pay (Finance → Stripe settings)

ALTER TABLE professional_finance_settings
  ADD COLUMN IF NOT EXISTS subscription_activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_renews_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_pay BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS subscription_last_payment_at TIMESTAMPTZ;

COMMENT ON COLUMN professional_finance_settings.subscription_activated_at IS
  'Calendar moment subscription became active (billing anniversary day-of-month).';
COMMENT ON COLUMN professional_finance_settings.subscription_renews_at IS
  'Next renewal attempt / deadline; past-due without successful charge → inactive.';
COMMENT ON COLUMN professional_finance_settings.auto_pay IS
  'When true, charge saved card on renews_at before deactivating; when false, manual pay required.';
