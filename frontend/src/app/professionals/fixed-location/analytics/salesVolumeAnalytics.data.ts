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

export type ProductSalesRow = {
  product: string;
  count: number;
  salesEur: number;
  sharePct: number;
  isTotal?: boolean;
};

export type SalesByCategoryServiceRow = {
  category: string;
  service: string;
  count: number;
  netSalesEur: number;
  sharePct: number;
  isCategoryTotal?: boolean;
  isGrandTotal?: boolean;
  /** When true, category cell is blank (same group as row above). */
  hideCategoryCell?: boolean;
};

export type SalesVolumeChartSegment = {
  service: string;
  salesEur: number;
  shareWithinBarPct: number;
};

export type SalesVolumeCategoryBar = {
  category: string;
  segments: readonly SalesVolumeChartSegment[];
  totalSalesEur: number;
  totalSharePct: number;
};

export type SalesVolumeChartLegendItem = {
  label: string;
  colorIndex: number;
};

export type SalesVolumeChartLegendGroup = {
  category: string;
  items: readonly SalesVolumeChartLegendItem[];
};

type AnalyticsExplanationContent = import("./analytics.data").AnalyticsExplanationContent;

export type ProfessionalFixedLocationSalesVolumeAnalyticsData = {
  productSales: {
    title: string;
    rows: readonly ProductSalesRow[];
    chartMaxEur: number;
    explanationLabel: string;
    explanationContent?: AnalyticsExplanationContent;
  };
  salesByCategoriesAndServices: {
    title: string;
    rows: readonly SalesByCategoryServiceRow[];
    chartTitle: string;
    chartMaxEur: number;
    categoryBars: readonly SalesVolumeCategoryBar[];
    legend: readonly SalesVolumeChartLegendGroup[];
    explanationLabel: string;
    explanationContent?: AnalyticsExplanationContent;
  };
  refundsAndAdjustments: {
    title: string;
    rows: readonly RefundsAdjustmentsRow[];
    explanationLabel: string;
    explanationContent?: AnalyticsExplanationContent;
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
    explanationContent?: AnalyticsExplanationContent;
  };
  salesByBookingOrigin: {
    title: string;
    rows: readonly SalesByBookingOriginRow[];
    explanationLabel: string;
  };
};

const salesByCategoriesRows: SalesByCategoryServiceRow[] = [
  { category: "Hair", service: "Haircut", count: 120, netSalesEur: 2200, sharePct: 12.5, hideCategoryCell: false },
  { category: "Hair", service: "Hair Coloring", count: 85, netSalesEur: 3400, sharePct: 19.3, hideCategoryCell: true },
  { category: "Hair", service: "Blow Dry", count: 95, netSalesEur: 1400, sharePct: 8.0, hideCategoryCell: true },
  { category: "Hair", service: "Total Hair", count: 300, netSalesEur: 7000, sharePct: 39.8, isCategoryTotal: true, hideCategoryCell: true },

  { category: "Nails", service: "Manicure", count: 140, netSalesEur: 1800, sharePct: 10.2, hideCategoryCell: false },
  { category: "Nails", service: "Gel Polish", count: 110, netSalesEur: 2200, sharePct: 12.5, hideCategoryCell: true },
  { category: "Nails", service: "Total Nails", count: 250, netSalesEur: 4000, sharePct: 22.7, isCategoryTotal: true, hideCategoryCell: true },

  { category: "Eyebrows", service: "Brow Shaping", count: 90, netSalesEur: 900, sharePct: 5.1, hideCategoryCell: false },
  { category: "Eyebrows", service: "Brow Tint", count: 75, netSalesEur: 600, sharePct: 3.4, hideCategoryCell: true },
  { category: "Eyebrows", service: "Total Eyebrows", count: 165, netSalesEur: 1500, sharePct: 8.5, isCategoryTotal: true, hideCategoryCell: true },

  { category: "Eyelashes", service: "Classic Lashes", count: 80, netSalesEur: 1600, sharePct: 9.1, hideCategoryCell: false },
  { category: "Eyelashes", service: "Volume Lashes", count: 65, netSalesEur: 1900, sharePct: 10.8, hideCategoryCell: true },
  { category: "Eyelashes", service: "Total Eyelashes", count: 145, netSalesEur: 3500, sharePct: 19.9, isCategoryTotal: true, hideCategoryCell: true },

  { category: "Body Treatments", service: "Massage", count: 55, netSalesEur: 1500, sharePct: 8.5, hideCategoryCell: false },
  { category: "Body Treatments", service: "Body Scrub", count: 40, netSalesEur: 900, sharePct: 5.1, hideCategoryCell: true },
  { category: "Body Treatments", service: "Total Body Treatments", count: 95, netSalesEur: 2400, sharePct: 13.6, isCategoryTotal: true, hideCategoryCell: true },

  { category: "Face Treatments", service: "Facial", count: 70, netSalesEur: 1200, sharePct: 6.8, hideCategoryCell: false },
  { category: "Face Treatments", service: "Peel", count: 45, netSalesEur: 800, sharePct: 4.5, hideCategoryCell: true },
  { category: "Face Treatments", service: "Total Face Treatments", count: 115, netSalesEur: 2000, sharePct: 11.4, isCategoryTotal: true, hideCategoryCell: true },

  { category: "Makeup", service: "Event Makeup", count: 35, netSalesEur: 1100, sharePct: 6.3, hideCategoryCell: false },
  { category: "Makeup", service: "Bridal Makeup", count: 28, netSalesEur: 1500, sharePct: 8.5, hideCategoryCell: true },
  { category: "Makeup", service: "Total Makeup", count: 63, netSalesEur: 2600, sharePct: 14.8, isCategoryTotal: true, hideCategoryCell: true },

  {
    category: "All",
    service: "Total (All categories and services)",
    count: 1128,
    netSalesEur: 17600,
    sharePct: 100,
    isGrandTotal: true,
    hideCategoryCell: false,
  },
];

const categoryBars: SalesVolumeCategoryBar[] = [
  {
    category: "Body Treatment",
    totalSalesEur: 3200,
    totalSharePct: 9,
    segments: [
      { service: "Massage", salesEur: 1500, shareWithinBarPct: 47 },
      { service: "Scrub", salesEur: 1000, shareWithinBarPct: 31 },
      { service: "Wrap", salesEur: 700, shareWithinBarPct: 22 },
    ],
  },
  {
    category: "Brows",
    totalSalesEur: 2500,
    totalSharePct: 9,
    segments: [
      { service: "Shaping", salesEur: 1000, shareWithinBarPct: 37 },
      { service: "Tint", salesEur: 800, shareWithinBarPct: 33 },
      { service: "Lamination", salesEur: 700, shareWithinBarPct: 30 },
    ],
  },
  {
    category: "EyeLashes",
    totalSalesEur: 2500,
    totalSharePct: 9,
    segments: [
      { service: "Extension", salesEur: 875, shareWithinBarPct: 35 },
      { service: "Lift", salesEur: 750, shareWithinBarPct: 30 },
      { service: "Tint", salesEur: 500, shareWithinBarPct: 20 },
      { service: "Fill", salesEur: 375, shareWithinBarPct: 15 },
    ],
  },
  {
    category: "Nails",
    totalSalesEur: 2500,
    totalSharePct: 9,
    segments: [
      { service: "Manicure", salesEur: 1000, shareWithinBarPct: 37 },
      { service: "Gel", salesEur: 800, shareWithinBarPct: 33 },
      { service: "Pedicure", salesEur: 700, shareWithinBarPct: 30 },
    ],
  },
  {
    category: "Makeup",
    totalSalesEur: 2500,
    totalSharePct: 9,
    segments: [
      { service: "Extension", salesEur: 875, shareWithinBarPct: 35 },
      { service: "Lift", salesEur: 750, shareWithinBarPct: 30 },
      { service: "Tint", salesEur: 500, shareWithinBarPct: 20 },
      { service: "Event", salesEur: 375, shareWithinBarPct: 15 },
    ],
  },
];

const chartLegend: SalesVolumeChartLegendGroup[] = [
  {
    category: "Hair",
    items: [
      { label: "Haircut", colorIndex: 0 },
      { label: "Coloring", colorIndex: 1 },
      { label: "Coloring", colorIndex: 2 },
    ],
  },
  {
    category: "Makeup",
    items: [
      { label: "Extension", colorIndex: 0 },
      { label: "Lift", colorIndex: 1 },
      { label: "Tint", colorIndex: 2 },
      { label: "Tint", colorIndex: 3 },
    ],
  },
  {
    category: "Eyelashes",
    items: [
      { label: "Extension", colorIndex: 0 },
      { label: "Lift", colorIndex: 1 },
      { label: "Tint", colorIndex: 2 },
    ],
  },
  {
    category: "Brows",
    items: [
      { label: "Shaping", colorIndex: 0 },
      { label: "Tint", colorIndex: 1 },
    ],
  },
];

const productSalesRows: ProductSalesRow[] = [
  { product: "Conditioner",  count: 120, salesEur: 2500, sharePct: 9.0 },
  { product: "Hair Oil",     count: 95,  salesEur: 2300, sharePct: 9.0 },
  { product: "Nail Polish",  count: 80,  salesEur: 2500, sharePct: 9.0 },
  { product: "Face Serum",   count: 70,  salesEur: 2500, sharePct: 9.0 },
  { product: "Body Scrub",   count: 62,  salesEur: 2200, sharePct: 8.0 },
  { product: "Lash Serum",   count: 45,  salesEur: 1800, sharePct: 7.0 },
  { product: "Total (All products)", count: 472, salesEur: 13800, sharePct: 100.0, isTotal: true },
];

export const professionalFixedLocationSalesVolumeAnalyticsData: ProfessionalFixedLocationSalesVolumeAnalyticsData = {
  productSales: {
    title: "2.2 Product Sales",
    rows: productSalesRows,
    chartMaxEur: 3000,
    explanationLabel: "View Explanation",
    explanationContent: {
      blocks: [
        {
          title: "Product Sales",
          paragraphs: [
            "Shows sales count, revenue, and share for products selected from your product list. Unique extra charges are not included here.",
            "Calculation: Share (%) = Product Sales ÷ Total Product Sales × 100.",
          ],
        },
      ],
    },
  },
  salesByCategoriesAndServices: {
    title: "2.1 Sales by Categories and Services",
    rows: salesByCategoriesRows,
    chartTitle: "",
    chartMaxEur: 6000,
    categoryBars,
    legend: chartLegend,
    explanationLabel: "View Explanation",
    explanationContent: {
      blocks: [
        {
          title: "Sales by Categories and Services",
          paragraphs: [
            "Shows the revenue, count, and share generated by each service category and service.",
            "Calculation: Count = total number of completed services in the selected period. Share (%) = (Service Sales ÷ Total Gross Sales) × 100. Sales (€) are net of Stripe transaction fees, but refunds not yet deducted.",
          ],
        },
      ],
    },
  },
  refundsAndAdjustments: {
    title: "2.3 Refunds & Adjustments",
    rows: [
      { adjustmentType: "Refunds issued", amountEur: -900, shareOfGrossSalesPct: -4 },
      { adjustmentType: "Late rescheduling fees collected", amountEur: 300, shareOfGrossSalesPct: 1.5 },
      { adjustmentType: "Late cancellation fees collected", amountEur: 250, shareOfGrossSalesPct: 1.2 },
      { adjustmentType: "Late no-show fees collected", amountEur: 150, shareOfGrossSalesPct: 0.7 },
      { adjustmentType: "Overdue payment fees collected", amountEur: 500, shareOfGrossSalesPct: 2.4 },
      { adjustmentType: "Extra charges (unique items)", amountEur: 500, shareOfGrossSalesPct: 2.4 },
    ],
    explanationLabel: "View Explanation",
    explanationContent: {
      blocks: [
        {
          title: "Refunds & Adjustments",
          paragraphs: ["Shows all financial adjustments such as refunds, extra charges, and late fees."],
        },
      ],
    },
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
    title: "2.4 Net Sales Overview",
    rows: [
      { metric: "Net service sales", amountEur: 13600 },
      { metric: "Net product sales", amountEur: 2500 },
      { metric: "Extra charges (unique items)", amountEur: 500 },
      { metric: "Subtotal before adjustments", amountEur: 16600 },
      { metric: "Refunds issued", amountEur: -900 },
      { metric: "Unpaid invoices (not yet due)", amountEur: 1200 },
      { metric: "Overdue invoices", amountEur: 900 },
      { metric: "Late rescheduling fees collected", amountEur: 300 },
      { metric: "Late cancellation fees collected", amountEur: 250 },
      { metric: "No show fees collected", amountEur: 150 },
      { metric: "Overdue payment fees collected", amountEur: 500 },
      { metric: "Final net sales", amountEur: 18800 },
    ],
    explanationLabel: "View Explanation",
    explanationContent: {
      blocks: [
        {
          title: "Net Sales Overview",
          paragraphs: ["Summarises all earnings and deductions to calculate your final net sales."],
        },
      ],
    },
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
