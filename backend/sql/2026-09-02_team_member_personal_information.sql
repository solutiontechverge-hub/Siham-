ALTER TABLE business_team_members
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_number TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_number TEXT,
  ADD COLUMN IF NOT EXISTS personal_note TEXT,
  ADD COLUMN IF NOT EXISTS personal_documents JSONB NOT NULL DEFAULT '[]'::JSONB;
