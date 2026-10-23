/**
 * Finance transaction types and helpers.
 */

export type TransactionEntryType = "onlineBooking" | "offlineBooking" | "manualEntry";

export type TransactionStatus =
  | "Prepaid"
  | "Paid"
  | "Refunded"
  | "Pending"
  | "Prepayment due"
  | "Payment due"
  | "Failed"
  | "Overdue"
  | "Overdue response"
  | "Unpaid"
  | "Voided";

/** Visual tone for status chips per design spec. */
export type TransactionStatusTone = "success" | "warning" | "danger" | "neutral" | "muted";

/** LCF entry label — fee exists only because the linked booking was cancelled. */
const LATE_CANCELLATION_BOOKING_FEE = "Late Cancellation Booking Fee";

function isLateCancellationFeeEntry(entryLabel?: string | null): boolean {
  return String(entryLabel ?? "").trim() === LATE_CANCELLATION_BOOKING_FEE;
}

/**
 * Paid late-cancellation fee → display Cancelled (booking lifecycle).
 * Persisted status stays Paid (receipts / refunds / sales cards).
 */
export function isCancelledFeeDisplayStatus(
  status: TransactionStatus,
  entryLabel?: string | null,
): boolean {
  return status === "Paid" && isLateCancellationFeeEntry(entryLabel);
}

export function getTransactionStatusTone(
  status: TransactionStatus,
  entryLabel?: string | null,
): TransactionStatusTone {
  if (isCancelledFeeDisplayStatus(status, entryLabel)) return "danger";
  switch (status) {
    case "Paid":
    case "Prepaid":
      return "success";
    case "Pending":
    case "Prepayment due":
    case "Payment due":
    case "Overdue":
    case "Overdue response":
    case "Failed":
      return "warning";
    case "Unpaid":
      return "danger";
    case "Refunded":
    case "Voided":
      return "muted";
    default:
      return "neutral";
  }
}

/** Chip label per Transaction overview status design. */
export function formatTransactionStatusLabel(
  status: TransactionStatus,
  entryLabel?: string | null,
): string {
  if (isCancelledFeeDisplayStatus(status, entryLabel)) return "Cancelled";
  switch (status) {
    case "Overdue":
      return "!Overdue";
    case "Voided":
      return "Voided";
    default:
      return status;
  }
}

/**
 * Display Entry ID to match stored booking codes:
 * - onlineBooking → digits only (strip `ol` / letters)
 * - offlineBooking → `OF` + code body (preserve alphanumeric after `of`)
 * - manualEntry → `M` + code body
 */
export function formatEntryIdDisplay(
  entryType: TransactionEntryType,
  entryId: string | null,
  entryLabel?: string,
): string {
  if (entryId === null || entryId === undefined || entryId === "") {
    return entryLabel ?? "";
  }
  const raw = String(entryId).trim();
  if (!raw) return entryLabel ?? "";

  const isManual =
    entryType === "manualEntry" ||
    Boolean(entryLabel?.toLowerCase().includes("manual"));

  if (entryType === "offlineBooking") {
    return `OF${raw.replace(/^of/i, "")}`;
  }
  if (isManual) {
    return `M${raw.replace(/^m/i, "")}`;
  }
  // onlineBooking: numbers only
  const body = raw.replace(/^ol/i, "");
  const digits = body.replace(/\D/g, "");
  return digits || body;
}

export function formatTransactionDate(isoDate: string | null): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${Number(d)}/${Number(m)}/${y}`;
}

/** Maps filter drawer keys to row statuses. */
export function transactionMatchesStatusFilter(
  status: TransactionStatus,
  statusKeys: readonly string[],
): boolean {
  if (!statusKeys.length) return true;

  return statusKeys.some((key) => {
    switch (key) {
      case "status:prepaid":
        return status === "Prepaid";
      case "status:paid":
        return status === "Paid";
      case "status:refunded":
        return status === "Refunded";
      case "status:pending":
        return status === "Pending";
      case "status:prepaymentDue":
        return status === "Prepayment due";
      case "status:paymentDue":
        return status === "Payment due";
      case "status:failed":
        return status === "Failed";
      case "status:overdueInvoice":
        return status === "Overdue";
      case "status:overdueResponse":
        return status === "Overdue response";
      case "status:voided":
        return status === "Voided";
      case "status:unpaid":
        return status === "Unpaid";
      default:
        return false;
    }
  });
}

export function applyStatusToTransactionIds(
  rows: readonly TransactionRow[],
  ids: readonly string[],
  status: TransactionStatus,
): TransactionRow[] {
  const idSet = new Set(ids);
  return rows.map((row) => (idSet.has(row.id) ? { ...row, status } : row));
}

export function formatNetAmountEur(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded)
    ? rounded.toLocaleString("en-US")
    : rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `€${text}`;
}

export type TransactionClientType = "mollure" | "nonMollure" | "business" | "guest";

export function getTransactionClientTypeLabel(type?: TransactionClientType): string | null {
  switch (type) {
    case "mollure":
      return "M";
    case "business":
      return "BC";
    // Individuals (nonMollure): no type tag — Mollure logo handled separately.
    default:
      return null;
  }
}

export function isTransactionOnlinePayment(methodTitle: string): boolean {
  return methodTitle.trim().toLowerCase().startsWith("online");
}

/** Offline / non-Stripe cash-or-invoice rows (entry type or method title). */
export function isOfflineFinanceTransaction(
  row: Pick<TransactionRow, "entryType" | "methodTitle">,
): boolean {
  if (row.entryType === "offlineBooking") return true;
  return row.methodTitle.trim().toLowerCase().startsWith("offline");
}

/** Mirrors backend canBulkMarkPaid — manualEntry path + offline invoice overrides. */
export function canMarkFinancePaid(
  row: Pick<TransactionRow, "entryType" | "methodTitle" | "status">,
): boolean {
  if (row.entryType === "manualEntry") {
    return ["Unpaid", "Pending", "Payment due", "Overdue"].includes(row.status);
  }
  if (isOfflineFinanceTransaction(row)) {
    return ["Unpaid", "Payment due", "Overdue"].includes(row.status);
  }
  return false;
}

/** Mirrors backend canBulkMarkUnpaid — Pending / reissue manual / offline Overdue|Paid. */
export function canMarkFinanceUnpaid(
  row: Pick<TransactionRow, "entryType" | "methodTitle" | "status"> & {
    document?: { reissueLevel?: number } | null;
  },
): boolean {
  if (row.status === "Pending") return true;
  if (
    ["Payment due", "Overdue"].includes(row.status) &&
    row.entryType === "manualEntry" &&
    Number(row.document?.reissueLevel ?? 0) >= 2
  ) {
    return true;
  }
  if (
    isOfflineFinanceTransaction(row) &&
    (row.status === "Overdue" || row.status === "Paid")
  ) {
    return true;
  }
  return false;
}

/** Offline Paid/Unpaid may edit the persisted transaction_date. */
export function canEditFinanceTransactionDate(
  row: Pick<TransactionRow, "entryType" | "methodTitle" | "status">,
): boolean {
  return (
    isOfflineFinanceTransaction(row) &&
    (row.status === "Paid" || row.status === "Unpaid")
  );
}

/** Guests share email only for online payments; name is always shown in the table. */
export function shouldShowTransactionClientEmail(
  row: Pick<TransactionRow, "clientType" | "clientEmail" | "methodTitle">,
): boolean {
  if (!row.clientEmail?.trim()) return false;
  if (row.clientType === "guest") {
    return isTransactionOnlinePayment(row.methodTitle);
  }
  return true;
}

export function isTransactionClientClickable(clientType: TransactionClientType): boolean {
  return clientType !== "guest";
}

export type TransactionDocumentParty = {
  legalName: string;
  email?: string;
  address?: string;
  vatNumber?: string;
  cocNumber?: string;
  /** Platform user id when the payer is a Mollure account. */
  customerId?: string;
  /** professional_clients.id when linked to the client list. */
  clientId?: string;
  /** True when payer is a Mollure platform client (may also be business). */
  isMollure?: boolean;
};

export type TransactionDocumentLineItem = {
  description: string;
  sourceReference?: string;
  sourceType?: "serviceId" | "productId" | "uniqueItemCode";
  quantity: number;
  vat: string;
  /** Numeric VAT rate for integrations; VAT text remains display/reference-only. */
  vatRate?: number | null;
  pricePerUnit: number;
  totalPrice: number;
};

export type TransactionDocumentBookingItem = {
  label: string;
  /** Numeric amount; legacy snapshots may still carry a formatted display string. */
  value: number | string;
};

export type TransactionDocument = {
  documentNumber?: string;
  receiptNumber?: string;
  creditNoteNumber?: string;
  refundAmount?: number;
  refundedAt?: string;
  serviceDate: string;
  /** Appointment clock time, e.g. "14:00" or "2:00 PM". */
  serviceTime?: string;
  invoiceDate: string;
  dueDate: string;
  lateFeeNotice?: string;
  reissuedFrom?: string;
  reissuedAt?: string;
  reissueLevel?: number;
  client?: TransactionDocumentParty;
  bookingItems?: TransactionDocumentBookingItem[];
  lineItems?: TransactionDocumentLineItem[];
  totalPrice?: number;
  /** Formatted prepayment amount shown on invoice/receipt as "Prepayment". */
  prepaymentAmount?: number;
  /** Exact amount settled by this document (distinct from invoice total). */
  paidAmount?: number;
  issuedSnapshot?: {
    templateType?: "individual" | "company";
    layout?: "itemized" | "simplified";
    invoiceSettings?: unknown;
    professionalBusiness?: {
      legalName?: string | null;
      shopName?: string | null;
      cocNumber?: string | null;
      vatNumber?: string | null;
      address?: string | null;
      phone?: string | null;
    };
  };
};

export type TransactionRow = {
  id: string;
  entryType: TransactionEntryType;
  /** Shown in Entry ID column; use null for continuation rows under the same logical entry */
  entryId: string | null;
  /** YYYY-MM-DD or null when grouped under a parent row */
  date: string | null;
  /** Persisted payment/due deadline (YYYY-MM-DD), when available. */
  paymentDeadline?: string | null;
  /** Optional label instead of/alongside entry id (e.g. "Manual entry") */
  entryLabel?: string;
  clientName: string;
  clientEmail: string;
  clientType: TransactionClientType;
  grossAmount?: number | null;
  stripeFee?: number | null;
  mollureFee?: number | null;
  netAmount: number;
  methodTitle: string;
  methodDetail: string;
  status: TransactionStatus;
  /** Sub-label under status (e.g. due date, pay within 15 min) */
  statusDetail?: string;
  document?: TransactionDocument;
  issuedDocument?: TransactionDocument;
  issuedAt?: string;
  /** Internal note attached to this transaction entry */
  note?: string;
  /** Booking ID for navigation to calendar */
  bookingId?: string;
  createdAt?: string;
  /** Shared ledger snapshot (same source as Sale Drawer / useBookingFinance). */
  bookingFinancials?: {
    net_total?: number;
    outstanding_balance?: number;
    total_paid?: number;
    total_refunded?: number;
    prepayment_total?: number;
    payment_status?: string;
    cancellation_payment_status?: string;
    basePrice?: number;
    add_ons?: number;
    cancellation_fee?: number;
  } | null;
  bookingStatus?: string | null;
};


/** Derive action menu category from selected transaction statuses. */
export type TransactionActionCategory =
  | "paid"
  | "failed"
  | "pending"
  | "voided"
  | "due"
  | "mixed";

/** Refund is only allowed after money was received (Paid / Prepaid). */
export function isRefundableTransactionStatus(status: TransactionStatus): boolean {
  return status === "Paid" || status === "Prepaid";
}

export function getTransactionActionCategory(
  rows: readonly TransactionRow[],
): TransactionActionCategory | null {
  if (!rows.length) return null;

  const categories = new Set<TransactionActionCategory>();

  for (const row of rows) {
    switch (row.status) {
      case "Paid":
      case "Prepaid":
        categories.add("paid");
        break;
      case "Unpaid":
        categories.add("due");
        break;
      case "Failed":
        categories.add("failed");
        break;
      case "Pending":
      case "Prepayment due":
        categories.add("pending");
        break;
      case "Voided":
      case "Refunded":
        categories.add("voided");
        break;
      case "Overdue":
      case "Overdue response":
      case "Payment due":
        categories.add("due");
        break;
      default:
        categories.add("due");
        break;
    }
  }

  if (categories.size > 1) return "mixed";
  return categories.values().next().value ?? null;
}

/** Calendar deep-link for overdue Review — sales tab (invoice) vs booking banner (prepay response). */
export function buildOverdueReviewHref(
  row: Pick<TransactionRow, "status" | "bookingId" | "entryId" | "date">,
): string | null {
  if (row.status !== "Overdue" && row.status !== "Overdue response") return null;
  if (!row.bookingId) return null;
  // Prefer unique_code (entryId) for bookingCode match; bookingId covers UUID / b-<uuid>.
  const ref = row.entryId || row.bookingId;
  const params = new URLSearchParams();
  params.set("booking", ref);
  if (row.date) params.set("date", row.date);
  if (row.status === "Overdue") params.set("tab", "sales");
  return `/professionals/calendar?${params.toString()}`;
}
