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
  | "Voided";

/** Visual tone for status chips per design spec. */
export type TransactionStatusTone = "success" | "warning" | "danger" | "neutral" | "muted";

export function getTransactionStatusTone(status: TransactionStatus): TransactionStatusTone {
  switch (status) {
    case "Paid":
    case "Prepaid":
      return "success";
    case "Pending":
    case "Prepayment due":
    case "Payment due":
    case "Overdue":
    case "Overdue response":
      return "warning";
    case "Failed":
      return "danger";
    case "Refunded":
    case "Voided":
      return "muted";
    default:
      return "neutral";
  }
}

/** Chip label per Transaction overview status design. */
export function formatTransactionStatusLabel(status: TransactionStatus): string {
  switch (status) {
    case "Overdue":
      return "!Overdue";
    case "Voided":
      return "Void";
    default:
      return status;
  }
}

export function formatEntryIdDisplay(
  entryType: TransactionEntryType,
  entryId: string | null,
  entryLabel?: string,
): string {
  if (entryLabel?.toLowerCase().includes("manual") || entryType === "manualEntry") {
    return entryId ? `M${entryId}` : "Manual entry";
  }
  if (entryType === "offlineBooking" && entryId) {
    return `OF${entryId}`;
  }
  if (entryId) return entryId;
  return entryLabel ?? "";
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

export type ManualEntryTransactionInput = {
  clientName: string;
  clientEmail: string;
  clientType: TransactionClientType;
  paymentMethod: "onlineDirect" | "offlineDirect";
  lines: { name: string; quantity: number; unitPrice: number }[];
  totalPrice: number;
  discountAmount?: number;
};

export function buildManualEntryTransactionRow(input: ManualEntryTransactionInput): TransactionRow {
  const today = new Date().toISOString().slice(0, 10);
  const entryNum = String(100 + Math.floor(Math.random() * 900));
  const isOnline = input.paymentMethod === "onlineDirect";

  const lineItems = input.lines.map((line) => ({
    description: line.name,
    quantity: String(line.quantity),
    vat: "21%",
    pricePerUnit: formatNetAmountEur(line.unitPrice),
    totalPrice: formatNetAmountEur(line.quantity * line.unitPrice),
  }));

  if (input.discountAmount && input.discountAmount > 0) {
    lineItems.push({
      description: "Discount",
      quantity: "1",
      vat: "0%",
      pricePerUnit: formatNetAmountEur(-input.discountAmount),
      totalPrice: formatNetAmountEur(-input.discountAmount),
    });
  }

  const gross = input.totalPrice;
  const stripeFee = isOnline ? Math.round(gross * 0.029 * 100) / 100 : 0;
  const mollureFee = isOnline ? Math.round(gross * 0.01 * 100) / 100 : 0;
  const net = gross - stripeFee - mollureFee;

  return {
    id: `t-manual-${Date.now()}`,
    entryType: "manualEntry",
    entryId: entryNum,
    date: today,
    entryLabel: "Manual entry",
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    clientType: input.clientType,
    grossAmount: formatNetAmountEur(gross),
    stripeFee: formatNetAmountEur(stripeFee),
    mollureFee: formatNetAmountEur(mollureFee),
    netAmount: formatNetAmountEur(net),
    methodTitle: isOnline ? "Online – direct" : "Offline – direct",
    methodDetail: isOnline ? "iDeal" : "",
    status: isOnline ? "Pending" : "Paid",
    statusDetail: isOnline ? "Pay within 15 min" : undefined,
    document: {
      documentNumber: `INV-G${entryNum}`,
      receiptNumber: isOnline ? undefined : `RCP-G${entryNum}`,
      serviceDate: today,
      invoiceDate: today,
      dueDate: today,
      client: {
        legalName: input.clientName,
        email: input.clientEmail || undefined,
      },
      lineItems,
      totalPrice: formatNetAmountEur(input.totalPrice),
    },
  };
}

export type TransactionClientType = "mollure" | "nonMollure" | "business" | "guest";

export function getTransactionClientTypeLabel(type?: TransactionClientType): string | null {
  switch (type) {
    case "mollure":
      return "Mollure";
    case "nonMollure":
      return "IC";
    case "business":
      return "BC";
    default:
      return null;
  }
}

export function isTransactionOnlinePayment(methodTitle: string): boolean {
  return methodTitle.trim().toLowerCase().startsWith("online");
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
};

export type TransactionDocumentLineItem = {
  description: string;
  quantity: string;
  vat: string;
  pricePerUnit: string;
  totalPrice: string;
};

export type TransactionDocumentBookingItem = {
  label: string;
  value: string;
};

export type TransactionDocument = {
  documentNumber: string;
  receiptNumber?: string;
  creditNoteNumber?: string;
  refundAmount?: string;
  refundedAt?: string;
  serviceDate: string;
  /** Appointment clock time, e.g. "14:00" or "2:00 PM". */
  serviceTime?: string;
  invoiceDate: string;
  dueDate: string;
  lateFeeNotice?: string;
  reissuedFrom?: string;
  client?: TransactionDocumentParty;
  bookingItems?: TransactionDocumentBookingItem[];
  lineItems?: TransactionDocumentLineItem[];
  totalPrice?: string;
  /** Formatted prepayment amount shown on invoice/receipt as "Prepayment". */
  prepaymentAmount?: string;
};

export type TransactionRow = {
  id: string;
  entryType: TransactionEntryType;
  /** Shown in Entry ID column; use null for continuation rows under the same logical entry */
  entryId: string | null;
  /** YYYY-MM-DD or null when grouped under a parent row */
  date: string | null;
  /** Optional label instead of/alongside entry id (e.g. "Manual entry") */
  entryLabel?: string;
  clientName: string;
  clientEmail: string;
  clientType: TransactionClientType;
  grossAmount?: string;
  stripeFee?: string;
  mollureFee?: string;
  netAmount: string;
  methodTitle: string;
  methodDetail: string;
  status: TransactionStatus;
  /** Sub-label under status (e.g. due date, pay within 15 min) */
  statusDetail?: string;
  document?: TransactionDocument;
  /** Internal note attached to this transaction entry */
  note?: string;
  /** Booking ID for navigation to calendar */
  bookingId?: string;
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
