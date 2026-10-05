import { alpha } from "@mui/material/styles";
import { mollureBodyMutedSx } from "../../../theme/mollureHierarchy";
import type {
  TransactionDocumentBookingItem,
  TransactionDocumentLineItem,
  TransactionRow,
} from "../../../app/professionals/fixed-location/finance/data/transactions";
import type {
  ProfessionalProfile,
  ProfileResponse,
} from "../../../store/services/profileApi";
import type { FinanceProfessionalBusinessOverride } from "./financeDocumentTypes";
import type { FinanceInvoiceSettings, FinanceInvoiceTemplateType } from "./useFinanceInvoiceSettings";

/** Shared muted meta/line copy on invoice + receipt previews. */
export function financeMutedTextSx(
  navy: string,
  extra?: Record<string, unknown>,
) {
  return mollureBodyMutedSx(navy, { color: alpha(navy, 0.62), ...extra });
}

/** Outer white card shell for invoice/receipt document previews. */
export function financePreviewCardSx(navy: string, padding: number = 2) {
  return {
    borderRadius: "10px",
    border: `1px solid ${alpha(navy, 0.1)}`,
    bgcolor: "#fff",
    p: padding,
  };
}

export function getProfessionalProfile(
  profileData?: ProfileResponse | null,
): ProfessionalProfile | null {
  if (!profileData || profileData.user_type !== "professional") return null;
  return profileData.profile as ProfessionalProfile | null;
}

export type PreviewLineItem = {
  description: string;
  quantity: number | string;
  vat: string;
  vatRate?: number | null;
  pricePerUnit: number | string;
  totalPrice: number | string;
};

/** A transaction document is frozen once its identifying metadata is persisted. */
export function hasStoredDocumentSnapshot(row?: TransactionRow | null): boolean {
  const document = row?.issuedDocument ?? row?.document;
  return Boolean(document?.documentNumber || document?.invoiceDate || document?.lineItems?.length);
}

export function getIssuedDocumentSnapshot(row?: TransactionRow | null) {
  return row?.issuedDocument?.issuedSnapshot ?? row?.document?.issuedSnapshot ?? null;
}

export function getIssuedDocument(row?: TransactionRow | null) {
  return row?.issuedDocument ?? row?.document ?? null;
}

/** B2B invoices are fully itemized; individual invoices use a simplified table. */
export type InvoiceLineItemLayout = "itemized" | "simplified";

export type InvoiceLineItemColumnKey =
  | "description"
  | "unit"
  | "vat"
  | "pricePerUnit"
  | "totalPrice";

export type InvoiceLineItemColumn = {
  key: InvoiceLineItemColumnKey;
  label: string;
  pdfWidth: number;
  align?: "left" | "right";
};

export type InvoiceDisplayLineItem = PreviewLineItem & {
  unit: string;
  displayDescription: string;
};

const LINE_QTY_SUFFIX_RE = /(?:,\s*)?[x×]\s*(\d+(?:\.\d+)?)\s*$/i;
const NON_AGGREGATABLE_LINE_RE = /^(prepayment|discount)$/i;

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
  return { shopName, legalName: override?.legalName?.trim() || profile?.legal_name?.trim() || shopName, phone, location, vat, coc };
}

export function professionalBusinessInfoLines(
  display: ReturnType<typeof resolveProfessionalBusinessDisplay>,
  invoiceType: FinanceInvoiceTemplateType,
) {
  if (invoiceType !== "company") return [`Professional: ${display.shopName}`];
  const lines = [
    `Legal Name: ${display.legalName}`,
    `COC No: ${display.coc}`,
    `VAT No: ${display.vat}`,
    `Address: ${display.location}`,
  ];
  return lines;
}

export function parseCurrencyValue(input?: number | string | null) {
  if (typeof input === "number") return Number.isFinite(input) ? input : 0;
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

/** Format numeric API values only when rendering; also supports legacy string snapshots. */
export function formatCurrencyDisplay(value?: number | string | null) {
  if (typeof value === "number") return formatCurrencyValue(value);
  return value || formatCurrencyValue(0);
}

export function isBusinessInvoiceTemplate(
  invoiceType?: FinanceInvoiceTemplateType | string | null,
) {
  return invoiceType === "company";
}

export function resolveInvoiceLineItemLayout(
  invoiceType?: FinanceInvoiceTemplateType | string | null,
): InvoiceLineItemLayout {
  return isBusinessInvoiceTemplate(invoiceType) ? "itemized" : "simplified";
}

export function resolveInvoiceTemplateType(input: {
  fallback?: FinanceInvoiceTemplateType;
  invoiceType?: FinanceInvoiceTemplateType | string | null;
  clientKind?: string | null;
  clientType?: string | null;
  vatNumber?: string | null;
  cocNumber?: string | null;
}): FinanceInvoiceTemplateType {
  const signals = [input.clientKind, input.clientType];
  if (
    signals.some((value) => {
      const normalized = String(value ?? "").trim().toLowerCase();
      return normalized === "company" || normalized === "business";
    })
  ) {
    return "company";
  }
  if (input.vatNumber?.trim() || input.cocNumber?.trim()) {
    return "company";
  }
  if (input.invoiceType === "company" || input.invoiceType === "individual") {
    return input.invoiceType;
  }
  return input.fallback === "company" ? "company" : "individual";
}

export function getInvoiceLineItemColumns(
  layout: InvoiceLineItemLayout,
): InvoiceLineItemColumn[] {
  if (layout === "simplified") {
    return [
      { key: "description", label: "Description", pdfWidth: 360 },
      { key: "totalPrice", label: "Total", pdfWidth: 130, align: "right" },
    ];
  }
  return [
    { key: "description", label: "Description", pdfWidth: 190 },
    { key: "vat", label: "VAT", pdfWidth: 60 },
    { key: "pricePerUnit", label: "Price per unit", pdfWidth: 110, align: "right" },
    { key: "totalPrice", label: "Total", pdfWidth: 90, align: "right" },
  ];
}

export function formatLineItemQuantity(quantity: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) return "1";
  return Number.isInteger(quantity) ? String(quantity) : String(quantity);
}

export function stripLineItemQuantitySuffix(description: string) {
  return description.replace(LINE_QTY_SUFFIX_RE, "").trim();
}

function quantityFromDescription(description: string) {
  const match = LINE_QTY_SUFFIX_RE.exec(description.trim());
  if (!match) return 0;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function parseLineItemQuantity(item: Pick<PreviewLineItem, "description" | "quantity">) {
  const fromField = Number.parseFloat(String(item.quantity ?? "").replace(",", "."));
  const fieldQty = Number.isFinite(fromField) && fromField > 0 ? fromField : 0;
  const nameQty = quantityFromDescription(item.description);
  if (fieldQty > 1) return fieldQty;
  if (nameQty > 1) return nameQty;
  return fieldQty || 1;
}

export function formatSimplifiedLineItemDescription(description: string, quantity: number) {
  const base = stripLineItemQuantitySuffix(description) || description;
  if (quantity > 1) return `${base}, ×${formatLineItemQuantity(quantity)}`;
  return base;
}

export function getInvoiceLineItemCellValue(
  item: InvoiceDisplayLineItem,
  key: InvoiceLineItemColumnKey,
) {
  switch (key) {
    case "description":
      return item.displayDescription;
    case "unit":
      return item.unit;
    case "vat":
      return item.vat;
    case "pricePerUnit":
      return formatCurrencyDisplay(item.pricePerUnit);
    case "totalPrice":
      return formatCurrencyDisplay(item.totalPrice);
  }
}

function aggregatePreviewLineItems(items: PreviewLineItem[]): PreviewLineItem[] {
  const groups = new Map<string, PreviewLineItem & { qty: number; total: number }>();
  const order: string[] = [];

  items.forEach((item, index) => {
    const baseDescription = stripLineItemQuantitySuffix(item.description) || item.description;
    const qty = parseLineItemQuantity(item);
    const skipAggregate = NON_AGGREGATABLE_LINE_RE.test(baseDescription);
    const key = skipAggregate
      ? `__unique__${index}`
      : `${baseDescription.toLowerCase()}|${item.vat}|${item.pricePerUnit}`;
    const existing = groups.get(key);
    if (existing) {
      existing.qty += qty;
      existing.total += parseCurrencyValue(item.totalPrice);
      existing.quantity = existing.qty;
      existing.totalPrice = existing.total;
      return;
    }
    groups.set(key, {
      description: baseDescription,
      quantity: qty,
      vat: item.vat,
      pricePerUnit: item.pricePerUnit,
      totalPrice: item.totalPrice,
      qty,
      total: parseCurrencyValue(item.totalPrice),
    });
    order.push(key);
  });

  return order.map((key) => {
    const group = groups.get(key);
    if (!group) {
      return items[0];
    }
    const { qty: _qty, total: _total, ...line } = group;
    return line;
  });
}

export function toInvoiceDisplayLineItems(
  items: PreviewLineItem[],
  invoiceType?: FinanceInvoiceTemplateType | string | null,
  preserveStoredValues = false,
): InvoiceDisplayLineItem[] {
  if (preserveStoredValues) {
    return items.map((item) => ({
      ...item,
      quantity: item.quantity,
      unit: formatLineItemQuantity(parseLineItemQuantity(item)),
      displayDescription: item.description,
    }));
  }
  const layout = resolveInvoiceLineItemLayout(invoiceType);
  return aggregatePreviewLineItems(items).map((item) => {
    const quantity = parseLineItemQuantity(item);
    return {
      ...item,
      quantity: formatLineItemQuantity(quantity),
      unit: formatLineItemQuantity(quantity),
      displayDescription:
        layout === "simplified"
          ? formatSimplifiedLineItemDescription(item.description, quantity)
          : stripLineItemQuantitySuffix(item.description) || item.description,
    };
  });
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
  return (Array.isArray(items) ? items : []).filter(Boolean).map((item) => ({
    description: item.description,
    quantity: item.quantity,
    vat: item.vat,
    vatRate: item.vatRate,
    pricePerUnit: item.pricePerUnit,
    totalPrice: item.totalPrice,
  }));
}

export function buildPreviewLineItems(_settings: FinanceInvoiceSettings, row?: TransactionRow | null): PreviewLineItem[] {
  const document = getIssuedDocument(row);
  const storedLineItems = Array.isArray(document?.lineItems)
    ? document.lineItems.filter((item) => item && typeof item === "object")
    : [];
  if (storedLineItems.length) {
    return normalizePreviewLineItems(storedLineItems);
  }

  // Never reconstruct missing historical lines from today's catalog/settings.
  const totalAmount = parseCurrencyValue(document?.totalPrice) || parseCurrencyValue(row?.grossAmount) || parseCurrencyValue(row?.netAmount) || 0;
  if (hasStoredDocumentSnapshot(row) && !totalAmount) return [];
  if (!document && !row) return [];
  return [{
    description: "Professional Service",
    quantity: 1,
    vat: "0%",
    pricePerUnit: totalAmount,
    totalPrice: totalAmount,
  }];
}

export function buildBookingItems(row: TransactionRow | null, lineItems: PreviewLineItem[]): TransactionDocumentBookingItem[] {
  const document = getIssuedDocument(row);
  if (document?.bookingItems?.length) {
    return document.bookingItems.filter((item) => item.label.toLowerCase() !== "prepayment");
  }
  if (hasStoredDocumentSnapshot(row)) return [];
  return lineItems.map((item) => ({
    label: item.description,
    value: formatCurrencyDisplay(item.totalPrice),
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
