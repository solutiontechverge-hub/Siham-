-- Admin management extras + user favourites.
-- Compatible with existing admin_roles (uuid id + slug) and admin_users tables.

DO $$
BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
  ALTER TABLE users
    ADD CONSTRAINT users_user_type_check
    CHECK (user_type IN ('individual', 'company', 'professional', 'admin'));
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Ensure system roles exist (existing table uses uuid id + text slug).
INSERT INTO admin_roles (slug, name, description, kind, icon, permissions)
VALUES
  (
    'super_admin',
    'Super Admin',
    'Full access to all platform modules',
    'system',
    'crown',
    '{"dashboard":"full","access_management":"full","listing_ranking":"full","professional_management":"full","client_management":"full","rating_reviews":"full","reports":"full","messaging":"full","seo":"full","activity_log":"full","platform_management":"full","messaging_email":"full"}'::jsonb
  ),
  (
    'developer_support',
    'Developer Support',
    'Technical support with view access to most modules',
    'system',
    'code',
    '{"dashboard":"full","access_management":"view","listing_ranking":"view","professional_management":"full","client_management":"full","rating_reviews":"full","reports":"full","messaging":"full","seo":"view","activity_log":"full","platform_management":"view","messaging_email":"full"}'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_flagged_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_rating_category_settings (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  min_rating NUMERIC(3,1) NOT NULL,
  max_rating NUMERIC(3,1) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO admin_rating_category_settings (id, label, min_rating, max_rating)
VALUES
  ('excellent', 'Excellent', 4.5, 5.0),
  ('good', 'Good', 3.5, 4.4),
  ('average', 'Average', 2.5, 3.4),
  ('poor', 'Poor', 1.0, 2.4)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS platform_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_code TEXT NOT NULL UNIQUE,
  reporter_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter_name TEXT NOT NULL DEFAULT '',
  reporter_email TEXT NOT NULL DEFAULT '',
  reporter_phone TEXT NOT NULL DEFAULT '',
  reporter_type TEXT NOT NULL DEFAULT 'Individual Client',
  reported_name TEXT NOT NULL DEFAULT '',
  reported_email TEXT NOT NULL DEFAULT '',
  reported_phone TEXT NOT NULL DEFAULT '',
  reported_type TEXT NOT NULL DEFAULT 'Professional',
  reason_category TEXT NOT NULL DEFAULT 'Other',
  reason_description TEXT NOT NULL DEFAULT '',
  additional_details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'viewed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_reports_status ON platform_reports(status);
CREATE INDEX IF NOT EXISTS idx_platform_reports_created_at ON platform_reports(created_at DESC);

-- Optional link from users-table admins to roles (uuid FK).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS admin_role_id UUID REFERENCES admin_roles(id) ON DELETE SET NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS user_favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_setup_id UUID NOT NULL REFERENCES business_setups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, business_setup_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);

INSERT INTO admin_flagged_keywords (keyword)
VALUES ('scam'), ('fraud'), ('terrible service'), ('refund now')
ON CONFLICT (keyword) DO NOTHING;
