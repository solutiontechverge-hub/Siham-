DO $$
BEGIN
  IF to_regclass('public.business_setups') IS NOT NULL THEN
    EXECUTE $sql$
      ALTER TABLE business_setups
        ADD COLUMN IF NOT EXISTS section_sync_settings JSONB NOT NULL DEFAULT '{}'::JSONB
    $sql$;
  END IF;
END $$;
