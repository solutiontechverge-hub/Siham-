-- Persist Connect Express account id so incomplete onboarding can resume.

ALTER TABLE professional_finance_settings
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

COMMENT ON COLUMN professional_finance_settings.stripe_account_id IS
  'Stripe Connect account id (acct_…); null = NOT_CONNECTED. Reused for AccountLink resume.';
