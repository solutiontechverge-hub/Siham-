-- Email wiring: professional validation, notification tracking, contact messages

ALTER TABLE professional_profiles
  ADD COLUMN IF NOT EXISTS validation_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (validation_status IN ('pending', 'validated', 'not_validated'));

CREATE TABLE IF NOT EXISTS user_email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, email_type)
);

CREATE INDEX IF NOT EXISTS idx_user_email_notifications_user_id
  ON user_email_notifications(user_id);

CREATE TABLE IF NOT EXISTS finance_email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES finance_transactions(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (transaction_id, email_type)
);

CREATE INDEX IF NOT EXISTS idx_finance_email_notifications_transaction_id
  ON finance_email_notifications(transaction_id);

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  persona TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'replied', 'closed')),
  reply_message TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id
  ON contact_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status
  ON contact_messages(status);
