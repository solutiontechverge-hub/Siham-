/**
 * Mock transaction rows for Finance → Overview.
 * Replace with API data when the backend is available.
 */

export type TransactionStatus =
  | "Paid"
  | "Unpaid"
  | "Refunded"
  | "Void"
  | "Cancelled"
  | "Pending"
  | "Failed"
  | "Prepaid";

/** Maps filter drawer keys to row statuses. */
export function transactionMatchesStatusFilter(
  status: TransactionStatus,
  statusKeys: readonly string[],
): boolean {
  if (!statusKeys.length) return true;

  return statusKeys.some((key) => {
    switch (key) {
      case "status:paid":
        return status === "Paid";
      case "status:pending":
        return status === "Unpaid" || status === "Pending";
      case "status:failed":
        return status === "Refunded" || status === "Failed";
      case "status:prepaid":
        return status === "Prepaid";
      case "status:cancelled":
        return status === "Cancelled" || status === "Void";
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
  lines: { name: string; quantity: number; unitPrice: number }[];
  totalPrice: number;
};

export function buildManualEntryTransactionRow(input: ManualEntryTransactionInput): TransactionRow {
  const today = new Date().toISOString().slice(0, 10);
  const due = new Date();
  due.setDate(due.getDate() + 14);
  const dueStr = `${String(due.getDate()).padStart(2, "0")}/${String(due.getMonth() + 1).padStart(2, "0")}/${due.getFullYear()}`;
  const entryNum = String(100 + Math.floor(Math.random() * 900));

  const lineItems = input.lines.map((line) => ({
    description: line.name,
    quantity: String(line.quantity),
    vat: "21%",
    pricePerUnit: formatNetAmountEur(line.unitPrice),
    totalPrice: formatNetAmountEur(line.quantity * line.unitPrice),
  }));

  return {
    id: `t-manual-${Date.now()}`,
    entryId: entryNum,
    date: today,
    entryLabel: "Manually",
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    clientType: input.clientType,
    netAmount: formatNetAmountEur(input.totalPrice),
    methodTitle: "Offline - Cash",
    methodDetail: `Due Date: ${dueStr}`,
    status: "Unpaid",
    document: {
      documentNumber: `INV-${entryNum}-01`,
      serviceDate: today,
      invoiceDate: today,
      dueDate: due.toISOString().slice(0, 10),
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
      return "mollure client";
    case "nonMollure":
      return "non mollure";
    case "business":
      return "BS client";
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
  return isTransactionOnlinePayment(row.methodTitle);
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
  serviceDate: string;
  invoiceDate: string;
  dueDate: string;
  lateFeeNotice?: string;
  client?: TransactionDocumentParty;
  bookingItems?: TransactionDocumentBookingItem[];
  lineItems?: TransactionDocumentLineItem[];
  totalPrice?: string;
};

export type TransactionRow = {
  id: string;
  /** Shown in Entry ID column; use null for continuation rows under the same logical entry */
  entryId: string | null;
  /** YYYY-MM-DD or null when grouped under a parent row */
  date: string | null;
  /** Optional label instead of/alongside entry id (e.g. "Manually") */
  entryLabel?: string;
  clientName: string;
  clientEmail: string;
  clientType: TransactionClientType;
  netAmount: string;
  methodTitle: string;
  methodDetail: string;
  status: TransactionStatus;
  document?: TransactionDocument;
};

export const mockTransactions: TransactionRow[] = [
  {
    id: "t1",
    entryId: "123",
    date: "2023-01-01",
    clientName: "Sara Johnson",
    clientEmail: "sarajohnson@gmail.com",
    clientType: "mollure",
    netAmount: "€1,200",
    methodTitle: "Online - Direct",
    methodDetail: "Stripe",
    status: "Paid",
    document: {
      documentNumber: "INV-123-01",
      serviceDate: "2023-01-01",
      invoiceDate: "2023-01-01",
      dueDate: "2023-01-15",
      lateFeeNotice: "Late payment fee: 5% of the outstanding amount applies after the due date.",
      client: {
        legalName: "Sara Johnson",
        email: "sarajohnson@gmail.com",
        address: "2464 Royal Ln, Mesa, New Jersey",
      },
      bookingItems: [
        { label: "Braids", value: "€700.00" },
        { label: "Hair Treatment", value: "€500.00" },
      ],
      lineItems: [
        { description: "Braids", quantity: "1", vat: "10%", pricePerUnit: "€700.00", totalPrice: "€700.00" },
        { description: "Hair Treatment", quantity: "1", vat: "10%", pricePerUnit: "€500.00", totalPrice: "€500.00" },
      ],
      totalPrice: "€1,200.00",
    },
  },
  {
    id: "t2",
    entryId: null,
    date: null,
    clientName: "Sara Johnson",
    clientEmail: "sarajohnson@gmail.com",
    clientType: "mollure",
    netAmount: "€300",
    methodTitle: "Online - Direct",
    methodDetail: "Stripe",
    status: "Paid",
    document: {
      documentNumber: "INV-123-02",
      serviceDate: "2023-01-01",
      invoiceDate: "2023-01-01",
      dueDate: "2023-01-15",
      lateFeeNotice: "Late payment fee: 5% of the outstanding amount applies after the due date.",
      client: {
        legalName: "Sara Johnson",
        email: "sarajohnson@gmail.com",
        address: "2464 Royal Ln, Mesa, New Jersey",
      },
      bookingItems: [
        { label: "Product Upsell", value: "€300.00" },
      ],
      lineItems: [
        { description: "Hair Serum", quantity: "2", vat: "10%", pricePerUnit: "€150.00", totalPrice: "€300.00" },
      ],
      totalPrice: "€300.00",
    },
  },
  {
    id: "t3",
    entryId: "133",
    date: "2023-01-02",
    clientName: "Alex Martin",
    clientEmail: "alexmartin@gmail.com",
    clientType: "nonMollure",
    netAmount: "€1,700",
    methodTitle: "Offline - Cash",
    methodDetail: "Due Date: 24/12/2023",
    status: "Unpaid",
    document: {
      documentNumber: "INV-133-01",
      serviceDate: "2023-01-02",
      invoiceDate: "2023-01-02",
      dueDate: "2023-01-24",
      lateFeeNotice: "Late payment fee: 10% of the outstanding amount applies after the due date.",
      client: {
        legalName: "Alex Martin",
        email: "alexmartin@gmail.com",
        address: "848 Fashion Ave, Brooklyn, New York",
        vatNumber: "NL123456780B01",
        cocNumber: "99887766",
      },
      bookingItems: [
        { label: "Color Correction", value: "€1,100.00" },
        { label: "Styling Session", value: "€600.00" },
      ],
      lineItems: [
        { description: "Color Correction", quantity: "1", vat: "21%", pricePerUnit: "€1,100.00", totalPrice: "€1,100.00" },
        { description: "Styling Session", quantity: "2", vat: "21%", pricePerUnit: "€300.00", totalPrice: "€600.00" },
      ],
      totalPrice: "€1,700.00",
    },
  },
  {
    id: "t4",
    entryId: "111",
    date: "2023-01-03",
    entryLabel: "Manually",
    clientName: "Emma van Dijk",
    clientEmail: "emma.vd@gmail.com",
    clientType: "guest",
    netAmount: "€850",
    methodTitle: "Online - Direct",
    methodDetail: "Stripe",
    status: "Refunded",
    document: {
      documentNumber: "INV-111-01",
      serviceDate: "2023-01-03",
      invoiceDate: "2023-01-03",
      dueDate: "2023-01-17",
      lateFeeNotice: "This invoice was refunded after payment.",
      client: {
        legalName: "Emma van Dijk",
        email: "emma.vd@gmail.com",
        address: "21 Keizersgracht, Amsterdam, Netherlands",
      },
      bookingItems: [
        { label: "Manual Makeup Booking", value: "€850.00" },
      ],
      lineItems: [
        { description: "Bridal Makeup", quantity: "1", vat: "9%", pricePerUnit: "€600.00", totalPrice: "€600.00" },
        { description: "Touch-Up Kit", quantity: "1", vat: "9%", pricePerUnit: "€250.00", totalPrice: "€250.00" },
      ],
      totalPrice: "€850.00",
    },
  },
  {
    id: "t5",
    entryId: "456",
    date: "2023-01-04",
    clientName: "Priya Sharma",
    clientEmail: "priya.s@gmail.com",
    clientType: "business",
    netAmount: "€2,400",
    methodTitle: "Offline - Cash",
    methodDetail: "Due Date: 15/01/2024",
    status: "Unpaid",
    document: {
      documentNumber: "INV-456-01",
      serviceDate: "2023-01-04",
      invoiceDate: "2023-01-04",
      dueDate: "2024-01-15",
      lateFeeNotice: "Late payment fee: 20EUR applies after the due date.",
      client: {
        legalName: "Priya Sharma",
        email: "priya.s@gmail.com",
        address: "16 Park Lane, Eindhoven, Netherlands",
        vatNumber: "NL890123456B01",
        cocNumber: "44556677",
      },
      bookingItems: [
        { label: "Hair Extensions", value: "€1,800.00" },
        { label: "Maintenance Package", value: "€600.00" },
      ],
      lineItems: [
        { description: "Hair Extensions", quantity: "1", vat: "21%", pricePerUnit: "€1,800.00", totalPrice: "€1,800.00" },
        { description: "Maintenance Package", quantity: "1", vat: "21%", pricePerUnit: "€600.00", totalPrice: "€600.00" },
      ],
      totalPrice: "€2,400.00",
    },
  },
  {
    id: "t6",
    entryId: null,
    date: null,
    clientName: "Priya Sharma",
    clientEmail: "priya.s@gmail.com",
    clientType: "business",
    netAmount: "€600",
    methodTitle: "Offline - Cash",
    methodDetail: "Due Date: 15/01/2024",
    status: "Paid",
    document: {
      documentNumber: "INV-456-02",
      serviceDate: "2023-01-04",
      invoiceDate: "2023-01-04",
      dueDate: "2024-01-15",
      lateFeeNotice: "Late payment fee: 20EUR applies after the due date.",
      client: {
        legalName: "Priya Sharma",
        email: "priya.s@gmail.com",
        address: "16 Park Lane, Eindhoven, Netherlands",
      },
      bookingItems: [
        { label: "Aftercare Products", value: "€600.00" },
      ],
      lineItems: [
        { description: "Aftercare Products", quantity: "3", vat: "21%", pricePerUnit: "€200.00", totalPrice: "€600.00" },
      ],
      totalPrice: "€600.00",
    },
  },
  {
    id: "t7",
    entryId: "789",
    date: "2023-01-05",
    clientName: "Jordan Lee",
    clientEmail: "jordan.lee@email.com",
    clientType: "guest",
    netAmount: "€120",
    methodTitle: "Offline - Cash",
    methodDetail: "Due Date: 01/02/2024",
    status: "Unpaid",
  },
];
