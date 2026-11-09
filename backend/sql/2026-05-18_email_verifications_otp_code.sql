ALTER TABLE email_verifications
  ADD COLUMN IF NOT EXISTS otp_code TEXT;
