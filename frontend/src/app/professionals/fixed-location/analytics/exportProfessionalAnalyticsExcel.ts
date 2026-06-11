import * as XLSX from "xlsx";
import type { ProfessionalAnalyticsSubTab, ProfessionalFixedLocationAnalyticsData } from "./analytics.data";

export type ProfessionalAnalyticsExportScope = "all" | ProfessionalAnalyticsSubTab;
export type ProfessionalAnalyticsExportSelection = ProfessionalAnalyticsExportScope | readonly ProfessionalAnalyticsSubTab[];

export type AnalyticsExportDateValidation =
  | { ok: true }
  | { ok: false; message: string };

type SheetCell = string | number;

type AnalyticsSheetSection = {
  title: string;
  headers: readonly string[];
  rows: readonly (readonly SheetCell[])[];
};

export function validateAnalyticsExportDates(
  fromDate: string,
  toDate: string,
  todayIso: string,
): AnalyticsExportDateValidation {
  const hasFrom = Boolean(fromDate);
  const hasTo = Boolean(toDate);

  if ((hasFrom && !hasTo) || (!hasFrom && hasTo)) {
    return { ok: false, message: "Please select both Date From and Date To before exporting." };
  }
  if (fromDate && fromDate > todayIso) {
    return { ok: false, message: "Date From cannot be in the future." };
  }
  if (toDate && toDate > todayIso) {
    return { ok: false, message: "Date To cannot be in the future." };
  }
  if (fromDate && toDate && fromDate > toDate) {
    return { ok: false, message: "Date From must be before Date To." };
  }
  return { ok: true };
}

function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[\\/*?:[\]]/g, " ").trim();
  return (cleaned || "Sheet").slice(0, 31);
}

function formatAmountEur(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amount < 0 ? `-${formatted}` : formatted;
}

function formatPct(pct: number): string {
  const abs = Math.abs(pct);
  const formatted = abs.toLocaleString(undefined, { maximumFractionDigits: 1 });
  return pct < 0 ? `-${formatted}%` : `${formatted}%`;
}

function buildSectionedSheet(title: string, sections: readonly AnalyticsSheetSection[]): XLSX.WorkSheet {
  const sheetData: SheetCell[][] = [[title], []];

  sections.forEach((section, index) => {
    if (index > 0) sheetData.push([]);
    sheetData.push([section.title]);
    sheetData.push([...section.headers]);
    section.rows.forEach((row) => sheetData.push([...row]));
  });

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const maxColumnCount = sheetData.reduce((max, row) => Math.max(max, row.length), 1);
  worksheet["!cols"] = Array.from({ length: maxColumnCount }, (_, index) => {
    const maxLen = sheetData.reduce((max, row) => Math.max(max, String(row[index] ?? "").length), 0);
    return { wch: Math.min(Math.max(maxLen + 2, 12), 42) };
  });
  return worksheet;
}

function isAllScope(scope: ProfessionalAnalyticsExportSelection): scope is "all" {
  return scope === "all";
}

function isScopeArray(scope: ProfessionalAnalyticsExportSelection): scope is readonly ProfessionalAnalyticsSubTab[] {
  return Array.isArray(scope);
}

function shouldInclude(scope: ProfessionalAnalyticsExportSelection, tab: ProfessionalAnalyticsSubTab): boolean {
  if (isAllScope(scope)) return true;
  if (isScopeArray(scope)) return scope.includes(tab);
  return scope === tab;
}

function scopeSlug(scope: ProfessionalAnalyticsExportSelection): string {
  const label = isAllScope(scope) ? "all" : isScopeArray(scope) ? scope.join("-") : scope;
  return label.replaceAll(" ", "-").replaceAll(",", "").toLowerCase();
}

function appendBookingSheet(workbook: XLSX.WorkBook, data: ProfessionalFixedLocationAnalyticsData) {
  const { sections } = data;

  XLSX.utils.book_append_sheet(
    workbook,
    buildSectionedSheet("Booking and Operational Analytics", [
      {
        title: sections.bookingOriginAndType.title,
        headers: ["Origin", "FL Count", "DL Count", "Project Count", "Total", "Share (%)"],
        rows: sections.bookingOriginAndType.rows.map((r) => [
          r.origin,
          r.flCount,
          r.dlCount,
          r.projectCount,
          r.total,
          `${r.sharePct}%`,
        ]),
      },
      {
        title: sections.bookingStatusSummary.title,
        headers: ["Status", "Count", "Share (%)"],
        rows: sections.bookingStatusSummary.rows.map((r) => [r.status, r.count, formatPct(r.sharePct)]),
      },
      {
        title: sections.attendanceNoShowAnalytics.title,
        headers: ["Booking Type", "No-Show Count", "Share (%)"],
        rows: sections.attendanceNoShowAnalytics.rows.map((r) => [r.bookingType, r.noShowCount, formatPct(r.sharePct)]),
      },
      {
        title: sections.bookingByServiceCategory.title,
        headers: ["Category", "Count", "Share (%)"],
        rows: sections.bookingByServiceCategory.rows.map((r) => [r.category, r.count, formatPct(r.sharePct)]),
      },
    ]),
    sanitizeSheetName("Booking and Operational"),
  );
}

function appendSalesVolumeSheet(workbook: XLSX.WorkBook, data: ProfessionalFixedLocationAnalyticsData) {
  const sv = data.salesVolume;

  XLSX.utils.book_append_sheet(
    workbook,
    buildSectionedSheet("Sales Volume Analytics", [
      {
        title: sv.salesByCategoriesAndServices.title,
        headers: ["Category", "Service", "Count", "Net Sales (EUR)", "Share (%)"],
        rows: sv.salesByCategoriesAndServices.rows.map((r) => [
          r.hideCategoryCell ? "" : r.category,
          r.service,
          r.count,
          formatAmountEur(r.netSalesEur),
          formatPct(r.sharePct),
        ]),
      },
      {
        title: sv.refundsAndAdjustments.title,
        headers: ["Adjustment Type", "Amount (EUR)", "Share of Gross Sales"],
        rows: sv.refundsAndAdjustments.rows.map((r) => [
          r.adjustmentType,
          formatAmountEur(r.amountEur),
          formatPct(r.shareOfGrossSalesPct),
        ]),
      },
      {
        title: sv.unpaidInvoicesAndFeeCompliance.title,
        headers: ["Invoice Status", "Count", "Value (EUR)"],
        rows: sv.unpaidInvoicesAndFeeCompliance.rows.map((r) => [
          r.invoiceStatus,
          r.count,
          formatAmountEur(r.valueEur),
        ]),
      },
      {
        title: sv.netSalesOverview.title,
        headers: ["Metric", "Amount (EUR)"],
        rows: sv.netSalesOverview.rows.map((r) => [r.metric, formatAmountEur(r.amountEur)]),
      },
      {
        title: sv.salesByBookingOrigin.title,
        headers: ["Booking Origin", "Count", "Sales (EUR)", "Share (%)"],
        rows: sv.salesByBookingOrigin.rows.map((r) => [
          r.bookingOrigin,
          r.count,
          formatAmountEur(r.salesEur),
          formatPct(r.sharePct),
        ]),
      },
    ]),
    sanitizeSheetName("Sales Volume"),
  );
}

function appendPerformanceSheet(workbook: XLSX.WorkBook, data: ProfessionalFixedLocationAnalyticsData) {
  const perf = data.performance.productivityAndEfficiency;

  XLSX.utils.book_append_sheet(
    workbook,
    buildSectionedSheet("Performance Analytics", [
      {
        title: perf.title,
        headers: [
          "Team Member",
          "Hours Worked",
          "Completed Bookings",
          "Revenue (EUR)",
          "Productivity (EUR/hr)",
          "Efficiency (%)",
          "Average Rating",
          "Reviews",
        ],
        rows: perf.rows.map((r) => [
          r.teamMember,
          r.hoursWorked,
          r.completedBookings,
          formatAmountEur(r.revenueEur),
          formatAmountEur(r.productivityEurPerHr),
          formatPct(r.efficiencyPct),
          r.averageRating,
          r.reviews,
        ]),
      },
    ]),
    sanitizeSheetName("Performance"),
  );
}

function appendRatingReviewSheet(workbook: XLSX.WorkBook, data: ProfessionalFixedLocationAnalyticsData) {
  const { ratingReview } = data;

  XLSX.utils.book_append_sheet(
    workbook,
    buildSectionedSheet("Rating and Review Analytics", [
      {
        title: ratingReview.reviewManagementOverview.title,
        headers: ["Overall Rating", "Rating Out Of", "Total Reviews"],
        rows: [[
          ratingReview.reviewManagementOverview.overallRating,
          ratingReview.reviewManagementOverview.ratingOutOf,
          ratingReview.reviewManagementOverview.totalReviews,
        ]],
      },
      {
        title: ratingReview.ratingReviewAnalytics.title,
        headers: ["Category", "Range", "Count", "Share (%)", "Replied To"],
        rows: ratingReview.ratingReviewAnalytics.rows.map((r) => [
          r.category,
          r.range,
          r.count,
          formatPct(r.sharePct),
          r.repliedTo,
        ]),
      },
      {
        title: ratingReview.ratingDistributionByCategory.title,
        headers: ["Category", "Bad (%)", "Good (%)", "Excellent (%)", "Total Reviews"],
        rows: ratingReview.ratingDistributionByCategory.rows.map((r) => [
          r.category,
          formatPct(r.badPct),
          formatPct(r.goodPct),
          formatPct(r.excellentPct),
          r.totalReviews,
        ]),
      },
      {
        title: ratingReview.reviewSummaryByCategory.title,
        headers: ["Category", "Total Reviews", "Bad (%)", "Good (%)", "Excellent (%)"],
        rows: ratingReview.reviewSummaryByCategory.bars.map((r) => [
          r.category,
          r.totalReviews,
          formatPct(r.badPct),
          formatPct(r.goodPct),
          formatPct(r.excellentPct),
        ]),
      },
      ...Object.entries(ratingReview.reviewsByCategory).map(([category, reviews]) => ({
        title: `${category} Reviews`,
        headers: ["Reviewer", "When", "Rating", "Review", "Tags", "Reply Author", "Reply"],
        rows: reviews.map((r) => [
          r.reviewerName,
          r.relativeTimeLabel,
          r.rating,
          r.reviewText,
          r.tags.map((t) => t.label).join(", "),
          r.reply?.authorName ?? "",
          r.reply?.message ?? "",
        ]),
      })),
    ]),
    sanitizeSheetName("Rating and Review"),
  );
}

export function exportProfessionalAnalyticsToExcel({
  data,
  scope,
  fromDate,
  toDate,
}: {
  data: ProfessionalFixedLocationAnalyticsData;
  scope: ProfessionalAnalyticsExportSelection;
  fromDate: string;
  toDate: string;
}): boolean {
  const workbook = XLSX.utils.book_new();

  if (shouldInclude(scope, "Booking and Operational Analytics")) {
    appendBookingSheet(workbook, data);
  }
  if (shouldInclude(scope, "Sales Volume Analytics")) {
    appendSalesVolumeSheet(workbook, data);
  }
  if (shouldInclude(scope, "Performance Analytics")) {
    appendPerformanceSheet(workbook, data);
  }
  if (shouldInclude(scope, "Rating and Review Analytics")) {
    appendRatingReviewSheet(workbook, data);
  }

  const dateSlug = fromDate && toDate ? `_${fromDate}_to_${toDate}` : "";
  const stamp = new Date().toISOString().slice(0, 10);

  XLSX.writeFile(workbook, `professional-analytics_${scopeSlug(scope)}${dateSlug}_${stamp}.xlsx`);
  return true;
}
