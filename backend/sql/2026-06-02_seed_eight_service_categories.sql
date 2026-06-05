-- Full service category catalog for the Services Details slider (8 types + legacy aliases).

INSERT INTO categories (title) VALUES
  ('Hair'),
  ('Make-Up'),
  ('Wimpers'),
  ('Wenkbrauwen'),
  ('Gezichtsbehandeling'),
  ('Nagels'),
  ('Lichaamsbehandeling'),
  ('Ontharing'),
  ('Beauty'),
  ('Nails')
ON CONFLICT (title) DO NOTHING;
