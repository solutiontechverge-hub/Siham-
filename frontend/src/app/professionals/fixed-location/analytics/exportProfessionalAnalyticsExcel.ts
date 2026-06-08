import * as XLSX from "xlsx";
import type { ProfessionalAnalyticsSubTab, ProfessionalFixedLocationAnalyticsData } from "./analytics.data";

export type ProfessionalAnalyticsExportScope = "all" | ProfessionalAnalyticsSubTab;

export type AnalyticsExportDateValidation =
  | { ok: true }
  | { ok: false; message: string };

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

function buildTableSheet(title: string, headers: readonly string[], rows: readonly (readonly string[])[]): XLSX.WorkSheet {
  const sheetData: (string | number)[][] = [[title], [], [...headers], ...rows.map((row) => [...row])];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const columnWidths = headers.map((header, index) => {
    const maxLen = sheetData.reduce((max, row) => {
      const cell = String(row[index + 2] ?? row[0] ?? "");
      return Math.max(max, cell.length);
    }, header.length);
    return { wch: Math.min(Math.max(maxLen + 2, 12), 42) };
  });
  worksheet["!cols"] = columnWidths;
  return worksheet;
}

function scopeLabel(scope: ProfessionalAnalyticsExportScope): string {
  return scope === "all" ? "All" : scope;
}

function shouldInclude(scope: ProfessionalAnalyticsExportScope, tab: ProfessionalAnalyticsSubTab): boolean {
  return scope === "all" || scope === tab;
}

function buildFiltersSheet(
  data: ProfessionalFixedLocationAnalyticsData,
  scope: ProfessionalAnalyticsExportScope,
  fromDate: string,
  toDate: string,
): XLSX.WorkSheet {
  const rangeLabel = fromDate && toDate ? `${fromDate} → ${toDate}` : "All time";
  const sheetData: string[][] = [
    [data.header.title],
    [data.header.subtitle],
    [],
    ["Date From", fromDate || "—"],
    ["Date To", toDate || "—"],
    ["Date range applied", rangeLabel],
    ["Export scope", scopeLabel(scope)],
    ["Generated at", new Date().toISOString()],
  ];
  return XLSX.utils.aoa_to_sheet(sheetData);
}

function appendBookingSheets(workbook: XLSX.WorkBook, data: ProfessionalFixedLocationAnalyticsData) {
  const { sections } = data;

  XLSX.utils.book_append_sheet(
    workbook,
    buildTableSheet(
      sections.bookingOriginAndType.title,
      ["Origin", "FL Count", "DL Count", "Project Count", "Total", "Share (%)"],
      sections.bookingOriginAndType.rows.map((r) => [
        r.origin,
        String(r.flCount),
        String(r.dlCount),
        String(r.projectCount),
        String(r.total),
        `${r.sharePct}%`,
      ]),
    ),
    sanitizeSheetName(sections.bookingOriginAndType.title),
  );

  XLSX.utils.book_append_sheet(
    workbook,
    buildTableSheet(
      sections.bookingStatusSummary.title,
      ["Status", "Count", "Share (%)"],
      sections.bookingStatusSummary.rows.map((r) => [r.status, String(r.count), formatPct(r.sharePct)]),
    ),
    sanitizeSheetName(sections.bookingStatusSummary.title),
  );

  XLSX.utils.book_append_sheet(
    workbook,
    buildTableSheet(
      sections.attendanceNoShowAnalytics.title,
      ["Booking Type", "No-Show Count", "Share (%)"],
      sections.attendanceNoShowAnalytics.rows.map((r) => [r.bookingType, String(r.noShowCount), formatPct(r.sharePct)]),
    ),
    sanitizeSheetName(sections.attendanceNoShowAnalytics.title),
  );

  XLSX.utils.book_append_sheet(
    workbook,
    buildTableSheet(
      sections.reschedulingSummary.title,
      ["Category", "Count"],
      sections.reschedulingSummary.rows.map((r) => [r.category, String(r.count)]),
    ),
    sanitizeSheetName(sections.reschedulingSummary.title),
  );

  XLSX.utils.book_append_sheet(
    workbook,
    buildTableSheet(
      sections.bookingByClientType.title,
      ["Client Type", "Count", "Share (%)"],
      sections.bookingByClientType.rows.map((r) => [r.clientType, String(r.count), formatPct(r.sharePct)]),
    ),
    sanitizeSheetName(sections.bookingByClientType.title),
  );

  XLSX.utils.book_append_sheet(
    workbook,
    buildTableSheet(
      sections.bookingByServiceCategory.title,
      ["Category", "Count", "Share (%)"],
      sections.bookingByServiceCategory.rows.map((r) => [r.category, String(r.count), formatPct(r.sharePct)]),
    ),
    sanitizeSheetName(sections.bookingByServiceCategory.title),
  );
}

function appendSalesVolumeSheets(workbook: XLSX.WorkBook, data: ProfessionalFixedLocationAnalyticsData) {
  const sv = data.salesVolume;

  XLSX.utils.book_append_sheet(
    workbook,
    buildTableSheet(
      sv.salesByCategoriesAndServices.title,
      ["Category", "Service", "Count", "Net Sales (€)", "Share (%)"],
      sv.salesByCategoriesAndServices.rows.map((r) => [
        r.hideCategoryCell ? "" : r.category,
        r.service,
        String(r.count),
        formatAmountEur(r.netSalesEur),
        formatPct(r.sharePct),
      ]),
    ),
    sanitizeSheetName(sv.salesByCategoriesAndServices.title),
  );

  XLSX.utils.book_append_sheet(
    workbook,
    buildTableSheet(
      sv.refundsAndAdjustments.title,
      ["Adjustment Type", "Amount (€)", "Share of Gross Sales"],
      sv.refundsAndAdjustments.rows.map((r) => [
        r.adjustmentType,
        formatAmountEur(r.amountEur),
        formatPct(r.shareOfGrossSalesPct),
      ]),
    ),
    sanitizeSheetName(sv.refundsAndAdjustments.title),
  );

  XLSX.utils.book_append_sheet(
    workbook,
    buildTableSheet(
      sv.unpaidInvoicesAndFeeCompliance.title,
      ["Invoice Status", "Count", "Value (€)"],
      sv.unpaidInvoicesAndFeeCompliance.rows.map((r) => [
        r.invoiceStatus,
        String(r.count),
        formatAmountEur(r.valueEur),
      ]),
    ),
    sanitizeSheetName(sv.unpaidInvoicesAndFeeCompliance.title),
  );

  XLSX.utils.book_append_sheet(
    workbook,
    buildTableSheet(
      sv.netSalesOverview.title,
      ["Metric", "Amount (€)"],
      sv.netSalesOverview.rows.map((r) => [r.metric, formatAmountEur(r.amountEur)]),
    ),
    sanitizeSheetName(sv.netSalesOverview.title),
  );

  XLSX.utils.book_append_sheet(
    workbook,
    buildTableSheet(
      sv.salesByBookingOrigin.title,
      ["Booking Origin", "Count", "Sales (€)", "Share (%)"],
      sv.salesByBookingOrigin.rows.map((r) => [
        r.bookingOrigin,
        String(r.count),
        formatAmountEur(r.salesEur),
        formatPct(r.sharePct),
      ]),
    ),
    sanitizeSheetName(sv.salesByBookingOrigin.title),
  );
}

function appendPerformanceSheets(workbook: XLSX.WorkBook, data: ProfessionalFixedLocationAnalyticsData) {
  const perf = data.performance.productivityAndEfficiency;

  XLSX.utils.book_append_sheet(
    workbook,
    buildTableSheet(
      perf.title,
      [
        "Team Member",
        "Hours Worked",
        "Completed Bookings",
        "Revenue (€)",
        "Productivity (€/hr)",
        "Efficiency (%)",
        "Average Rating",
        "Reviews",
      ],
      perf.rows.map((r) => [
        r.teamMember,
        String(r.hoursWorked),
        String(r.completedBookings),
        formatAmountEur(r.revenueEur),
        formatAmountEur(r.productivityEurPerHr),
        formatPct(r.efficiencyPct),
        String(r.averageRating),
        String(r.reviews),
      ]),
    ),
    sanitizeSheetName(perf.title),
  );
}

function appendRatingReviewSheets(workbook: XLSX.WorkBook, data: ProfessionalFixedLocationAnalyticsData) {
  const { ratingReview } = data;

  XLSX.utils.book_append_sheet(
    workbook,
    buildTableSheet(
      ratingReview.reviewManagementOverview.title,
      ["Overall Rating", "Rating Out Of", "Total Reviews"],
      [[
        String(ratingReview.reviewManagementOverview.overallRating),
        String(ratingReview.reviewManagementOverview.ratingOutOf),
        String(ratingReview.reviewManagementOverview.totalReviews),
      ]],
    ),
    sanitizeSheetName(ratingReview.reviewManagementOverview.title),
  );

  XLSX.utils.book_append_sheet(
    workbook,
    buildTableSheet(
      ratingReview.ratingReviewAnalytics.title,
      ["Category", "Range", "Count", "Share (%)", "Replied To"],
      ratingReview.ratingReviewAnalytics.rows.map((r) => [
        r.category,
        r.range,
        String(r.count),
        formatPct(r.sharePct),
        String(r.repliedTo),
      ]),
    ),
    sanitizeSheetName(ratingReview.ratingReviewAnalytics.title),
  );

  XLSX.utils.book_append_sheet(
    workbook,
    buildTableSheet(
      ratingReview.ratingDistributionByCategory.title,
      ["Category", "Bad (%)", "Good (%)", "Excellent (%)", "Total Reviews"],
      ratingReview.ratingDistributionByCategory.rows.map((r) => [
        r.category,
        formatPct(r.badPct),
        formatPct(r.goodPct),
        formatPct(r.excellentPct),
        String(r.totalReviews),
      ]),
    ),
    sanitizeSheetName(ratingReview.ratingDistributionByCategory.title),
  );

  XLSX.utils.book_append_sheet(
    workbook,
    buildTableSheet(
      ratingReview.reviewSummaryByCategory.title,
      ["Category", "Total Reviews", "Bad (%)", "Good (%)", "Excellent (%)"],
      ratingReview.reviewSummaryByCategory.bars.map((r) => [
        r.category,
        String(r.totalReviews),
        formatPct(r.badPct),
        formatPct(r.goodPct),
        formatPct(r.excellentPct),
      ]),
    ),
    sanitizeSheetName(ratingReview.reviewSummaryByCategory.title),
  );

  for (const [category, reviews] of Object.entries(ratingReview.reviewsByCategory)) {
    XLSX.utils.book_append_sheet(
      workbook,
      buildTableSheet(
        `${category} Reviews`,
        ["Reviewer", "When", "Rating", "Review", "Tags", "Reply Author", "Reply"],
        reviews.map((r) => [
          r.reviewerName,
          r.relativeTimeLabel,
          String(r.rating),
          r.reviewText,
          r.tags.map((t) => t.label).join(", "),
          r.reply?.authorName ?? "",
          r.reply?.message ?? "",
        ]),
      ),
      sanitizeSheetName(`${category} Reviews`),
    );
  }
}

export function exportProfessionalAnalyticsToExcel({
  data,
  scope,
  fromDate,
  toDate,
}: {
  data: ProfessionalFixedLocationAnalyticsData;
  scope: ProfessionalAnalyticsExportScope;
  fromDate: string;
  toDate: string;
}): boolean {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, buildFiltersSheet(data, scope, fromDate, toDate), "Filters");

  if (shouldInclude(scope, "Booking and Operational Analytics")) {
    appendBookingSheets(workbook, data);
  }
  if (shouldInclude(scope, "Sales Volume Analytics")) {
    appendSalesVolumeSheets(workbook, data);
  }
  if (shouldInclude(scope, "Performance Analytics")) {
    appendPerformanceSheets(workbook, data);
  }
  if (shouldInclude(scope, "Rating and Review Analytics")) {
    appendRatingReviewSheets(workbook, data);
  }

  const scopeSlug = scope === "all" ? "all" : scope.replaceAll(" ", "-").toLowerCase();
  const dateSlug = fromDate && toDate ? `_${fromDate}_to_${toDate}` : "";
  const stamp = new Date().toISOString().slice(0, 10);

  XLSX.writeFile(workbook, `professional-analytics_${scopeSlug}${dateSlug}_${stamp}.xlsx`);
  return true;
}
