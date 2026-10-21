export type BookingFinanceTone = "default" | "paid" | "refund" | "due";

/** Unified balance badges for Finances + Calendar Sale Drawer. */
export type BookingFinanceBadge =
  | "PAID"
  | "PARTIALLY_PAID"
  | "UNPAID"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "PENDING_FEE"
  | "CANCELLED"
  | "PREPAID";

export type BookingLedgerLine = {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type BookingFinancialsSnapshot = {
  subtotal?: number;
  total_tax?: number;
  cancellation_fee?: number;
  total_paid?: number;
  total_refunded?: number;
  net_total?: number;
  outstanding_balance?: number;
  net_revenue?: number;
  prepayment_total?: number;
  payment_total?: number;
  prepaid_refunded?: number;
  net_prepayment_credit?: number;
  add_ons?: number;
  basePrice?: number;
  payment_status?: string;
  cancellation_payment_status?: string;
  updatedAt?: string;
};

/** Shared UI model for Finances page + Calendar Sale Drawer. */
export type BookingFinanceViewModel = {
  bookingId: string;
  uniqueCode?: string | null;
  basePrice: number;
  addOnsTotal: number;
  addOnLines: BookingPriceBreakdownRow[];
  cancellationFee: number;
  discounts: number;
  subtotal: number;
  netTotal: number;
  totalPaid: number;
  prepaymentTotal: number;
  paymentTotal: number;
  /** Backend: min(prepayment, refunded) applied against prepaid. */
  prepaidRefunded: number;
  /** Backend: max(0, prepayment − prepaid_refunded). Do not recompute on UI. */
  netPrepaymentCredit: number;
  totalRefunded: number;
  amountDue: number;
  badge: BookingFinanceBadge;
  paymentStatusRaw: string | null;
  bookingStatus: string | null;
  breakdownRows: BookingPriceBreakdownRow[];
  financials: BookingFinancialsSnapshot;
  ledger: BookingLedgerLine[];
};

export type BookingPriceBreakdownRow = {
  id: string;
  label: string;
  amount: number;
  tone?: BookingFinanceTone;
};

export type BookingPaymentSummaryLine = {
  id: string;
  label: string;
  amount: number;
  tone?: BookingFinanceTone;
  showInvoice?: boolean;
  showReceipt?: boolean;
  showPayNow?: boolean;
  /** Shown instead of invoice/receipt (e.g. offline visit-time prepayment). */
  note?: string;
};

export type BookingPaymentSummarySection = {
  id: string;
  title: string;
  amount?: number;
  variant?: "default" | "fee";
  lines: BookingPaymentSummaryLine[];
};
