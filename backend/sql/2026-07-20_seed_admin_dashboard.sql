-- Admin dashboard demo data (relative to CURRENT_DATE so KPI/chart ranges stay populated).
-- Password for all seeded users: Password123!
-- Idempotent via email / unique_code / activity action+detail keys.

INSERT INTO users (user_type, email, password_hash, is_email_verified, is_active, created_at) VALUES
  ('professional', 'glamour@mollure.dev', '$2b$12$7GaIcjJAnFapd1QBXSZRu.2mhvD9ggO.BYgRlRfdOXiAlozqEgR8a', true, true, CURRENT_DATE - INTERVAL '5 days'),
  ('professional', 'sarah.beauty@mollure.dev', '$2b$12$7GaIcjJAnFapd1QBXSZRu.2mhvD9ggO.BYgRlRfdOXiAlozqEgR8a', true, true, CURRENT_DATE - INTERVAL '4 days'),
  ('professional', 'luxe@mollure.dev', '$2b$12$7GaIcjJAnFapd1QBXSZRu.2mhvD9ggO.BYgRlRfdOXiAlozqEgR8a', true, true, CURRENT_DATE - INTERVAL '12 days'),
  ('professional', 'glowup@mollure.dev', '$2b$12$7GaIcjJAnFapd1QBXSZRu.2mhvD9ggO.BYgRlRfdOXiAlozqEgR8a', true, true, CURRENT_DATE - INTERVAL '20 days'),
  ('individual', 'dash.ic1@mollure.dev', '$2b$12$7GaIcjJAnFapd1QBXSZRu.2mhvD9ggO.BYgRlRfdOXiAlozqEgR8a', true, true, CURRENT_DATE - INTERVAL '1 day'),
  ('individual', 'dash.ic2@mollure.dev', '$2b$12$7GaIcjJAnFapd1QBXSZRu.2mhvD9ggO.BYgRlRfdOXiAlozqEgR8a', true, true, CURRENT_DATE - INTERVAL '2 days'),
  ('individual', 'dash.ic3@mollure.dev', '$2b$12$7GaIcjJAnFapd1QBXSZRu.2mhvD9ggO.BYgRlRfdOXiAlozqEgR8a', true, true, CURRENT_DATE - INTERVAL '3 days'),
  ('individual', 'dash.ic4@mollure.dev', '$2b$12$7GaIcjJAnFapd1QBXSZRu.2mhvD9ggO.BYgRlRfdOXiAlozqEgR8a', true, true, CURRENT_DATE - INTERVAL '6 days'),
  ('individual', 'dash.ic5@mollure.dev', '$2b$12$7GaIcjJAnFapd1QBXSZRu.2mhvD9ggO.BYgRlRfdOXiAlozqEgR8a', true, true, CURRENT_DATE - INTERVAL '8 days'),
  ('company', 'dash.cc1@mollure.dev', '$2b$12$7GaIcjJAnFapd1QBXSZRu.2mhvD9ggO.BYgRlRfdOXiAlozqEgR8a', true, true, CURRENT_DATE - INTERVAL '2 days'),
  ('company', 'dash.cc2@mollure.dev', '$2b$12$7GaIcjJAnFapd1QBXSZRu.2mhvD9ggO.BYgRlRfdOXiAlozqEgR8a', true, true, CURRENT_DATE - INTERVAL '5 days')
ON CONFLICT (email) DO UPDATE SET
  is_email_verified = EXCLUDED.is_email_verified,
  is_active = EXCLUDED.is_active;

INSERT INTO professional_profiles (
  user_id, legal_name, municipality, province, contact_first_name, contact_last_name, phone, service_location_mode
)
SELECT u.id, v.legal_name, v.municipality, v.province, v.first_name, v.last_name, v.phone, v.mode
FROM users u
INNER JOIN (VALUES
  ('glamour@mollure.dev', 'Glamour Studio BV', 'Amsterdam', 'North Holland', 'Anna', 'Glamour', '+31620000001', 'fixed'),
  ('sarah.beauty@mollure.dev', 'Beauty by Sarah BV', 'Rotterdam', 'South Holland', 'Sarah', 'Beauty', '+31620000002', 'desired'),
  ('luxe@mollure.dev', 'Luxe Hair & Spa BV', 'Utrecht', 'Utrecht', 'Lina', 'Luxe', '+31620000003', 'both'),
  ('glowup@mollure.dev', 'Glow Up Salon BV', 'Eindhoven', 'North Brabant', 'Maya', 'Glow', '+31620000004', 'desired')
) AS v(email, legal_name, municipality, province, first_name, last_name, phone, mode) ON u.email = v.email
ON CONFLICT (user_id) DO UPDATE SET
  legal_name = EXCLUDED.legal_name,
  municipality = EXCLUDED.municipality,
  province = EXCLUDED.province,
  service_location_mode = EXCLUDED.service_location_mode;

INSERT INTO individual_profiles (user_id, first_name, last_name, display_name, country_code, phone)
SELECT u.id, v.first_name, v.last_name, v.display_name, '+31', v.phone
FROM users u
INNER JOIN (VALUES
  ('dash.ic1@mollure.dev', 'Nina', 'Bakker', 'Nina Bakker', '+31630000001'),
  ('dash.ic2@mollure.dev', 'Omar', 'Hassan', 'Omar Hassan', '+31630000002'),
  ('dash.ic3@mollure.dev', 'Eva', 'Jansen', 'Eva Jansen', '+31630000003'),
  ('dash.ic4@mollure.dev', 'Tom', 'de Vries', 'Tom de Vries', '+31630000004'),
  ('dash.ic5@mollure.dev', 'Sofia', 'Martinez', 'Sofia Martinez', '+31630000005')
) AS v(email, first_name, last_name, display_name, phone) ON u.email = v.email
ON CONFLICT (user_id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  display_name = EXCLUDED.display_name;

INSERT INTO company_profiles (user_id, legal_name, municipality, province, contact_first_name, contact_last_name, phone)
SELECT u.id, v.legal_name, v.municipality, v.province, v.first_name, v.last_name, v.phone
FROM users u
INNER JOIN (VALUES
  ('dash.cc1@mollure.dev', 'Dash Events BV', 'Amsterdam', 'North Holland', 'Kim', 'Events', '+31640000001'),
  ('dash.cc2@mollure.dev', 'Studio Collective NV', 'The Hague', 'South Holland', 'Leo', 'Collective', '+31640000002')
) AS v(email, legal_name, municipality, province, first_name, last_name, phone) ON u.email = v.email
ON CONFLICT (user_id) DO UPDATE SET
  legal_name = EXCLUDED.legal_name,
  municipality = EXCLUDED.municipality,
  province = EXCLUDED.province;

INSERT INTO business_setups (
  professional_profile_id, location_mode, business_name, business_about, business_keywords,
  salon_name, fixed_location_municipality, fixed_location_province, project, service_for, price_range
)
SELECT
  pp.id,
  v.location_mode,
  v.business_name,
  v.about,
  ARRAY[v.kw1, v.kw2],
  v.business_name,
  v.municipality,
  v.province,
  v.project,
  ARRAY['women', 'men'],
  '€€'
FROM users u
INNER JOIN professional_profiles pp ON pp.user_id = u.id
INNER JOIN (VALUES
  ('glamour@mollure.dev', 'fixed', 'Glamour Studio', 'Flagship salon in Amsterdam.', 'salon', 'glamour', 'Amsterdam', 'North Holland', NULL::text),
  ('sarah.beauty@mollure.dev', 'desired', 'Beauty by Sarah', 'On-location beauty specialist.', 'beauty', 'makeup', 'Rotterdam', 'South Holland', NULL::text),
  ('luxe@mollure.dev', 'both', 'Luxe Hair & Spa', 'Luxury hair and spa treatments.', 'spa', 'hair', 'Utrecht', 'Utrecht', NULL::text),
  ('glowup@mollure.dev', 'desired', 'Glow Up Salon', 'Project and event beauty crews.', 'events', 'glow', 'Eindhoven', 'North Brabant', 'Wedding & events package')
) AS v(email, location_mode, business_name, about, kw1, kw2, municipality, province, project)
  ON u.email = v.email
ON CONFLICT (professional_profile_id) DO UPDATE SET
  location_mode = EXCLUDED.location_mode,
  business_name = EXCLUDED.business_name,
  business_about = EXCLUDED.business_about,
  fixed_location_municipality = EXCLUDED.fixed_location_municipality,
  fixed_location_province = EXCLUDED.fixed_location_province,
  project = EXCLUDED.project,
  updated_at = NOW();

-- Online + offline bookings across the last ~30 days for chart/KPI coverage
INSERT INTO bookings (
  booking_date, business_setup_id, customer_id, start_time, end_time,
  location_type, status, booking_type, unique_code, total_price, contact_number
)
SELECT
  (CURRENT_DATE - v.days_ago)::date,
  bs.id,
  cu.id,
  ((CURRENT_DATE - v.days_ago)::text || ' 10:00:00+00')::timestamptz,
  ((CURRENT_DATE - v.days_ago)::text || ' 11:00:00+00')::timestamptz,
  v.location_type,
  v.status,
  v.booking_type,
  v.unique_code,
  v.total_price,
  '+31655550000'
FROM (VALUES
  -- Glamour Studio (online heavy)
  ('glamour@mollure.dev', 'client@mollure.dev', 0, 'fixed', 'completed', 'online', 'BK-DASH-G001', 95.00),
  ('glamour@mollure.dev', 'dash.ic1@mollure.dev', 1, 'fixed', 'completed', 'online', 'BK-DASH-G002', 110.00),
  ('glamour@mollure.dev', 'dash.ic2@mollure.dev', 2, 'fixed', 'confirmed', 'online', 'BK-DASH-G003', 85.00),
  ('glamour@mollure.dev', 'dash.ic3@mollure.dev', 3, 'fixed', 'completed', 'online', 'BK-DASH-G004', 120.00),
  ('glamour@mollure.dev', 'client@mollure.dev', 4, 'fixed', 'completed', 'online', 'BK-DASH-G005', 90.00),
  ('glamour@mollure.dev', 'dash.ic4@mollure.dev', 5, 'fixed', 'completed', 'offline', 'BK-DASH-G006', 75.00),
  ('glamour@mollure.dev', 'dash.ic5@mollure.dev', 6, 'fixed', 'completed', 'online', 'BK-DASH-G007', 130.00),
  ('glamour@mollure.dev', 'company@mollure.dev', 7, 'fixed', 'completed', 'offline', 'BK-DASH-G008', 200.00),
  ('glamour@mollure.dev', 'dash.cc1@mollure.dev', 8, 'fixed', 'completed', 'online', 'BK-DASH-G009', 150.00),
  ('glamour@mollure.dev', 'dash.ic1@mollure.dev', 10, 'fixed', 'completed', 'online', 'BK-DASH-G010', 95.00),
  ('glamour@mollure.dev', 'dash.ic2@mollure.dev', 12, 'fixed', 'completed', 'online', 'BK-DASH-G011', 105.00),
  ('glamour@mollure.dev', 'dash.ic3@mollure.dev', 14, 'fixed', 'completed', 'offline', 'BK-DASH-G012', 80.00),
  ('glamour@mollure.dev', 'client@mollure.dev', 18, 'fixed', 'completed', 'online', 'BK-DASH-G013', 115.00),
  ('glamour@mollure.dev', 'dash.ic4@mollure.dev', 21, 'fixed', 'completed', 'online', 'BK-DASH-G014', 98.00),
  ('glamour@mollure.dev', 'dash.ic5@mollure.dev', 25, 'fixed', 'completed', 'offline', 'BK-DASH-G015', 70.00),
  -- Beauty by Sarah
  ('sarah.beauty@mollure.dev', 'dash.ic1@mollure.dev', 0, 'desired', 'completed', 'online', 'BK-DASH-S001', 140.00),
  ('sarah.beauty@mollure.dev', 'dash.ic2@mollure.dev', 1, 'desired', 'completed', 'online', 'BK-DASH-S002', 160.00),
  ('sarah.beauty@mollure.dev', 'dash.ic3@mollure.dev', 2, 'desired', 'completed', 'offline', 'BK-DASH-S003', 90.00),
  ('sarah.beauty@mollure.dev', 'client@mollure.dev', 3, 'desired', 'completed', 'online', 'BK-DASH-S004', 155.00),
  ('sarah.beauty@mollure.dev', 'dash.cc1@mollure.dev', 4, 'desired', 'completed', 'online', 'BK-DASH-S005', 220.00),
  ('sarah.beauty@mollure.dev', 'dash.ic4@mollure.dev', 5, 'desired', 'completed', 'offline', 'BK-DASH-S006', 100.00),
  ('sarah.beauty@mollure.dev', 'dash.ic5@mollure.dev', 9, 'desired', 'completed', 'online', 'BK-DASH-S007', 145.00),
  ('sarah.beauty@mollure.dev', 'company@mollure.dev', 11, 'desired', 'completed', 'online', 'BK-DASH-S008', 180.00),
  ('sarah.beauty@mollure.dev', 'dash.ic1@mollure.dev', 15, 'desired', 'completed', 'offline', 'BK-DASH-S009', 95.00),
  ('sarah.beauty@mollure.dev', 'dash.ic2@mollure.dev', 22, 'desired', 'completed', 'online', 'BK-DASH-S010', 150.00),
  -- Luxe Hair & Spa
  ('luxe@mollure.dev', 'dash.ic3@mollure.dev', 0, 'fixed', 'completed', 'online', 'BK-DASH-L001', 175.00),
  ('luxe@mollure.dev', 'dash.ic4@mollure.dev', 1, 'desired', 'completed', 'online', 'BK-DASH-L002', 190.00),
  ('luxe@mollure.dev', 'client@mollure.dev', 2, 'fixed', 'completed', 'offline', 'BK-DASH-L003', 120.00),
  ('luxe@mollure.dev', 'dash.ic5@mollure.dev', 4, 'fixed', 'completed', 'online', 'BK-DASH-L004', 165.00),
  ('luxe@mollure.dev', 'dash.cc2@mollure.dev', 6, 'desired', 'completed', 'online', 'BK-DASH-L005', 240.00),
  ('luxe@mollure.dev', 'dash.ic1@mollure.dev', 13, 'fixed', 'completed', 'offline', 'BK-DASH-L006', 110.00),
  ('luxe@mollure.dev', 'dash.ic2@mollure.dev', 19, 'desired', 'completed', 'online', 'BK-DASH-L007', 185.00),
  ('luxe@mollure.dev', 'company@mollure.dev', 27, 'fixed', 'completed', 'online', 'BK-DASH-L008', 200.00),
  -- Glow Up (includes project)
  ('glowup@mollure.dev', 'dash.cc1@mollure.dev', 0, 'desired', 'completed', 'project', 'BK-DASH-O001', 450.00),
  ('glowup@mollure.dev', 'dash.ic3@mollure.dev', 1, 'desired', 'completed', 'online', 'BK-DASH-O002', 130.00),
  ('glowup@mollure.dev', 'dash.ic4@mollure.dev', 3, 'desired', 'completed', 'offline', 'BK-DASH-O003', 85.00),
  ('glowup@mollure.dev', 'client@mollure.dev', 5, 'desired', 'completed', 'online', 'BK-DASH-O004', 125.00),
  ('glowup@mollure.dev', 'dash.cc2@mollure.dev', 7, 'desired', 'completed', 'project', 'BK-DASH-O005', 520.00),
  ('glowup@mollure.dev', 'dash.ic5@mollure.dev', 16, 'desired', 'completed', 'online', 'BK-DASH-O006', 140.00),
  ('glowup@mollure.dev', 'dash.ic1@mollure.dev', 24, 'desired', 'completed', 'offline', 'BK-DASH-O007', 90.00),
  -- Ryan Harris Salon (existing pro) online/offline — skip R001/R003 (placeholder purge list)
  ('pro@mollure.dev', 'dash.ic2@mollure.dev', 1, 'fixed', 'completed', 'online', 'BK-DASH-R002', 95.00),
  ('pro@mollure.dev', 'dash.ic3@mollure.dev', 4, 'fixed', 'completed', 'online', 'BK-DASH-R004', 75.00),
  ('pro@mollure.dev', 'dash.cc1@mollure.dev', 8, 'fixed', 'completed', 'offline', 'BK-DASH-R005', 160.00),
  ('pro@mollure.dev', 'dash.ic4@mollure.dev', 17, 'fixed', 'completed', 'online', 'BK-DASH-R006', 88.00)
) AS v(pro_email, customer_email, days_ago, location_type, status, booking_type, unique_code, total_price)
INNER JOIN users pu ON pu.email = v.pro_email
INNER JOIN professional_profiles pp ON pp.user_id = pu.id
INNER JOIN business_setups bs ON bs.professional_profile_id = pp.id
INNER JOIN users cu ON cu.email = v.customer_email
WHERE NOT EXISTS (SELECT 1 FROM bookings b WHERE b.unique_code = v.unique_code);

-- Finance transactions for summary overview (direct / non-direct)
INSERT INTO finance_transactions (
  professional_profile_id, entry_type, entry_id, transaction_date, entry_label,
  client_name, client_email, client_type,
  gross_amount, stripe_fee, mollure_fee, net_amount,
  method_title, method_detail, status, booking_id, document
)
SELECT
  pp.id,
  v.entry_type,
  v.entry_id,
  (CURRENT_DATE - v.days_ago)::date,
  v.entry_label,
  v.client_name,
  v.client_email,
  v.client_type,
  v.gross_amount::numeric,
  v.stripe_fee::numeric,
  v.mollure_fee::numeric,
  v.net_amount::numeric,
  v.method_title,
  v.method_detail,
  'Paid',
  v.booking_id,
  jsonb_build_object('documentNumber', v.doc_no, 'totalPrice', ('€' || v.net_amount::text))
FROM users u
INNER JOIN professional_profiles pp ON pp.user_id = u.id
INNER JOIN (VALUES
  ('glamour@mollure.dev', 'onlineBooking', 'D001', 1, 'Online booking', 'Nina Bakker', 'dash.ic1@mollure.dev', 'mollure', 110, 3, 2, 105, 'Online – direct', 'iDeal', 'BK-DASH-G002', 'INV-D001'),
  ('glamour@mollure.dev', 'onlineBooking', 'D002', 3, 'Online booking', 'Eva Jansen', 'dash.ic3@mollure.dev', 'mollure', 120, 4, 2, 114, 'Online – invoice', 'Card', 'BK-DASH-G004', 'INV-D002'),
  ('glamour@mollure.dev', 'offlineBooking', 'D003', 5, 'Walk-in', 'Tom de Vries', 'dash.ic4@mollure.dev', 'mollure', 75, 0, 0, 75, 'Offline – direct', 'Cash', 'BK-DASH-G006', 'INV-D003'),
  ('sarah.beauty@mollure.dev', 'onlineBooking', 'D004', 0, 'Online booking', 'Omar Hassan', 'dash.ic2@mollure.dev', 'mollure', 160, 5, 3, 152, 'Online – direct', 'iDeal', 'BK-DASH-S002', 'INV-D004'),
  ('sarah.beauty@mollure.dev', 'offlineBooking', 'D005', 2, 'On-site', 'Priya', 'priya.s@mollure.dev', 'mollure', 90, 0, 0, 90, 'Offline – invoice', 'Transfer', 'BK-DASH-S003', 'INV-D005'),
  ('luxe@mollure.dev', 'onlineBooking', 'D006', 1, 'Online booking', 'Sofia Martinez', 'dash.ic5@mollure.dev', 'mollure', 165, 5, 3, 157, 'Online – direct', 'Card', 'BK-DASH-L004', 'INV-D006'),
  ('luxe@mollure.dev', 'offlineBooking', 'D007', 2, 'Salon visit', 'Alex Client', 'client@mollure.dev', 'mollure', 120, 0, 0, 120, 'Offline – direct', 'Cash', 'BK-DASH-L003', 'INV-D007'),
  ('glowup@mollure.dev', 'onlineBooking', 'D008', 1, 'Online booking', 'Eva Jansen', 'dash.ic3@mollure.dev', 'mollure', 130, 4, 2, 124, 'Online – invoice', 'iDeal', 'BK-DASH-O002', 'INV-D008'),
  ('glowup@mollure.dev', 'offlineBooking', 'D009', 3, 'Event prep', 'Tom de Vries', 'dash.ic4@mollure.dev', 'mollure', 85, 0, 0, 85, 'Offline – direct', 'Cash', 'BK-DASH-O003', 'INV-D009')
) AS v(
  pro_email, entry_type, entry_id, days_ago, entry_label, client_name, client_email, client_type,
  gross_amount, stripe_fee, mollure_fee, net_amount, method_title, method_detail, booking_id, doc_no
) ON u.email = v.pro_email
WHERE NOT EXISTS (
  SELECT 1 FROM finance_transactions ft
  WHERE ft.professional_profile_id = pp.id
    AND ft.entry_id = v.entry_id
    AND ft.booking_id = v.booking_id
);

INSERT INTO admin_activity_logs (actor_email, actor_name, action, detail, color, created_at)
SELECT v.actor_email, v.actor_name, v.action, v.detail, v.color, NOW() - (v.hours_ago || ' hours')::interval
FROM (VALUES
  ('admin@mollure.dev', 'Admin User', 'Validated professional', 'Beauty by Sarah', 'teal', 2),
  ('dev01@mollure.dev', 'Dev Ops', 'Deleted review', 'Review ID #829', 'navy', 5),
  ('admin@mollure.dev', 'Admin User', 'Disabled account', 'Client ID #221', 'warning', 8),
  ('dev02@mollure.dev', 'Content Editor', 'Edited content', 'Updated NL homepage hero text', 'mint', 12),
  ('admin@mollure.dev', 'Admin User', 'Approved listing', 'Glamour Studio', 'teal', 20),
  ('admin@mollure.dev', 'Admin User', 'Updated professional', 'Luxe Hair & Spa', 'navy', 28)
) AS v(actor_email, actor_name, action, detail, color, hours_ago)
WHERE NOT EXISTS (
  SELECT 1 FROM admin_activity_logs a
  WHERE a.actor_email = v.actor_email
    AND a.action = v.action
    AND a.detail = v.detail
);
