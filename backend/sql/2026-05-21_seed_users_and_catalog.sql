-- Dev seed data (password for all users: Password123!)
-- Primary keys are auto-generated (DEFAULT gen_random_uuid()).
-- Re-runnable via ON CONFLICT / NOT EXISTS on natural keys (email, title, etc.).

INSERT INTO user_roles (title) VALUES
  ('owner'),
  ('staff')
ON CONFLICT (title) DO NOTHING;

INSERT INTO categories (title) VALUES
  ('Hair'),
  ('Beauty'),
  ('Nails')
ON CONFLICT (title) DO NOTHING;

INSERT INTO subcategories (category_id, title)
SELECT c.id, v.title
FROM categories c
CROSS JOIN (VALUES
  ('Hair', 'Haircut'),
  ('Hair', 'Color'),
  ('Beauty', 'Facial'),
  ('Nails', 'Manicure')
) AS v(category_title, title)
WHERE c.title = v.category_title
ON CONFLICT (category_id, title) DO NOTHING;

INSERT INTO users (user_type, email, password_hash, is_email_verified, is_active) VALUES
  (
    'professional',
    'pro@mollure.dev',
    '$2b$12$7GaIcjJAnFapd1QBXSZRu.2mhvD9ggO.BYgRlRfdOXiAlozqEgR8a',
    true,
    true
  ),
  (
    'individual',
    'client@mollure.dev',
    '$2b$12$7GaIcjJAnFapd1QBXSZRu.2mhvD9ggO.BYgRlRfdOXiAlozqEgR8a',
    true,
    true
  ),
  (
    'company',
    'company@mollure.dev',
    '$2b$12$7GaIcjJAnFapd1QBXSZRu.2mhvD9ggO.BYgRlRfdOXiAlozqEgR8a',
    true,
    true
  )
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  is_email_verified = EXCLUDED.is_email_verified,
  is_active = EXCLUDED.is_active;

INSERT INTO professional_profiles (
  user_id,
  legal_name,
  ccc_number,
  vat_number,
  street,
  street_number,
  postal_code,
  province,
  municipality,
  business_type,
  contact_first_name,
  contact_last_name,
  phone,
  service_location_mode
)
SELECT
  u.id,
  'Ryan Harris Salon BV',
  '12345678',
  'NL123456789B01',
  'Marina-Park',
  '50',
  '1784 AA',
  'Noord-Holland',
  'Den Helder',
  'salon',
  'Ryan',
  'Harris',
  '+31612345678',
  'fixed'
FROM users u
WHERE u.email = 'pro@mollure.dev'
ON CONFLICT (user_id) DO UPDATE SET
  legal_name = EXCLUDED.legal_name,
  service_location_mode = EXCLUDED.service_location_mode;

INSERT INTO individual_profiles (
  user_id,
  first_name,
  last_name,
  display_name,
  country_code,
  phone
)
SELECT
  u.id,
  'Alex',
  'Client',
  'Alex Client',
  '+31',
  '+31698765432'
FROM users u
WHERE u.email = 'client@mollure.dev'
ON CONFLICT (user_id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  display_name = EXCLUDED.display_name;

INSERT INTO company_profiles (
  user_id,
  legal_name,
  ccc_number,
  vat_number,
  street,
  street_number,
  postal_code,
  province,
  municipality,
  contact_first_name,
  contact_last_name,
  phone
)
SELECT
  u.id,
  'Mollure Demo Company BV',
  '87654321',
  'NL987654321B01',
  'Keizersgracht',
  '100',
  '1015 AA',
  'Noord-Holland',
  'Amsterdam',
  'Jamie',
  'Company',
  '+31611112222'
FROM users u
WHERE u.email = 'company@mollure.dev'
ON CONFLICT (user_id) DO UPDATE SET
  legal_name = EXCLUDED.legal_name;

INSERT INTO business_setups (
  professional_profile_id,
  location_mode,
  business_name,
  business_about,
  business_keywords,
  salon_name,
  fixed_location_address,
  fixed_location_street_number,
  fixed_location_postal_code,
  fixed_location_province,
  fixed_location_municipality,
  service_for,
  service_categories,
  book_service_combinations,
  price_range,
  prepayment_percentage
)
SELECT
  pp.id,
  'fixed',
  'Ryan Harris Salon',
  'Premium hair and beauty in Den Helder.',
  ARRAY['salon', 'hair', 'beauty'],
  'Ryan Harris Salon',
  'Marina-Park',
  '50',
  '1784 AA',
  'Noord-Holland',
  'Den Helder',
  ARRAY['women', 'men'],
  jsonb_build_array(
    jsonb_build_object(
      'category_id', hair_cat.id::text,
      'service_id', haircut_svc.id::text,
      'amount', 45,
      'duration_label', '45 min'
    ),
    jsonb_build_object(
      'category_id', hair_cat.id::text,
      'service_id', color_svc.id::text,
      'amount', 85,
      'duration_label', '90 min'
    )
  ),
  jsonb_build_array(
    jsonb_build_object(
      'category_id', hair_cat.id::text,
      'category_title', 'Hair',
      'service_id', haircut_svc.id::text,
      'service_title', 'Haircut'
    )
  ),
  '€€',
  20
FROM users u
INNER JOIN professional_profiles pp ON pp.user_id = u.id
CROSS JOIN categories hair_cat
CROSS JOIN subcategories haircut_svc
CROSS JOIN subcategories color_svc
WHERE u.email = 'pro@mollure.dev'
  AND hair_cat.title = 'Hair'
  AND haircut_svc.title = 'Haircut'
  AND haircut_svc.category_id = hair_cat.id
  AND color_svc.title = 'Color'
  AND color_svc.category_id = hair_cat.id
ON CONFLICT (professional_profile_id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  business_about = EXCLUDED.business_about,
  service_categories = EXCLUDED.service_categories,
  book_service_combinations = EXCLUDED.book_service_combinations,
  updated_at = NOW();

INSERT INTO business_team_members (
  business_setup_id,
  full_name,
  role,
  assigned_services,
  display_order
)
SELECT
  bs.id,
  'Ryan Harris',
  'Owner',
  jsonb_build_array(
    jsonb_build_object(
      'service_id', s.id::text,
      'title', 'Haircut'
    )
  ),
  1
FROM business_setups bs
INNER JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
INNER JOIN users u ON u.id = pp.user_id AND u.email = 'pro@mollure.dev'
INNER JOIN subcategories s ON s.title = 'Haircut'
INNER JOIN categories c ON c.id = s.category_id AND c.title = 'Hair'
WHERE bs.business_name = 'Ryan Harris Salon'
  AND NOT EXISTS (
    SELECT 1
    FROM business_team_members tm
    WHERE tm.business_setup_id = bs.id
      AND tm.full_name = 'Ryan Harris'
  );

UPDATE business_setups bs
SET team_member_ids = COALESCE(
  (
    SELECT ARRAY_AGG(tm.id ORDER BY tm.display_order, tm.created_at)
    FROM business_team_members tm
    WHERE tm.business_setup_id = bs.id
  ),
  '{}'::UUID[]
)
FROM professional_profiles pp
INNER JOIN users u ON u.id = pp.user_id AND u.email = 'pro@mollure.dev'
WHERE bs.professional_profile_id = pp.id
  AND bs.business_name = 'Ryan Harris Salon';
