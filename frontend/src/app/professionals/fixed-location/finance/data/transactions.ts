/**
 * Mock transaction rows for Finance → Overview.
 * Replace with API data when the backend is available.
 */

export type TransactionStatus = "Paid" | "Unpaid" | "Refunded";

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
  member?: boolean;
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
    member: true,
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
    member: true,
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
    member: true,
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
    member: true,
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
    member: true,
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
];
