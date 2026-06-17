CREATE TABLE IF NOT EXISTS messaging_message_hides (
  message_id UUID NOT NULL REFERENCES messaging_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_messaging_message_hides_user
  ON messaging_message_hides(user_id);
