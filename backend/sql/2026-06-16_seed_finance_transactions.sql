-- Seed finance settings and transactions for pro@mollure.dev

INSERT INTO professional_finance_settings (
  professional_profile_id,
  subscription_status,
  stripe_connect_status,
  transaction_options,
  invoice_settings
)
SELECT
  pp.id,
  'active',
  'onboarding',
  '{
    "onlineImmediate": true,
    "onlineInvoiceDueDate": true,
    "offlineImmediate": true,
    "offlineInvoiceDueDate": false
  }'::jsonb,
  '{
    "logoDataUrl": null,
    "defaultInvoiceType": "individual",
    "products": [
      {"id": "p1", "name": "Shampoo", "price": 30, "vat": "21%"},
      {"id": "p2", "name": "Eye Lashes", "price": 50, "vat": "21%"}
    ],
    "services": [
      {"id": "s1", "category": "Hair", "service": "Dye", "vat": "21%"},
      {"id": "s2", "category": "Makeup", "service": "Eye Makeup", "vat": "9%"}
    ],
    "paymentTerms": {
      "originalDueValue": "2",
      "originalDueUnit": "Weeks",
      "originalPenaltyValue": "10",
      "originalPenaltyUnit": "%",
      "firstReissueTrigger": "Automatic",
      "firstReissueDueValue": "2",
      "firstReissueDueUnit": "Weeks",
      "firstReissuePenaltyValue": "20",
      "firstReissuePenaltyUnit": "%",
      "secondReissueTrigger": "Automatic",
      "secondReissueDueValue": "2",
      "secondReissueDueUnit": "Weeks",
      "secondReissuePenaltyValue": "20",
      "secondReissuePenaltyUnit": "%"
    },
    "reminders": {
      "reminder1Value": "1",
      "reminder1Unit": "Weeks",
      "reminder2Value": "3",
      "reminder2Unit": "Days"
    }
  }'::jsonb
FROM users u
INNER JOIN professional_profiles pp ON pp.user_id = u.id
WHERE u.email = 'pro@mollure.dev'
ON CONFLICT (professional_profile_id) DO NOTHING;

INSERT INTO finance_transactions (
  professional_profile_id, entry_type, entry_id, transaction_date, entry_label,
  client_name, client_email, client_type,
  gross_amount, stripe_fee, mollure_fee, net_amount,
  method_title, method_detail, status, status_detail, booking_id, document
)
SELECT pp.id, v.entry_type, v.entry_id, v.transaction_date::date, v.entry_label,
  v.client_name, v.client_email, v.client_type,
  v.gross_amount::numeric, v.stripe_fee::numeric, v.mollure_fee::numeric, v.net_amount::numeric,
  v.method_title, v.method_detail, v.status, v.status_detail, v.booking_id, v.document::jsonb
FROM users u
INNER JOIN professional_profiles pp ON pp.user_id = u.id AND u.email = 'pro@mollure.dev'
CROSS JOIN (VALUES
  ('onlineBooking', '345', '2023-03-02', NULL, 'Sara Johnson', 'sarajohnson@gmail.com', 'mollure',
   1250, 36, 14, 1200, 'Online – direct', 'iDeal', 'Prepaid', NULL, '345',
   '{"documentNumber":"INV-N4567","receiptNumber":"RCP-N4567","serviceDate":"2023-03-02","invoiceDate":"2023-03-02","dueDate":"2023-03-16","totalPrice":1200}'),
  ('onlineBooking', '345', '2023-03-02', NULL, 'Guest Sara', 'guest.sara@email.com', 'guest',
   520, 15, 5, 500, 'Online – direct', 'EU Mastercard', 'Paid', NULL, '345',
   '{"documentNumber":"INV-Z8300","receiptNumber":"RCP-Z8300","serviceDate":"2023-03-02","invoiceDate":"2023-03-02","dueDate":"2023-03-16","totalPrice":500}'),
  ('onlineBooking', NULL, NULL, NULL, 'Guest Sara', '', 'guest',
   150, NULL, NULL, 150, 'Offline – direct', '', 'Paid', NULL, '345',
   '{"documentNumber":"INV-K1490","receiptNumber":"RCP-K1490","serviceDate":"2023-03-02","invoiceDate":"2023-03-02","dueDate":"2023-03-16","totalPrice":150}'),
  ('onlineBooking', NULL, '2023-03-03', NULL, 'Add-on Client', 'addon@email.com', 'nonMollure',
   95, 3, 1, 91, 'Online – direct', 'iDeal', 'Paid', NULL, '345',
   '{"documentNumber":"INV-K1491","receiptNumber":"RCP-K1491","serviceDate":"2023-03-03","invoiceDate":"2023-03-03","dueDate":"2023-03-17","totalPrice":91}'),
  ('onlineBooking', '789', '2023-03-02', NULL, 'Alex Martin', 'alexmartin@gmail.com', 'nonMollure',
   380, 11, 4, 365, 'Online – direct', 'iDeal', 'Prepayment due', 'Within response time', '789',
   '{"documentNumber":"INV-K1491","serviceDate":"2023-03-02","invoiceDate":"2023-03-02","dueDate":"2023-03-16","totalPrice":365}'),
  ('onlineBooking', '348', '2023-03-02', NULL, 'Priya Sharma', 'priya.s@gmail.com', 'business',
   2100, 61, 24, 2015, 'Online – direct', 'iDeal', 'Paid', NULL, '348',
   '{"documentNumber":"INV-RF4587","receiptNumber":"RCP-RF4587","serviceDate":"2023-03-02","invoiceDate":"2023-03-02","dueDate":"2023-03-16","totalPrice":2015,"client":{"legalName":"Priya Sharma","email":"priya.s@gmail.com","isMollure":true}}'),
  ('onlineBooking', '348', '2023-03-02', NULL, 'Priya Sharma', 'priya.s@gmail.com', 'business',
   2100, NULL, NULL, 2015, 'Online – direct', 'iDeal', 'Refunded', NULL, '348',
   '{"documentNumber":"INV-RF4587","receiptNumber":"RCP-RF4587-CR","serviceDate":"2023-03-02","invoiceDate":"2023-03-02","dueDate":"2023-03-16","totalPrice":2015,"client":{"legalName":"Priya Sharma","email":"priya.s@gmail.com","isMollure":true}}'),
  ('onlineBooking', '456', '2023-03-03', NULL, 'Emma van Dijk', 'emma.vd@gmail.com', 'mollure',
   850, NULL, NULL, 820, 'Offline – invoice with due date', 'Due date: 10/03/2023', 'Payment due', 'Due date: 10/03/2023', '456',
   '{"documentNumber":"INV-N4567","serviceDate":"2023-03-03","invoiceDate":"2023-03-03","dueDate":"2023-03-10","totalPrice":820}'),
  ('offlineBooking', '123', '2023-03-03', NULL, 'Jordan Lee', 'jordan.lee@email.com', 'nonMollure',
   420, NULL, NULL, 420, 'Offline – invoice with due date', 'Due date: 17/03/2023', 'Payment due', 'Due date: 17/03/2023', 'OF123',
   '{"documentNumber":"INV-HG567","serviceDate":"2023-03-03","invoiceDate":"2023-03-03","dueDate":"2023-03-17","totalPrice":420}'),
  ('offlineBooking', '123', '2023-03-03', NULL, 'Jordan Lee', 'jordan.lee@email.com', 'nonMollure',
   320, NULL, NULL, 320, 'Offline – direct', '', 'Pending', 'Pay within 15 min', 'OF123',
   '{"documentNumber":"INV-I3367","serviceDate":"2023-03-03","invoiceDate":"2023-03-03","dueDate":"2023-03-03","totalPrice":320}'),
  ('manualEntry', '778', '2023-03-04', 'Manual entry', 'Guest', '', 'guest',
   120, NULL, NULL, 120, 'Offline – direct', '', 'Paid', NULL, NULL,
   '{"documentNumber":"INV-G7789","receiptNumber":"RCP-G7789","serviceDate":"2023-03-04","invoiceDate":"2023-03-04","dueDate":"2023-03-04","totalPrice":120}'),
  ('manualEntry', '456', '2023-03-04', 'Manual entry', 'Client Name', 'client@email.com', 'mollure',
   600, 17, 7, 576, 'Online – direct', 'iDeal', 'Refunded', NULL, NULL,
   '{"documentNumber":"INV-HI456","receiptNumber":"RCP-HI456","serviceDate":"2023-03-04","invoiceDate":"2023-03-04","dueDate":"2023-03-04","totalPrice":576}'),
  ('onlineBooking', '456', '2023-03-06', NULL, 'Client Name', 'client@email.com', 'mollure',
   450, 13, 5, 432, 'Online – non-direct', 'Mastercard', 'Failed', NULL, '456',
   '{"documentNumber":"INV-NJ890","serviceDate":"2023-03-06","invoiceDate":"2023-03-06","dueDate":"2023-03-20","totalPrice":432}'),
  ('onlineBooking', '678', NULL, NULL, 'Client Name', 'client@email.com', 'nonMollure',
   380, NULL, NULL, 368, 'Online – invoice with due date', 'Due date: 01/03/2023', 'Overdue', 'Due date: 01/03/2023 — Take action in booking calendar', '678',
   '{"documentNumber":"INV-NJ999","serviceDate":"2023-02-20","invoiceDate":"2023-02-20","dueDate":"2023-03-01","totalPrice":368}'),
  ('onlineBooking', '678', '2023-03-07', NULL, 'Client Name', 'client@email.com', 'nonMollure',
   380, NULL, NULL, 368, 'Offline – direct', '', 'Voided', NULL, '678',
   '{"documentNumber":"INV-J3975","receiptNumber":"RCP-J3975","serviceDate":"2023-03-07","invoiceDate":"2023-03-07","dueDate":"2023-03-07","totalPrice":368}'),
  ('onlineBooking', NULL, NULL, NULL, 'Client Name', 'client@email.com', 'nonMollure',
   395, NULL, NULL, 383, 'Online – invoice with due date', 'Due date: 21/03/2023', 'Payment due', 'Re-issued from INV-NJ999', '678',
   '{"documentNumber":"INV-NJ1000","reissuedFrom":"INV-NJ999","serviceDate":"2023-03-07","invoiceDate":"2023-03-07","dueDate":"2023-03-21","totalPrice":383}')
) AS v(
  entry_type, entry_id, transaction_date, entry_label,
  client_name, client_email, client_type,
  gross_amount, stripe_fee, mollure_fee, net_amount,
  method_title, method_detail, status, status_detail, booking_id, document
)
WHERE NOT EXISTS (
  SELECT 1 FROM finance_transactions ft WHERE ft.professional_profile_id = pp.id LIMIT 1
);
