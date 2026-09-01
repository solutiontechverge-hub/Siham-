import type {
  TransactionDocumentBookingItem,
  TransactionDocumentLineItem,
  TransactionRow,
} from "../../../app/professionals/fixed-location/finance/data/transactions";
import type { ProfessionalProfile } from "../../../store/services/profileApi";
import type { FinanceProfessionalBusinessOverride } from "./financeDocumentTypes";
import type { FinanceInvoiceSettings, FinanceInvoiceTemplateType } from "./useFinanceInvoiceSettings";

export type PreviewLineItem = {
  description: string;
  quantity: string;
  vat: string;
  pricePerUnit: string;
  totalPrice: string;
};

export function formatDocumentDate(value?: string | null) {
  if (!value) return "";
  const isoDate = value.includes("T") ? value.slice(0, 10) : value;
  const parts = isoDate.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return value;
}

export function formatDocumentTime(value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^\d{1,2}:\d{2}/.test(raw) || /am|pm/i.test(raw)) return raw;
  if (raw.includes("T")) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
  return raw;
}

export function formatDocumentDateTime(date?: string | null, time?: string | null) {
  const datePart = formatDocumentDate(date);
  const timePart = formatDocumentTime(time) || (date && date.includes("T") ? formatDocumentTime(date) : "");
  if (!datePart) return timePart;
  if (!timePart) return datePart;
  return `${datePart}, ${timePart}`;
}

export function resolveProfessionalBusinessDisplay(
  override?: FinanceProfessionalBusinessOverride | null,
  profile?: ProfessionalProfile | null,
) {
  const profileAddress = [
    profile?.street,
    profile?.street_number,
    profile?.municipality,
    profile?.province,
  ]
    .filter(Boolean)
    .join(", ");
  const shopName =
    override?.shopName?.trim() ||
    override?.legalName?.trim() ||
    profile?.legal_name?.trim() ||
    "—";
  const phone = override?.phone?.trim() || profile?.phone?.trim() || "—";
  const location = override?.address?.trim() || profileAddress || "—";
  const vat = override?.vatNumber?.trim() || profile?.vat_number?.trim() || "—";
  const coc = override?.cocNumber?.trim() || profile?.ccc_number?.trim() || "—";
  return { shopName, phone, location, vat, coc };
}

export function professionalBusinessInfoLines(
  display: ReturnType<typeof resolveProfessionalBusinessDisplay>,
  invoiceType: FinanceInvoiceTemplateType,
) {
  const lines = [
    `Shop Name: ${display.shopName}`,
    `Contact number: ${display.phone}`,
    `Location: ${display.location}`,
  ];
  if (invoiceType === "company") {
    lines.push(`Professional VAT No: ${display.vat}`, `Professional COC No: ${display.coc}`);
  }
  return lines;
}

export function parseCurrencyValue(input?: string | null) {
  if (!input) return 0;
  const normalized = input.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrencyValue(amount: number) {
  return new Intl.NumberFormat("en-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function addDuration(dateText: string, value: string, unit: string) {
  const amount = Number(value);
  if (!dateText || !Number.isFinite(amount) || amount <= 0) return "";

  const next = new Date(dateText);
  if (Number.isNaN(next.getTime())) return "";

  const unitValue = unit.trim().toLowerCase();
  if (unitValue.startsWith("day")) next.setDate(next.getDate() + amount);
  else if (unitValue.startsWith("month")) next.setMonth(next.getMonth() + amount);
  else next.setDate(next.getDate() + amount * 7);

  return `${String(next.getDate()).padStart(2, "0")}/${String(next.getMonth() + 1).padStart(2, "0")}/${next.getFullYear()}`;
}

export function normalizePreviewLineItems(items: TransactionDocumentLineItem[]): PreviewLineItem[] {
  return items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    vat: item.vat,
    pricePerUnit: item.pricePerUnit,
    totalPrice: item.totalPrice,
  }));
}

export function buildPreviewLineItems(settings: FinanceInvoiceSettings, row?: TransactionRow | null): PreviewLineItem[] {
  if (row?.document?.lineItems?.length) {
    const items = normalizePreviewLineItems(row.document.lineItems);
    const serviceItems = items.filter((item) => item.description.toLowerCase() !== "prepayment");
    return serviceItems.length ? serviceItems : items;
  }

  const templateItems = [
    ...settings.services.map((service) => ({
      description: service.service || service.category || "Service",
      vat: service.vat || "0%",
    })),
    ...settings.products.map((product) => ({
      description: product.name || "Product",
      vat: product.vat || "0%",
    })),
  ].filter((item) => item.description);

  const items = templateItems.length
    ? templateItems.slice(0, 4)
    : [{ description: row?.entryLabel || "Service", vat: "0%" }];

  const totalAmount = parseCurrencyValue(row?.netAmount) || 250;
  const perItemAmount = items.length ? totalAmount / items.length : totalAmount;

  return items.map((item, index) => {
    const amount = index === items.length - 1 ? totalAmount - perItemAmount * (items.length - 1) : perItemAmount;
    return {
      description: item.description,
      quantity: "1",
      vat: item.vat,
      pricePerUnit: formatCurrencyValue(amount),
      totalPrice: formatCurrencyValue(amount),
    };
  });
}

export function buildBookingItems(row: TransactionRow | null, lineItems: PreviewLineItem[]): TransactionDocumentBookingItem[] {
  if (row?.document?.bookingItems?.length) {
    return row.document.bookingItems.filter((item) => item.label.toLowerCase() !== "prepayment");
  }
  return lineItems.map((item) => ({
    label: item.description,
    value: item.totalPrice,
  }));
}

export function formatPaymentMethod(row?: TransactionRow | null) {
  const title = row?.methodTitle?.replace(/\s*-\s*/g, " ").trim() || "Online Direct";
  const detail = row?.methodDetail?.trim();
  if (!detail || title.toLowerCase().includes(detail.toLowerCase())) return title;
  return `${title} ${detail}`;
}

export function receiptTitleForStatus(status?: TransactionRow["status"]) {
  return status === "Refunded" ? "Credit Note" : "Receipt";
}

export function receiptItemsTitleForStatus(status?: TransactionRow["status"]) {
  return status === "Refunded" ? "Refunded Items" : "Paid Items";
}

export function receiptNumberLabelForStatus(status?: TransactionRow["status"]) {
  return status === "Refunded" ? "Credit note number" : "Receipt number";
}
