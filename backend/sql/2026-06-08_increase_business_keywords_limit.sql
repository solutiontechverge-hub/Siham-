-- Increase business_keywords limit from 3 to 5.

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'business_setups'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%cardinality(business_keywords)%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE business_setups DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE business_setups
  ADD CONSTRAINT business_setups_business_keywords_max_check
  CHECK (cardinality(business_keywords) <= 5);
