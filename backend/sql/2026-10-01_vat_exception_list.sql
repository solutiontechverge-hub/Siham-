-- VAT is 21% by default. This table stores exceptions only and links them
-- to the canonical service record; service names are never copied here.
CREATE TABLE IF NOT EXISTS business_service_vat_exceptions (
  business_setup_id UUID NOT NULL REFERENCES business_setups(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE RESTRICT,
  vat_rate NUMERIC(5, 2) NOT NULL CHECK (vat_rate >= 0 AND vat_rate <= 100 AND vat_rate <> 21),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (business_setup_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_business_service_vat_exceptions_service
  ON business_service_vat_exceptions(service_id);

CREATE OR REPLACE FUNCTION set_business_service_vat_exception_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_business_service_vat_exception_updated_at
  ON business_service_vat_exceptions;
CREATE TRIGGER trg_business_service_vat_exception_updated_at
  BEFORE UPDATE ON business_service_vat_exceptions
  FOR EACH ROW EXECUTE FUNCTION set_business_service_vat_exception_updated_at();
