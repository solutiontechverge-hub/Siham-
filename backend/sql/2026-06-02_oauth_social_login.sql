-- Social login (Google / Apple): nullable password, provider + subject identifiers.

ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'password';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS oauth_subject TEXT;

UPDATE users
SET auth_provider = 'password'
WHERE auth_provider IS NULL OR auth_provider = '';

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_auth_provider_check;

ALTER TABLE users
  ADD CONSTRAINT users_auth_provider_check
  CHECK (auth_provider IN ('password', 'google', 'apple'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth_provider_subject
  ON users (auth_provider, oauth_subject)
  WHERE oauth_subject IS NOT NULL;
