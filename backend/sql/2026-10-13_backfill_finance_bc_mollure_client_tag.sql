-- Seed row 348 (Priya Sharma BC) was stored without document.client.isMollure,
-- so the finance table only showed BC (and wrapped it). Patch existing DBs.
UPDATE finance_transactions
SET document = jsonb_set(
  COALESCE(document, '{}'::jsonb),
  '{client}',
  COALESCE(document->'client', '{}'::jsonb) || jsonb_build_object(
    'legalName', COALESCE(document->'client'->>'legalName', client_name),
    'email', COALESCE(document->'client'->>'email', client_email),
    'isMollure', true
  ),
  true
)
WHERE entry_id = '348'
  AND client_type = 'business'
  AND COALESCE((document->'client'->>'isMollure')::boolean, false) IS NOT TRUE;
