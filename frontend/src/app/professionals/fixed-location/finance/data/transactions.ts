/**
 * Mock transaction rows for Finance → Overview.
 * Replace with API data when the backend is available.
 */

export type TransactionStatus = "Paid" | "Unpaid" | "Refunded";

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
  },
];
