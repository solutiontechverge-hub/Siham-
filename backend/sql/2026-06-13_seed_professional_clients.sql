-- Seed professional client list + bookings for pro@mollure.dev (password: Password123!)

INSERT INTO users (user_type, email, password_hash, is_email_verified, is_active) VALUES
  ('individual', 'emma.stone@mollure.dev', '$2b$12$7GaIcjJAnFapd1QBXSZRu.2mhvD9ggO.BYgRlRfdOXiAlozqEgR8a', true, true),
  ('individual', 'priya.s@mollure.dev', '$2b$12$7GaIcjJAnFapd1QBXSZRu.2mhvD9ggO.BYgRlRfdOXiAlozqEgR8a', true, true),
  ('individual', 'sara.johnson@mollure.dev', '$2b$12$7GaIcjJAnFapd1QBXSZRu.2mhvD9ggO.BYgRlRfdOXiAlozqEgR8a', true, true)
ON CONFLICT (email) DO UPDATE SET is_email_verified = EXCLUDED.is_email_verified, is_active = EXCLUDED.is_active;

INSERT INTO individual_profiles (user_id, first_name, last_name, display_name, country_code, phone, gender, date_of_birth)
SELECT u.id, v.first_name, v.last_name, v.display_name, v.country_code, v.phone, v.gender, v.dob::date
FROM users u
INNER JOIN (VALUES
  ('emma.stone@mollure.dev', 'Emma', 'Stone', 'Emma Stone', '+31', '+31611223344', 'Female', '1992-03-15'),
  ('priya.s@mollure.dev', 'Priya', 'Sharma', 'Priya Sharma', '+91', '+919876543210', 'Female', '1988-01-01'),
  ('sara.johnson@mollure.dev', 'Sara', 'Johnson', 'Sara Johnson', '+31', '+31612345649', 'Female', '1990-06-20')
) AS v(email, first_name, last_name, display_name, country_code, phone, gender, dob) ON u.email = v.email
ON CONFLICT (user_id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  display_name = EXCLUDED.display_name,
  phone = EXCLUDED.phone,
  gender = EXCLUDED.gender,
  date_of_birth = EXCLUDED.date_of_birth;

INSERT INTO bookings (
  booking_date, business_setup_id, customer_id, service_id, team_member_id,
  start_time, end_time, location_type, status, booking_type, unique_code, total_price, contact_number
)
SELECT v.booking_date::date, bs.id, cu.id, s.id, tm.id,
  (v.booking_date || ' 10:00:00+00')::timestamptz,
  (v.booking_date || ' 11:00:00+00')::timestamptz,
  'fixed', v.status, 'online', v.unique_code, v.total_price, v.contact_number
FROM users pro
INNER JOIN professional_profiles pp ON pp.user_id = pro.id AND pro.email = 'pro@mollure.dev'
INNER JOIN business_setups bs ON bs.professional_profile_id = pp.id
INNER JOIN LATERAL (
  SELECT id FROM business_team_members WHERE business_setup_id = bs.id ORDER BY display_order ASC NULLS LAST, created_at ASC LIMIT 1
) tm ON true
INNER JOIN subcategories s ON s.title = 'Haircut'
INNER JOIN categories c ON c.id = s.category_id AND c.title = 'Hair'
CROSS JOIN (VALUES
  ('client@mollure.dev', '2025-05-13', 'confirmed', 'BK-PC-10001', 85.00, '+31698765432'),
  ('company@mollure.dev', '2025-06-21', 'completed', 'BK-PC-10002', 135.00, '+31611112222'),
  ('priya.s@mollure.dev', '2025-07-15', 'confirmed', 'BK-PC-10003', 320.00, '+919876543210')
) AS v(customer_email, booking_date, status, unique_code, total_price, contact_number)
INNER JOIN users cu ON cu.email = v.customer_email
WHERE NOT EXISTS (SELECT 1 FROM bookings b WHERE b.unique_code = v.unique_code);

-- Sara Johnson (Mollure company)
INSERT INTO professional_clients (
  professional_profile_id, mollure_user_id, client_kind, is_mollure, display_name, email, phone,
  technical_note, total_sales, last_booking_date, bookings_completed, average_booking_value,
  recent_services, booking_history, legal_name, coc, vat, contact_person_name, gender, business_address,
  detail_email, created_at
)
SELECT pp.id, mu.id, 'company', true, 'Beauty & Wellness corp', 'sarajohnson@gmail.com', '+31 612345849',
  'Prefers morning slots.', 25450, '2022-12-15', 18, 50,
  '[{"name":"Hair Styling","price":"€85"},{"name":"Manicure","price":"€45"}]'::jsonb,
  '[{"period":"December 2024","bookings":3},{"period":"January 2025","bookings":5}]'::jsonb,
  'Beauty & Wellness corp', '134543', '134504', 'sana', 'Female', '123 business street',
  'sanajohnson@gmail.com', '2023-07-20'::timestamptz
FROM users pro
INNER JOIN professional_profiles pp ON pp.user_id = pro.id AND pro.email = 'pro@mollure.dev'
LEFT JOIN users mu ON mu.email = 'sara.johnson@mollure.dev'
ON CONFLICT (professional_profile_id, email) DO NOTHING;

-- Alex Client (Mollure individual, no-show)
INSERT INTO professional_clients (
  professional_profile_id, mollure_user_id, client_kind, is_mollure, display_name, email, phone,
  has_no_show, total_sales, last_booking_date, bookings_completed, average_booking_value,
  recent_services, booking_history, first_name, last_name, gender, date_of_birth, residential_address, created_at
)
SELECT pp.id, mu.id, 'individual', true, 'Alex Client', 'alexmartin@gmail.com', '+44 20 7946 0958',
  true, 3400, '2025-05-13', 9, 78,
  '[{"name":"Beard trim","price":"€35"},{"name":"Haircut","price":"€55"}]'::jsonb,
  '[{"period":"April 2025","bookings":2},{"period":"May 2025","bookings":4}]'::jsonb,
  'Alex', 'Client', 'Male', '1990-12-04', '45 Canal St, Amsterdam', '2024-03-02'::timestamptz
FROM users pro
INNER JOIN professional_profiles pp ON pp.user_id = pro.id AND pro.email = 'pro@mollure.dev'
LEFT JOIN users mu ON mu.email = 'client@mollure.dev'
ON CONFLICT (professional_profile_id, email) DO NOTHING;

-- Emma van Dijk (Non-Mollure, blocked)
INSERT INTO professional_clients (
  professional_profile_id, client_kind, is_mollure, display_name, email, phone, is_blocked,
  total_sales, last_booking_date, bookings_completed, average_booking_value,
  recent_services, booking_history, first_name, last_name, gender, date_of_birth, residential_address, created_at
)
SELECT pp.id, 'individual', false, 'Emma van Dijk', 'emma.vd@gmail.com', '+971 50 123 4567', true,
  2150, '2025-06-05', 6, 62,
  '[{"name":"Color treatment","price":"€120"}]'::jsonb,
  '[{"period":"June 2025","bookings":2}]'::jsonb,
  'Emma', 'van Dijk', 'Female', '1995-08-22', '12 Keizersgracht, Utrecht', '2025-01-09'::timestamptz
FROM users pro
INNER JOIN professional_profiles pp ON pp.user_id = pro.id AND pro.email = 'pro@mollure.dev'
ON CONFLICT (professional_profile_id, email) DO NOTHING;

-- Northwind BV (Non-Mollure company)
INSERT INTO professional_clients (
  professional_profile_id, client_kind, is_mollure, display_name, email, phone, technical_note,
  total_sales, last_booking_date, bookings_completed, average_booking_value,
  recent_services, booking_history, legal_name, coc, vat, contact_person_name, gender, business_address,
  detail_email, created_at
)
SELECT pp.id, 'company', false, 'Northwind Trading BV', 'billing@northwind.nl', '+92 333 1122334',
  'Corporate account — invoice monthly.', 950, '2025-06-21', 4, 88,
  '[{"name":"Team workshop","price":"€400"},{"name":"Chair massage","price":"€60"}]'::jsonb,
  '[{"period":"June 2025","bookings":1}]'::jsonb,
  'Northwind Trading BV', '882211', 'NL009988776', 'Imran Khan', 'Male', '88 Harbor Rd, Rotterdam',
  'ops@northwind.nl', '2024-11-05'::timestamptz
FROM users pro
INNER JOIN professional_profiles pp ON pp.user_id = pro.id AND pro.email = 'pro@mollure.dev'
ON CONFLICT (professional_profile_id, email) DO NOTHING;

-- Priya Sharma (Mollure individual)
INSERT INTO professional_clients (
  professional_profile_id, mollure_user_id, client_kind, is_mollure, display_name, email, phone,
  total_sales, last_booking_date, bookings_completed, average_booking_value,
  recent_services, booking_history, first_name, last_name, gender, date_of_birth, residential_address, created_at
)
SELECT pp.id, mu.id, 'individual', true, 'Priya Sharma', 'priya.s@gmail.com', '+91 98765 43210',
  5600, '2025-07-15', 22, 95,
  '[{"name":"Bridal package","price":"€320"},{"name":"Spa day","price":"€180"}]'::jsonb,
  '[{"period":"June 2025","bookings":6},{"period":"July 2025","bookings":4}]'::jsonb,
  'Priya', 'Sharma', 'Female', '1988-01-01', '9 MG Road, Bengaluru', '2023-02-14'::timestamptz
FROM users pro
INNER JOIN professional_profiles pp ON pp.user_id = pro.id AND pro.email = 'pro@mollure.dev'
LEFT JOIN users mu ON mu.email = 'priya.s@mollure.dev'
ON CONFLICT (professional_profile_id, email) DO NOTHING;

-- Mollure Demo Company
INSERT INTO professional_clients (
  professional_profile_id, mollure_user_id, client_kind, is_mollure, display_name, email, phone,
  total_sales, last_booking_date, bookings_completed, average_booking_value,
  recent_services, booking_history, legal_name, coc, vat, contact_person_name, business_address,
  detail_email, created_at
)
SELECT pp.id, mu.id, 'company', true, 'Mollure Demo Company BV', 'company@mollure.dev', '+31 611112222',
  4800, '2025-08-08', 14, 54,
  '[{"name":"Sports massage","price":"€70"}]'::jsonb,
  '[{"period":"August 2025","bookings":3}]'::jsonb,
  'Mollure Demo Company BV', '87654321', 'NL987654321B01', 'Jamie Company', 'Keizersgracht 100, Amsterdam',
  'company@mollure.dev', '2024-08-01'::timestamptz
FROM users pro
INNER JOIN professional_profiles pp ON pp.user_id = pro.id AND pro.email = 'pro@mollure.dev'
LEFT JOIN users mu ON mu.email = 'company@mollure.dev'
ON CONFLICT (professional_profile_id, email) DO NOTHING;
