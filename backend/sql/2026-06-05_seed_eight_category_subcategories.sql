-- Catalog subservices for the 8 platform service categories.

INSERT INTO subcategories (category_id, title)
SELECT c.id, v.title
FROM categories c
CROSS JOIN (VALUES
  ('Make-Up', 'Bridal Make-Up'),
  ('Make-Up', 'Party Make-Up'),
  ('Make-Up', 'Natural Make-Up'),
  ('Wimpers', 'Classic Lashes'),
  ('Wimpers', 'Volume Lashes'),
  ('Wimpers', 'Lash Lift'),
  ('Wenkbrauwen', 'Brow Shape'),
  ('Wenkbrauwen', 'Brow Tint'),
  ('Wenkbrauwen', 'Brow Lamination'),
  ('Gezichtsbehandeling', 'Classic Facial'),
  ('Gezichtsbehandeling', 'Deep Cleansing Facial'),
  ('Gezichtsbehandeling', 'Anti-Aging Facial'),
  ('Nagels', 'Manicure'),
  ('Nagels', 'Pedicure'),
  ('Nagels', 'Gel Nails'),
  ('Lichaamsbehandeling', 'Body Massage'),
  ('Lichaamsbehandeling', 'Body Scrub'),
  ('Lichaamsbehandeling', 'Body Wrap'),
  ('Ontharing', 'Waxing'),
  ('Ontharing', 'Sugaring'),
  ('Ontharing', 'IPL Hair Removal')
) AS v(category_title, title)
WHERE c.title = v.category_title
ON CONFLICT (category_id, title) DO NOTHING;
