import { alpha } from "@mui/material/styles";
import { mollureBodyMutedSx } from "../../../theme/mollureHierarchy";
import { MOLLURE_FONT_BODY } from "../../../theme/typography";
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
import { ensureProtectiveFeeLineDescription } from "./protectiveFeeInvoice";
import type { FinanceInvoiceSettings, FinanceInvoiceTemplateType } from "./useFinanceInvoiceSettings";

/** Poppins lining figures — price digits stay on one baseline (no old-style serif numerals). */
export const financePriceTextSx = {
  fontFamily: MOLLURE_FONT_BODY,
  fontVariantNumeric: "lining-nums tabular-nums",
  textAlign: "right",
} as const;

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
  sourceType?: "serviceId" | "productId" | "uniqueItemCode" | string;
  assigneeKey?: string;
  partyRole?: "main_client" | "guest" | "model" | string;
  partyName?: string;
};

export type InvoicePartyLineGroup = {
  kind: "service" | "product" | "unique" | "other";
  label: string;
  items: InvoiceDisplayLineItem[];
};

export type InvoicePartySection = {
  key: string;
  role: "main_client" | "guest" | "model" | "other";
  /** Section eyebrow: Client / Guest / Model */
  title: string;
  name: string;
  groups: InvoicePartyLineGroup[];
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
  const doc = row?.issuedDocument ?? row?.document ?? null;
  if (!doc) return null;
  // PRE docs must surface prepaid amount (heal legacy snapshots missing the field).
  const phase = String(
    (doc as { paymentPhase?: string }).paymentPhase ?? "",
  ).toLowerCase();
  const isPrepay =
    phase === "prepay" ||
    String(row?.entryLabel ?? "").toLowerCase() === "prepayment";
  if (!isPrepay) return doc;
  if (parseCurrencyValue(doc.prepaymentAmount) > 0) return doc;
  const healed =
    parseCurrencyValue(doc.paidAmount) ||
    parseCurrencyValue(row?.grossAmount) ||
    0;
  return healed > 0 ? { ...doc, prepaymentAmount: healed } : doc;
}

/** Refresh settlement fields without replacing the receipt's party-specific lines. */
export function withLiveTransactionPaymentState(
  row: TransactionRow | null,
  liveRows: readonly TransactionRow[],
): TransactionRow | null {
  if (!row) return null;
  const live = liveRows.find((item) => item.id === row.id);
  if (!live) return row;
  const document = getIssuedDocument(row);
  const liveDocument = getIssuedDocument(live);
  const updatedDocument = document && liveDocument
    ? {
        ...document,
        receiptNumber: liveDocument.receiptNumber,
        creditNoteNumber: liveDocument.creditNoteNumber,
        paidAmount: liveDocument.paidAmount,
        refundedAt: liveDocument.refundedAt,
      }
    : liveDocument ?? document;
  return {
    ...row,
    status: live.status,
    document: updatedDocument ?? undefined,
    issuedDocument: updatedDocument ?? undefined,
  };
}

/**
 * Issued rows read paymentTerms from issuedSnapshot; live settings only for
 * drafts / legacy rows that never snapshotted terms.
 */
export function resolveIssuedInvoiceSettings(
  row: TransactionRow | null | undefined,
  live: FinanceInvoiceSettings,
): FinanceInvoiceSettings {
  const snap = getIssuedDocumentSnapshot(row)?.invoiceSettings;
  if (!snap || typeof snap !== "object") return live;
  const partial = snap as Partial<FinanceInvoiceSettings>;
  return {
    ...live,
    ...partial,
    // Null/empty snap logo must not wipe the live Finance Settings logo.
    logoDataUrl: partial.logoDataUrl || live.logoDataUrl || null,
    paymentTerms: {
      ...live.paymentTerms,
      ...(partial.paymentTerms ?? {}),
    },
    reminders: {
      ...live.reminders,
      ...(partial.reminders ?? {}),
    },
    products: Array.isArray(partial.products) ? partial.products : live.products,
    uniqueItems: Array.isArray(partial.uniqueItems)
      ? partial.uniqueItems
      : live.uniqueItems,
    services: Array.isArray(partial.services) ? partial.services : live.services,
  };
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

const LINE_QTY_PREFIX_RE = /^(\d+(?:\.\d+)?)\s*[x×]\s*/i;
const LINE_QTY_SUFFIX_RE = /(?:,\s*)?(?:[x×]\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*[x×])\s*$/i;
const NON_AGGREGATABLE_LINE_RE = /^(prepayment|discount)$/i;

/** Footer total — mocks use Total (Incl. VAT); rate % never on the face. */
export const INVOICE_TOTAL_VAT_INCLUDED_LABEL = "Total (Incl. VAT)";

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
  return [
    `Legal Name: ${display.legalName}`,
    `Professional Address: ${display.location}`,
    `Professional VAT No: ${display.vat}`,
    `Professional COC No: ${display.coc}`,
  ];
}

export function parseCurrencyValue(input?: number | string | null) {
  if (typeof input === "number") return Number.isFinite(input) ? input : 0;
  if (!input) return 0;
  let cleaned = input.replace(/[^0-9,.-]/g, "");
  if (!cleaned || cleaned === "-") return 0;
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  if (hasComma && hasDot) {
    cleaned =
      cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
  } else if (hasComma) {
    cleaned = /,\d{1,2}$/.test(cleaned)
      ? cleaned.replace(",", ".")
      : cleaned.replace(/,/g, "");
  }
  const parsed = Number(cleaned);
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
  if (value == null || value === "") return formatCurrencyValue(0);
  // Legacy formatted snapshots stay as stored; bare numeric strings get formatted.
  if (/^-?\d+(?:[.,]\d+)?$/.test(String(value).trim())) {
    return formatCurrencyValue(parseCurrencyValue(value));
  }
  return String(value);
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
  const signals = [input.clientKind, input.clientType].map((value) =>
    String(value ?? "").trim().toLowerCase(),
  );
  if (signals.some((value) => value === "company" || value === "business")) {
    return "company";
  }
  if (input.vatNumber?.trim() || input.cocNumber?.trim()) {
    return "company";
  }
  // Stored defaultInvoiceType often froze "company" on individual Mollure rows.
  if (
    signals.some((value) =>
      ["individual", "mollure", "nonmollure", "guest"].includes(value),
    )
  ) {
    return "individual";
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
    // IC mock: Description | Price (Incl. VAT)
    return [
      { key: "description", label: "Description", pdfWidth: 340 },
      {
        key: "totalPrice",
        label: "Price (Incl. VAT)",
        pdfWidth: 150,
        align: "right",
      },
    ];
  }
  // BC: Description | Quantity | VAT % | Price Per Unit | Total Price
  return [
    { key: "description", label: "Description", pdfWidth: 140 },
    { key: "unit", label: "Quantity", pdfWidth: 70 },
    { key: "vat", label: "VAT %", pdfWidth: 60 },
    {
      key: "pricePerUnit",
      label: "Price Per Unit",
      pdfWidth: 105,
      align: "right",
    },
    { key: "totalPrice", label: "Total Price", pdfWidth: 90, align: "right" },
  ];
}

export function formatLineItemQuantity(quantity: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) return "1";
  return Number.isInteger(quantity) ? String(quantity) : String(quantity);
}

export function stripLineItemQuantitySuffix(description: string) {
  return description
    .replace(LINE_QTY_PREFIX_RE, "")
    .replace(LINE_QTY_SUFFIX_RE, "")
    .trim();
}

function quantityFromDescription(description: string) {
  const trimmed = description.trim();
  const prefix = LINE_QTY_PREFIX_RE.exec(trimmed);
  if (prefix) {
    const parsed = Number(prefix[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const match = LINE_QTY_SUFFIX_RE.exec(trimmed);
  if (!match) return 0;
  const parsed = Number(match[1] || match[2]);
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
  if (quantity > 1) return `${formatLineItemQuantity(quantity)}× ${base}`;
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
  const layout = resolveInvoiceLineItemLayout(invoiceType);
  const toDisplay = (item: PreviewLineItem): InvoiceDisplayLineItem => {
    const quantity = parseLineItemQuantity(item);
    return {
      ...item,
      quantity: preserveStoredValues ? item.quantity : formatLineItemQuantity(quantity),
      unit: formatLineItemQuantity(quantity),
      displayDescription:
        layout === "simplified"
          ? formatSimplifiedLineItemDescription(item.description, quantity)
          : stripLineItemQuantitySuffix(item.description) || item.description,
    };
  };
  // Stored document lines stay authoritative (no re-aggregation); only display labels adapt.
  if (preserveStoredValues) return items.map(toDisplay);
  return aggregatePreviewLineItems(items).map(toDisplay);
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
    ...(item.sourceType ? { sourceType: item.sourceType } : {}),
    ...(item.assigneeKey ? { assigneeKey: item.assigneeKey } : {}),
    ...(item.partyRole ? { partyRole: item.partyRole } : {}),
    ...(item.partyName ? { partyName: item.partyName } : {}),
  }));
}

function invoiceLineKind(
  item: Pick<PreviewLineItem, "sourceType" | "description">,
): InvoicePartyLineGroup["kind"] {
  const type = String(item.sourceType || "");
  if (type === "serviceId") return "service";
  if (type === "productId") return "product";
  if (type === "uniqueItemCode") return "unique";
  const ref = String(item.description || "").toLowerCase();
  if (ref.includes("unique")) return "unique";
  return "other";
}

function invoiceKindLabel(kind: InvoicePartyLineGroup["kind"]): string {
  if (kind === "service") return "Service";
  if (kind === "product") return "Product";
  if (kind === "unique") return "Unique item";
  return "Other";
}

/**
 * Client + Guest sections for invoice body when lines carry party metadata.
 * Returns null when there is nothing to section (solo / legacy flat docs).
 */
export function groupInvoiceDisplayLineItemsByParty(
  items: InvoiceDisplayLineItem[],
): InvoicePartySection[] | null {
  if (!items.length) return null;
  const hasParty = items.some(
    (item) => item.partyRole || item.partyName || item.assigneeKey,
  );
  if (!hasParty) return null;

  const order: string[] = [];
  const buckets = new Map<
    string,
    {
      role: InvoicePartySection["role"];
      title: string;
      name: string;
      items: InvoiceDisplayLineItem[];
    }
  >();

  for (const item of items) {
    const roleRaw = String(item.partyRole || "");
    const role: InvoicePartySection["role"] =
      roleRaw === "main_client" || roleRaw === "guest" || roleRaw === "model"
        ? roleRaw
        : item.assigneeKey
          ? "guest"
          : "main_client";
    const key =
      item.assigneeKey ||
      (role === "main_client" ? "main-client" : `${role}:${item.partyName || item.description}`);
    if (!buckets.has(key)) {
      order.push(key);
      buckets.set(key, {
        role,
        title:
          role === "main_client" ? "Client" : role === "model" ? "Model" : "Guest",
        name: item.partyName || (role === "main_client" ? "Client" : "Guest"),
        items: [],
      });
    }
    buckets.get(key)!.items.push(item);
  }

  const sections = order.map((key) => {
    const bucket = buckets.get(key)!;
    const kindOrder: InvoicePartyLineGroup["kind"][] = [
      "service",
      "product",
      "unique",
      "other",
    ];
    const byKind = new Map<InvoicePartyLineGroup["kind"], InvoiceDisplayLineItem[]>();
    for (const item of bucket.items) {
      const kind = invoiceLineKind(item);
      const list = byKind.get(kind) ?? [];
      list.push(item);
      byKind.set(kind, list);
    }
    return {
      key,
      role: bucket.role,
      title: bucket.title,
      name: bucket.name,
      groups: kindOrder
        .filter((kind) => (byKind.get(kind) ?? []).length > 0)
        .map((kind) => ({
          kind,
          label: invoiceKindLabel(kind),
          items: byKind.get(kind)!,
        })),
    } satisfies InvoicePartySection;
  });

  // Solo main-client invoice stays flat (booking mock only needs Client+Guest).
  if (
    sections.length === 1 &&
    sections[0]?.role === "main_client"
  ) {
    return null;
  }

  // Client first, then guests/models.
  sections.sort((a, b) => {
    const rank = (role: InvoicePartySection["role"]) =>
      role === "main_client" ? 0 : role === "guest" ? 1 : role === "model" ? 2 : 3;
    return rank(a.role) - rank(b.role);
  });
  return sections;
}

export function buildPreviewLineItems(_settings: FinanceInvoiceSettings, row?: TransactionRow | null): PreviewLineItem[] {
  const document = getIssuedDocument(row);
  const storedLineItems = Array.isArray(document?.lineItems)
    ? document.lineItems.filter((item) => item && typeof item === "object")
    : [];
  if (storedLineItems.length) {
    return normalizePreviewLineItems(storedLineItems).map((item) => {
      const feeMeta = item as PreviewLineItem & {
        feePercent?: number;
        feeBaseAmount?: number;
      };
      const enriched = ensureProtectiveFeeLineDescription(item.description, {
        entryLabel: row?.entryLabel,
        percent: feeMeta.feePercent,
        baseAmount: feeMeta.feeBaseAmount,
      });
      return enriched === item.description
        ? item
        : { ...item, description: enriched };
    });
  }
  // Never invent filler lines when stored document lines are empty.
  return [];
}

export function buildBookingItems(row: TransactionRow | null, lineItems: PreviewLineItem[]): TransactionDocumentBookingItem[] {
  const document = getIssuedDocument(row);
  if (document?.bookingItems?.length) {
    return document.bookingItems.filter((item) => item.label.toLowerCase() !== "prepayment");
  }
  // Issued docs often omit bookingItems — fall back to invoice line items (services/products).
  return lineItems
    .filter((item) => {
      const label = String(item.description || "").trim().toLowerCase();
      return label && label !== "prepayment";
    })
    .map((item) => ({
      label: item.description,
      value: parseCurrencyValue(item.totalPrice),
    }));
}

export function formatPaymentMethod(row?: TransactionRow | null) {
  const title = row?.methodTitle?.replace(/\s*-\s*/g, " ").trim() || "Online Direct";
  const detail = row?.methodDetail?.trim();
  if (!detail || title.toLowerCase().includes(detail.toLowerCase())) return title;
  return `${title} ${detail}`;
}

export function receiptTitleForStatus(status?: TransactionRow["status"]) {
  return status === "Refunded" ? "Refund Receipt" : "Receipt";
}

/** A settled prepayment is Paid on its receipt, even while the booking has a balance. */
export function receiptPaymentStatus(status?: string | null): string {
  const normalized = String(status ?? "").trim().toLowerCase();
  return ["paid", "prepaid", "completed"].includes(normalized)
    ? "Paid"
    : status || "Pending";
}

export function receiptItemsTitleForStatus(status?: TransactionRow["status"]) {
  return status === "Refunded" ? "Refunded Items" : "Paid Items";
}

export function receiptNumberLabelForStatus(_status?: TransactionRow["status"]) {
  return "Receipt number";
}

/** Receipt number shown in UI: only Prepaid|Paid|Refunded from stored doc; Voided → "voided". */
export function displayReceiptNumber(
  status?: TransactionRow["status"] | null,
  document?: {
    creditNoteNumber?: string;
    receiptNumber?: string;
  } | null,
): string | undefined {
  if (status === "Voided") return "voided";
  if (status !== "Paid" && status !== "Prepaid" && status !== "Refunded") {
    return undefined;
  }
  return document?.creditNoteNumber || document?.receiptNumber || undefined;
}

/** Confirmed / prepaid status green (matches booking Confirmed accent). */
export const INVOICE_PREPAID_GREEN = "#22B573";

/** True when the invoice prepayment row should read "Prepaid" (collected), not "Prepayment" (due). */
export function isInvoicePrepaymentCollected(
  status?: TransactionRow["status"] | null,
): boolean {
  if (!status) return false;
  return (
    status !== "Prepayment due" &&
    status !== "Pending" &&
    status !== "Failed"
  );
}

export function formatInvoicePrepaymentLabel(
  status?: TransactionRow["status"] | null,
  dateTime?: string | null,
): string {
  const word = isInvoicePrepaymentCollected(status) ? "Prepaid" : "Prepayment";
  return dateTime ? `${word} · ${dateTime}` : word;
}

/**
 * Frozen sample document for settings “View invoice” — preview reads this payload only
 * (not live catalog / form state). Template chosen by client type via resolveInvoiceTemplateType.
 */
export function buildInvoiceTemplatePreviewRow(
  invoiceType: FinanceInvoiceTemplateType,
  professional?: FinanceProfessionalBusinessOverride | null,
): TransactionRow {
  const isCompany = invoiceType === "company";
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: "template-preview",
    entryType: "manualEntry",
    entryId: "PREVIEW",
    date: today,
    entryLabel: "Template preview",
    clientName: isCompany ? "Acme BV" : "Ada Client",
    clientEmail: "client@example.com",
    // Profile split: BC → business template; Mollure/IC (and guests) → individual.
    clientType: isCompany ? "business" : "mollure",
    netAmount: 60,
    methodTitle: "Online - Direct",
    methodDetail: "",
    status: "Paid",
    issuedDocument: {
      documentNumber: "INV-PREVIEW",
      serviceDate: today,
      invoiceDate: today,
      dueDate: isCompany ? today : "",
      client: {
        legalName: isCompany ? "Acme BV" : "Ada Client",
        email: "client@example.com",
        ...(isCompany
          ? {
              address: "1 Business Street",
              vatNumber: "NL123456789B01",
              cocNumber: "12345678",
            }
          : {}),
      },
      lineItems: [
        {
          description: "Cut",
          quantity: 1,
          vat: "21%",
          pricePerUnit: 40,
          totalPrice: 40,
        },
        {
          description: "Shampoo",
          quantity: 2,
          vat: "21%",
          pricePerUnit: 10,
          totalPrice: 20,
        },
      ],
      totalPrice: 60,
      issuedSnapshot: {
        templateType: isCompany ? "company" : "individual",
        layout: isCompany ? "itemized" : "simplified",
        professionalBusiness: {
          legalName: professional?.legalName || "Professional Legal Name",
          shopName: professional?.shopName || professional?.legalName || "Professional",
          address: professional?.address || undefined,
          phone: professional?.phone || undefined,
          vatNumber: professional?.vatNumber || undefined,
          cocNumber: professional?.cocNumber || undefined,
        },
      },
    },
  };
}
