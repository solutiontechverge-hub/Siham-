-- Service reviews: one invite/review per completed booking; per shop + team member ratings.

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_setup_id UUID NOT NULL REFERENCES business_setups(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES business_team_members(id) ON DELETE SET NULL,
  client_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  rating SMALLINT CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  body TEXT,
  reviewer_display_name TEXT,
  reply_text TEXT,
  reply_author_name TEXT,
  replied_at TIMESTAMPTZ,
  replied_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  invite_token TEXT NOT NULL UNIQUE,
  invite_expires_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reviews_booking_unique UNIQUE (booking_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_business_setup_id ON reviews (business_setup_id);
CREATE INDEX IF NOT EXISTS idx_reviews_team_member_id ON reviews (team_member_id);
CREATE INDEX IF NOT EXISTS idx_reviews_invite_token ON reviews (invite_token);
CREATE INDEX IF NOT EXISTS idx_reviews_submitted_at ON reviews (submitted_at DESC)
  WHERE submitted_at IS NOT NULL;
