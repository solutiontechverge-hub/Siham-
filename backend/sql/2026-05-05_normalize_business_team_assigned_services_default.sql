DO $$
BEGIN
  IF to_regclass('public.business_team_members') IS NOT NULL THEN
    EXECUTE $sql$
      ALTER TABLE business_team_members
        ALTER COLUMN assigned_services SET DEFAULT '[]'::JSONB
    $sql$;

    EXECUTE $sql$
      UPDATE business_team_members
      SET assigned_services = '[]'::JSONB
      WHERE assigned_services = '{}'::JSONB
    $sql$;
  END IF;
END $$;
