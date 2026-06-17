CREATE TABLE IF NOT EXISTS messaging_thread_reads (
  thread_id UUID NOT NULL REFERENCES messaging_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_message_id UUID REFERENCES messaging_messages(id) ON DELETE SET NULL,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_messaging_thread_reads_user_id
  ON messaging_thread_reads(user_id);
