/**
 * Mock transaction rows for Finance → Overview.
 * Replace with API data when the backend is available.
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
      return "warning";
    case "Overdue":
      return "danger";
    case "Overdue response":
      return "warning";
    case "Refunded":
    case "Voided":
    case "Failed":
      return "muted";
    default:
      return "neutral";
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
  invoiceDate: string;
  dueDate: string;
  lateFeeNotice?: string;
  reissuedFrom?: string;
  client?: TransactionDocumentParty;
  bookingItems?: TransactionDocumentBookingItem[];
  lineItems?: TransactionDocumentLineItem[];
  totalPrice?: string;
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

const docBase = {
  serviceDate: "2023-03-02",
  invoiceDate: "2023-03-02",
  dueDate: "2023-03-16",
};

export const mockTransactions: TransactionRow[] = [
  {
    id: "t1",
    entryType: "onlineBooking",
    entryId: "345",
    date: "2023-03-02",
    bookingId: "345",
    clientName: "Sara Johnson",
    clientEmail: "sarajohnson@gmail.com",
    clientType: "mollure",
    grossAmount: "€1,250",
    stripeFee: "€36",
    mollureFee: "€14",
    netAmount: "€1,200",
    methodTitle: "Online – direct",
    methodDetail: "iDeal",
    status: "Prepaid",
    document: {
      documentNumber: "INV-N4567",
      receiptNumber: "RCP-N4567",
      ...docBase,
      client: { legalName: "Sara Johnson", email: "sarajohnson@gmail.com" },
      totalPrice: "€1,200.00",
    },
  },
  {
    id: "t2",
    entryType: "onlineBooking",
    entryId: "345",
    date: "2023-03-02",
    bookingId: "345",
    clientName: "Guest Sara",
    clientEmail: "guest.sara@email.com",
    clientType: "guest",
    grossAmount: "€520",
    stripeFee: "€15",
    mollureFee: "€5",
    netAmount: "€500",
    methodTitle: "Online – direct",
    methodDetail: "EU Mastercard",
    status: "Paid",
    note: "Walk-in product purchase added to booking.",
    document: {
      documentNumber: "INV-Z8300",
      receiptNumber: "RCP-Z8300",
      ...docBase,
      client: { legalName: "Guest Sara", email: "guest.sara@email.com" },
      totalPrice: "€500.00",
    },
  },
  {
    id: "t3",
    entryType: "onlineBooking",
    entryId: null,
    date: null,
    bookingId: "345",
    clientName: "Guest Sara",
    clientEmail: "",
    clientType: "guest",
    grossAmount: "€150",
    netAmount: "€150",
    methodTitle: "Offline – direct",
    methodDetail: "",
    status: "Paid",
    document: {
      documentNumber: "INV-K1490",
      receiptNumber: "RCP-K1490",
      ...docBase,
      totalPrice: "€150.00",
    },
  },
  {
    id: "t4",
    entryType: "onlineBooking",
    entryId: null,
    date: "2023-03-03",
    bookingId: "345",
    clientName: "Add-on Client",
    clientEmail: "addon@email.com",
    clientType: "nonMollure",
    grossAmount: "€95",
    stripeFee: "€3",
    mollureFee: "€1",
    netAmount: "€91",
    methodTitle: "Online – direct",
    methodDetail: "iDeal",
    status: "Paid",
    document: {
      documentNumber: "INV-K1491",
      receiptNumber: "RCP-K1491",
      serviceDate: "2023-03-03",
      invoiceDate: "2023-03-03",
      dueDate: "2023-03-17",
      totalPrice: "€91.00",
    },
  },
  {
    id: "t5",
    entryType: "onlineBooking",
    entryId: "789",
    date: "2023-03-02",
    bookingId: "789",
    clientName: "Alex Martin",
    clientEmail: "alexmartin@gmail.com",
    clientType: "nonMollure",
    grossAmount: "€380",
    stripeFee: "€11",
    mollureFee: "€4",
    netAmount: "€365",
    methodTitle: "Online – direct",
    methodDetail: "iDeal",
    status: "Prepayment due",
    statusDetail: "Within response time",
    document: {
      documentNumber: "INV-K1491",
      ...docBase,
      client: { legalName: "Alex Martin", email: "alexmartin@gmail.com" },
      totalPrice: "€365.00",
    },
  },
  {
    id: "t6",
    entryType: "onlineBooking",
    entryId: "348",
    date: "2023-03-02",
    bookingId: "348",
    clientName: "Priya Sharma",
    clientEmail: "priya.s@gmail.com",
    clientType: "business",
    grossAmount: "€2,100",
    stripeFee: "€61",
    mollureFee: "€24",
    netAmount: "€2,015",
    methodTitle: "Online – direct",
    methodDetail: "iDeal",
    status: "Paid",
    document: {
      documentNumber: "INV-RF4587",
      receiptNumber: "RCP-RF4587",
      ...docBase,
      client: {
        legalName: "Priya Sharma BV",
        email: "priya.s@gmail.com",
        vatNumber: "NL890123456B01",
        cocNumber: "44556677",
      },
      totalPrice: "€2,015.00",
    },
  },
  {
    id: "t7",
    entryType: "onlineBooking",
    entryId: "348",
    date: "2023-03-02",
    bookingId: "348",
    clientName: "Priya Sharma",
    clientEmail: "priya.s@gmail.com",
    clientType: "business",
    grossAmount: "€2,100",
    netAmount: "€2,015",
    methodTitle: "Online – direct",
    methodDetail: "iDeal",
    status: "Refunded",
    document: {
      documentNumber: "INV-RF4587",
      receiptNumber: "RCP-RF4587-CR",
      ...docBase,
      totalPrice: "€2,015.00",
    },
  },
  {
    id: "t8",
    entryType: "onlineBooking",
    entryId: "456",
    date: "2023-03-03",
    bookingId: "456",
    clientName: "Emma van Dijk",
    clientEmail: "emma.vd@gmail.com",
    clientType: "mollure",
    grossAmount: "€850",
    netAmount: "€820",
    methodTitle: "Offline – invoice with due date",
    methodDetail: "Due date: 10/03/2023",
    status: "Payment due",
    statusDetail: "Due date: 10/03/2023",
    document: {
      documentNumber: "INV-N4567",
      serviceDate: "2023-03-03",
      invoiceDate: "2023-03-03",
      dueDate: "2023-03-10",
      client: { legalName: "Emma van Dijk", email: "emma.vd@gmail.com" },
      totalPrice: "€820.00",
    },
  },
  {
    id: "t9",
    entryType: "offlineBooking",
    entryId: "123",
    date: "2023-03-03",
    bookingId: "OF123",
    clientName: "Jordan Lee",
    clientEmail: "jordan.lee@email.com",
    clientType: "nonMollure",
    grossAmount: "€420",
    netAmount: "€420",
    methodTitle: "Offline – invoice with due date",
    methodDetail: "Due date: 17/03/2023",
    status: "Payment due",
    statusDetail: "Due date: 17/03/2023",
    document: {
      documentNumber: "INV-HG567",
      serviceDate: "2023-03-03",
      invoiceDate: "2023-03-03",
      dueDate: "2023-03-17",
      totalPrice: "€420.00",
    },
  },
  {
    id: "t10",
    entryType: "offlineBooking",
    entryId: "123",
    date: "2023-03-03",
    bookingId: "OF123",
    clientName: "Jordan Lee",
    clientEmail: "jordan.lee@email.com",
    clientType: "nonMollure",
    grossAmount: "€320",
    netAmount: "€320",
    methodTitle: "Offline – direct",
    methodDetail: "",
    status: "Pending",
    statusDetail: "Pay within 15 min",
    document: {
      documentNumber: "INV-I3367",
      serviceDate: "2023-03-03",
      invoiceDate: "2023-03-03",
      dueDate: "2023-03-03",
      totalPrice: "€320.00",
    },
  },
  {
    id: "t11",
    entryType: "manualEntry",
    entryId: "778",
    date: "2023-03-04",
    entryLabel: "Manual entry",
    clientName: "Guest",
    clientEmail: "",
    clientType: "guest",
    grossAmount: "€120",
    netAmount: "€120",
    methodTitle: "Offline – direct",
    methodDetail: "",
    status: "Paid",
    document: {
      documentNumber: "INV-G7789",
      receiptNumber: "RCP-G7789",
      serviceDate: "2023-03-04",
      invoiceDate: "2023-03-04",
      dueDate: "2023-03-04",
      totalPrice: "€120.00",
    },
  },
  {
    id: "t12",
    entryType: "manualEntry",
    entryId: "456",
    date: "2023-03-04",
    entryLabel: "Manual entry",
    clientName: "Client Name",
    clientEmail: "client@email.com",
    clientType: "mollure",
    grossAmount: "€600",
    stripeFee: "€17",
    mollureFee: "€7",
    netAmount: "€576",
    methodTitle: "Online – direct",
    methodDetail: "iDeal",
    status: "Refunded",
    document: {
      documentNumber: "INV-HI456",
      receiptNumber: "RCP-HI456",
      serviceDate: "2023-03-04",
      invoiceDate: "2023-03-04",
      dueDate: "2023-03-04",
      totalPrice: "€576.00",
    },
  },
  {
    id: "t13",
    entryType: "onlineBooking",
    entryId: "456",
    date: "2023-03-06",
    bookingId: "456",
    clientName: "Client Name",
    clientEmail: "client@email.com",
    clientType: "mollure",
    grossAmount: "€450",
    stripeFee: "€13",
    mollureFee: "€5",
    netAmount: "€432",
    methodTitle: "Online – non-direct",
    methodDetail: "Mastercard",
    status: "Failed",
    document: {
      documentNumber: "INV-NJ890",
      serviceDate: "2023-03-06",
      invoiceDate: "2023-03-06",
      dueDate: "2023-03-20",
      totalPrice: "€432.00",
    },
  },
  {
    id: "t14",
    entryType: "onlineBooking",
    entryId: "678",
    date: null,
    bookingId: "678",
    clientName: "Client Name",
    clientEmail: "client@email.com",
    clientType: "nonMollure",
    grossAmount: "€380",
    netAmount: "€368",
    methodTitle: "Online – invoice with due date",
    methodDetail: "Due date: 01/03/2023",
    status: "Overdue",
    statusDetail: "Due date: 01/03/2023 — Take action in booking calendar",
    document: {
      documentNumber: "INV-NJ999",
      serviceDate: "2023-02-20",
      invoiceDate: "2023-02-20",
      dueDate: "2023-03-01",
      totalPrice: "€368.00",
    },
  },
  {
    id: "t15",
    entryType: "onlineBooking",
    entryId: "678",
    date: "2023-03-07",
    bookingId: "678",
    clientName: "Client Name",
    clientEmail: "client@email.com",
    clientType: "nonMollure",
    grossAmount: "€380",
    netAmount: "€368",
    methodTitle: "Offline – direct",
    methodDetail: "",
    status: "Voided",
    document: {
      documentNumber: "INV-J3975",
      receiptNumber: "RCP-J3975",
      serviceDate: "2023-03-07",
      invoiceDate: "2023-03-07",
      dueDate: "2023-03-07",
      totalPrice: "€368.00",
    },
  },
  {
    id: "t16",
    entryType: "onlineBooking",
    entryId: null,
    date: null,
    bookingId: "678",
    clientName: "Client Name",
    clientEmail: "client@email.com",
    clientType: "nonMollure",
    grossAmount: "€395",
    netAmount: "€383",
    methodTitle: "Online – invoice with due date",
    methodDetail: "Due date: 21/03/2023",
    status: "Payment due",
    statusDetail: "Re-issued from INV-NJ999",
    document: {
      documentNumber: "INV-NJ1000",
      reissuedFrom: "INV-NJ999",
      serviceDate: "2023-03-07",
      invoiceDate: "2023-03-07",
      dueDate: "2023-03-21",
      totalPrice: "€383.00",
    },
  },
];

/** Derive action menu category from selected transaction statuses. */
export type TransactionActionCategory = "paid" | "failed" | "pending" | "voided" | "mixed";

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
        categories.add("voided");
        break;
      default:
        categories.add("paid");
        break;
    }
  }

  if (categories.size > 1) return "mixed";
  return categories.values().next().value ?? null;
}
