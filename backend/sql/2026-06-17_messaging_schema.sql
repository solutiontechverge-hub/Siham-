CREATE TABLE IF NOT EXISTS messaging_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  professional_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  peer_display_name TEXT NOT NULL,
  peer_email TEXT,
  peer_profile_id TEXT,
  booking_id TEXT,
  booking_meta TEXT,
  booking_status TEXT,
  location_type TEXT CHECK (location_type IN ('fixed', 'desired')),
  unlinked BOOLEAN NOT NULL DEFAULT false,
  avatar_seed TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_user_id, professional_user_id)
);

CREATE TABLE IF NOT EXISTS messaging_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES messaging_threads(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('client', 'professional')),
  body TEXT NOT NULL DEFAULT '',
  attachments JSONB NOT NULL DEFAULT '[]'::JSONB,
  deleted_for_everyone BOOLEAN NOT NULL DEFAULT false,
  client_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messaging_threads_client_user
  ON messaging_threads(client_user_id);

CREATE INDEX IF NOT EXISTS idx_messaging_threads_professional_user
  ON messaging_threads(professional_user_id);

CREATE INDEX IF NOT EXISTS idx_messaging_messages_thread_created
  ON messaging_messages(thread_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messaging_messages_created_at
  ON messaging_messages(created_at);

-- Dev seed: conversation between client@mollure.dev and pro@mollure.dev
INSERT INTO messaging_threads (
  client_user_id,
  professional_user_id,
  peer_display_name,
  peer_email,
  booking_id,
  booking_meta,
  booking_status,
  location_type,
  avatar_seed
)
SELECT
  client_user.id,
  pro_user.id,
  COALESCE(NULLIF(TRIM(ip.display_name), ''), NULLIF(TRIM(CONCAT(ip.first_name, ' ', ip.last_name)), ''), 'Mollure Client'),
  client_user.email,
  '34009',
  '34009 - Requested - FL',
  'requested',
  'fixed',
  'client'
FROM users client_user
JOIN users pro_user ON pro_user.email = 'pro@mollure.dev'
LEFT JOIN individual_profiles ip ON ip.user_id = client_user.id
WHERE client_user.email = 'client@mollure.dev'
ON CONFLICT (client_user_id, professional_user_id) DO NOTHING;

INSERT INTO messaging_messages (thread_id, sender_user_id, sender_role, body, created_at)
SELECT
  t.id,
  t.client_user_id,
  'client',
  'Hi, can we confirm the hot stone massage time?',
  NOW() - INTERVAL '2 hours'
FROM messaging_threads t
JOIN users client_user ON client_user.id = t.client_user_id
JOIN users pro_user ON pro_user.id = t.professional_user_id
WHERE client_user.email = 'client@mollure.dev'
  AND pro_user.email = 'pro@mollure.dev'
  AND NOT EXISTS (
    SELECT 1 FROM messaging_messages m WHERE m.thread_id = t.id
  );
