export type RefundsAdjustmentsRow = {
  adjustmentType: string;
  amountEur: number;
  shareOfGrossSalesPct: number;
};

export type UnpaidInvoicesFeeComplianceRow = {
  invoiceStatus: string;
  count: number;
  valueEur: number;
};

export type NetSalesOverviewRow = {
  metric: string;
  amountEur: number;
};

export type SalesByBookingOriginRow = {
  bookingOrigin: string;
  count: number;
  salesEur: number;
  sharePct: number;
  isTotal?: boolean;
};

export type ProfessionalFixedLocationSalesVolumeAnalyticsData = {
  refundsAndAdjustments: {
    title: string;
    rows: readonly RefundsAdjustmentsRow[];
    explanationLabel: string;
  };
  unpaidInvoicesAndFeeCompliance: {
    title: string;
    rows: readonly UnpaidInvoicesFeeComplianceRow[];
    explanationLabel: string;
  };
  netSalesOverview: {
    title: string;
    rows: readonly NetSalesOverviewRow[];
    explanationLabel: string;
  };
  salesByBookingOrigin: {
    title: string;
    rows: readonly SalesByBookingOriginRow[];
    explanationLabel: string;
  };
};

export const professionalFixedLocationSalesVolumeAnalyticsData: ProfessionalFixedLocationSalesVolumeAnalyticsData = {
  refundsAndAdjustments: {
    title: "2.3 Refunds & Adjustments",
    rows: [
      { adjustmentType: "Refunds issued", amountEur: -900, shareOfGrossSalesPct: -4 },
      { adjustmentType: "Late rescheduling fees collected", amountEur: 300, shareOfGrossSalesPct: 1.5 },
      { adjustmentType: "Late cancellation fees collected", amountEur: 250, shareOfGrossSalesPct: 1.2 },
      { adjustmentType: "Overdue payment fees collected", amountEur: 150, shareOfGrossSalesPct: 0.7 },
      { adjustmentType: "Extra charges (unique items)", amountEur: 500, shareOfGrossSalesPct: 2.4 },
    ],
    explanationLabel: "View Explanation",
  },
  unpaidInvoicesAndFeeCompliance: {
    title: "2.4 Unpaid Invoices & Fee Compliance",
    rows: [
      { invoiceStatus: "Paid on time", count: 40, valueEur: 8200 },
      { invoiceStatus: "Paid late", count: 10, valueEur: 2600 },
      { invoiceStatus: "Unpaid (not yet due)", count: 6, valueEur: 1200 },
      { invoiceStatus: "Overdue (past due date)", count: 4, valueEur: 900 },
    ],
    explanationLabel: "View Explanation",
  },
  netSalesOverview: {
    title: "2.5 Net Sales Overview",
    rows: [
      { metric: "Net service sales", amountEur: 13600 },
      { metric: "Net product sales", amountEur: 2500 },
      { metric: "Extra charges (unique items)", amountEur: 500 },
      { metric: "Subtotal before adjustments", amountEur: 16600 },
      { metric: "Refunds issued", amountEur: 16600 },
      { metric: "Unpaid invoices (not yet due)", amountEur: 16600 },
      { metric: "Overdue invoices", amountEur: 16600 },
      { metric: "Late rescheduling fees collected", amountEur: 16600 },
      { metric: "Late cancellation fees collected", amountEur: 16600 },
      { metric: "Overdue payment fees collected", amountEur: 16600 },
      { metric: "Final net sales", amountEur: 16600 },
    ],
    explanationLabel: "View Explanation",
  },
  salesByBookingOrigin: {
    title: "2.6 Sales by Booking Origin",
    rows: [
      { bookingOrigin: "Online Booking", count: 90, salesEur: 6800, sharePct: 30 },
      { bookingOrigin: "Offline Booking", count: 60, salesEur: 4600, sharePct: 60 },
      { bookingOrigin: "TOTAL", count: 150, salesEur: 11400, sharePct: 100, isTotal: true },
    ],
    explanationLabel: "View Explanation",
  },
};

