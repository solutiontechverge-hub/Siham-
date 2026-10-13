/** Default VAT + exception lookup by service_id (invoice_settings.services). */

export const DEFAULT_VAT_RATE = 21;

export const VAT_EXCEPTION_INFO_TOOLTIP =
  "Every service uses 21% VAT by default. Only add a service here if it has a different VAT rate — these are the exceptions.";

export type FinanceVatExceptionRow = {
  id?: string;
  service_id?: string;
  serviceId?: string;
  vat?: string;
  vat_rate?: number | string;
  vatRate?: number | string;
  name?: string;
};

export type FinanceVatSettingsSlice = {
  services?: readonly FinanceVatExceptionRow[] | null;
  products?: readonly FinanceVatExceptionRow[] | null;
  uniqueItems?: readonly FinanceVatExceptionRow[] | null;
};

export function parseVatRate(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const match = String(value).match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

export function formatVatPercent(rate: number): string {
  return `${Number.isFinite(rate) ? rate : DEFAULT_VAT_RATE}%`;
}

/** Strip guest/line suffixes like `uuid::guest-1`. */
export function catalogServiceId(raw: unknown): string {
  if (raw == null) return "";
  return String(raw).split("::")[0].trim();
}

/**
 * Exception list uses true service_id keys.
 * Match → exception rate; else global default 21%.
 * // ponytail: invoice_settings.services is the live store; business_service_vat_exceptions table unused until dual-write needed
 */
export function resolveServiceVatRate(
  serviceId: unknown,
  invoiceSettings?: FinanceVatSettingsSlice | null,
): number {
  const id = catalogServiceId(serviceId);
  if (id) {
    const rows = invoiceSettings?.services ?? [];
    const match = rows.find((row) => {
      const key = catalogServiceId(row?.service_id ?? row?.serviceId ?? row?.id);
      return key && key === id;
    });
    if (match) {
      const rate = parseVatRate(match.vat ?? match.vat_rate ?? match.vatRate);
      if (rate != null) return rate;
    }
  }
  return DEFAULT_VAT_RATE;
}

export function resolveServiceVatLabel(
  serviceId: unknown,
  invoiceSettings?: FinanceVatSettingsSlice | null,
): string {
  return formatVatPercent(resolveServiceVatRate(serviceId, invoiceSettings));
}

/** Products store their own vat; unmatched → 21%. */
export function resolveProductVatRate(
  productIdOrName: unknown,
  invoiceSettings?: FinanceVatSettingsSlice | null,
): number {
  const id = catalogServiceId(productIdOrName);
  const name = String(productIdOrName ?? "")
    .trim()
    .toLowerCase();
  const catalog = [
    ...(invoiceSettings?.products ?? []),
    ...(invoiceSettings?.uniqueItems ?? []),
  ];
  const match = catalog.find((row) => {
    const rowId = catalogServiceId(row?.id);
    if (id && rowId && rowId === id) return true;
    const label = String(row?.name ?? "")
      .trim()
      .toLowerCase();
    return Boolean(
      label && name && (name.includes(label) || label.includes(name)),
    );
  });
  if (match) {
    const rate = parseVatRate(match.vat ?? match.vat_rate ?? match.vatRate);
    if (rate != null) return rate;
  }
  return DEFAULT_VAT_RATE;
}

export function resolveProductVatLabel(
  productIdOrName: unknown,
  invoiceSettings?: FinanceVatSettingsSlice | null,
): string {
  return formatVatPercent(resolveProductVatRate(productIdOrName, invoiceSettings));
}
