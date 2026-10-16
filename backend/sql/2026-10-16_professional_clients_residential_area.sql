-- Individual client residential area (neighborhood / district), separate from residential_address.

ALTER TABLE professional_clients
  ADD COLUMN IF NOT EXISTS residential_area TEXT;
