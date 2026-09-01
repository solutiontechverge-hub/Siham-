export type BookingFinanceTone = "default" | "paid" | "refund" | "due";

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
