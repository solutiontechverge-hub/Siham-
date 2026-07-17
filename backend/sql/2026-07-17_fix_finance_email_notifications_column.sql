-- Older databases created finance_email_notifications with a column named
-- `finance_transaction_id`, but the app code and the canonical email-wiring
-- migration expect `transaction_id`. Rename it when the legacy column exists.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'finance_email_notifications'
      AND column_name = 'finance_transaction_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'finance_email_notifications'
      AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE finance_email_notifications
      RENAME COLUMN finance_transaction_id TO transaction_id;
  END IF;
END $$;
