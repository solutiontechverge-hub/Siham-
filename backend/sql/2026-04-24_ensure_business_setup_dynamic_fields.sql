DO $$
BEGIN
  IF to_regclass('public.business_setups') IS NOT NULL THEN
    EXECUTE $sql$
      ALTER TABLE business_setups
        ADD COLUMN IF NOT EXISTS salon_name TEXT,
        ADD COLUMN IF NOT EXISTS service_for TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
        ADD COLUMN IF NOT EXISTS service_categories JSONB NOT NULL DEFAULT '[]'::JSONB,
        ADD COLUMN IF NOT EXISTS no_show_fee_instruction TEXT
    $sql$;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.business_team_members') IS NOT NULL THEN
    EXECUTE $sql$
      ALTER TABLE business_team_members
        ADD COLUMN IF NOT EXISTS assigned_services JSONB NOT NULL DEFAULT '[]'::JSONB,
        ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 1
    $sql$;
  END IF;
END $$;
