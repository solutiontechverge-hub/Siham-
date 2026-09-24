-- Pending email for change-email flow (committed only after verification link).
ALTER TABLE email_verifications
  ADD COLUMN IF NOT EXISTS new_email TEXT;
