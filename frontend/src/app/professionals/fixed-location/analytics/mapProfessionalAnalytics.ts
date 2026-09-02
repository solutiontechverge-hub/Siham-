import type { CalendarBooking, BusinessSetup } from "../../../../store/services/businessApi";
import type { ReviewItem, ReviewStats } from "../../../../store/services/reviewsApi";
import type { TransactionRow } from "../finance/data/transactions";
import {
  professionalFixedLocationAnalyticsData,
  type AttendanceNoShowRow,
  type BookingOriginRow,
  type BookingStatusSummaryRow,
  type ProfessionalFixedLocationAnalyticsData,
  type TransactionSummaryRow,
} from "./analytics.data";
import type { ProfessionalFixedLocationSalesVolumeAnalyticsData } from "./salesVolumeAnalytics.data";
import type { ProfessionalFixedLocationPerformanceAnalyticsData } from "./performanceAnalytics.data";
import type {
  ProfessionalFixedLocationRatingReviewAnalyticsData,
  ProfessionalReviewItem,
} from "./ratingReviewAnalytics.data";

function parseMoney(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function normalizeStatus(status: string): string {
  const s = String(status || "").toLowerCase().replace(/_/g, " ");
  if (s.includes("no show") || s === "noshow") return "No Show";
  if (s.includes("cancel")) return "Cancelled";
  if (s.includes("complete")) return "Completed";
  if (s.includes("confirm")) return "Confirmed";
  if (s.includes("progress")) return "In Progress";
  if (s.includes("request")) return "Requested";
  if (s.includes("invalid")) return "Invalid";
  return status || "Other";
}

function isOnlineOrigin(booking: CalendarBooking): boolean {
  const type = String(booking.booking_type || "online").toLowerCase();
  return type === "online" || type === "request" || type === "project";
}

function locationBucket(booking: CalendarBooking): "fl" | "dl" | "project" {
  if (String(booking.booking_type || "").toLowerCase() === "project") return "project";
  if (booking.location_type === "desired") return "dl";
  return "fl";
}

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.max(0, Math.round((Date.now() - then) / 86400000));
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

function mapReviewItem(item: ReviewItem): ProfessionalReviewItem {
  return {
    id: item.id,
    reviewerName: item.reviewerDisplayName || "Client",
    relativeTimeLabel: relativeTime(item.submittedAt),
    rating: item.rating ?? 0,
    reviewText: item.body || "",
    tags: item.serviceName ? [{ label: item.serviceName }] : [],
    memberId: item.teamMemberId ?? undefined,
    memberName: item.teamMemberName ?? undefined,
    reply: item.reply
      ? { authorName: item.reply.authorName, message: item.reply.message }
      : undefined,
  };
}

function buildBookingSections(bookings: CalendarBooking[]) {
  const online = { fl: 0, dl: 0, project: 0 };
  const offline = { fl: 0, dl: 0, project: 0 };
  const statusCounts = new Map<string, number>();
  const noShow = { Online: 0, Offline: 0 };

  for (const booking of bookings) {
    const origin = isOnlineOrigin(booking) ? online : offline;
    const bucket = locationBucket(booking);
    origin[bucket] += 1;

    const status = normalizeStatus(booking.status);
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);

    if (status === "No Show") {
      if (isOnlineOrigin(booking)) noShow.Online += 1;
      else noShow.Offline += 1;
    }
  }

  const onlineTotal = online.fl + online.dl + online.project;
  const offlineTotal = offline.fl + offline.dl + offline.project;
  const grand = onlineTotal + offlineTotal || 1;

  const originRows: BookingOriginRow[] = [
    {
      origin: "Online",
      flCount: online.fl,
      dlCount: online.dl,
      projectCount: online.project,
      total: onlineTotal,
      sharePct: pct(onlineTotal, grand),
    },
    {
      origin: "Offline",
      flCount: offline.fl,
      dlCount: offline.dl,
      projectCount: offline.project,
      total: offlineTotal,
      sharePct: pct(offlineTotal, grand),
    },
    {
      origin: "Total",
      flCount: online.fl + offline.fl,
      dlCount: online.dl + offline.dl,
      projectCount: online.project + offline.project,
      total: onlineTotal + offlineTotal,
      sharePct: 100,
      isTotal: true,
    },
  ];

  const statusEntries = [...statusCounts.entries()];
  const statusTotal = statusEntries.reduce((sum, [, count]) => sum + count, 0) || 1;
  const statusRows: BookingStatusSummaryRow[] = [
    ...statusEntries.map(([status, count]) => ({
      status,
      count,
      sharePct: pct(count, statusTotal),
    })),
    {
      status: "Total",
      count: statusEntries.reduce((sum, [, count]) => sum + count, 0),
      sharePct: 100,
      isTotal: true,
    },
  ];

  const noShowTotal = noShow.Online + noShow.Offline || 1;
  const noShowRows: AttendanceNoShowRow[] = [
    {
      bookingType: "Online",
      noShowCount: noShow.Online,
      sharePct: pct(noShow.Online, noShowTotal),
    },
    {
      bookingType: "Offline",
      noShowCount: noShow.Offline,
      sharePct: pct(noShow.Offline, noShowTotal),
    },
    {
      bookingType: "Total",
      noShowCount: noShow.Online + noShow.Offline,
      sharePct: 100,
      isTotal: true,
    },
  ];

  return { originRows, statusRows, noShowRows };
}

function buildTransactionSummary(transactions: TransactionRow[]): TransactionSummaryRow[] {
  let online = 0;
  let offline = 0;
  for (const row of transactions) {
    if (row.entryType === "onlineBooking") online += 1;
    else offline += 1;
  }
  const total = online + offline || 1;
  return [
    { channel: "Online", count: online, sharePct: pct(online, total) },
    { channel: "Offline / Manual", count: offline, sharePct: pct(offline, total) },
    { channel: "Total", count: online + offline, sharePct: 100, isTotal: true },
  ];
}

function buildSalesVolume(
  transactions: TransactionRow[],
  template: ProfessionalFixedLocationSalesVolumeAnalyticsData,
): ProfessionalFixedLocationSalesVolumeAnalyticsData {
  const productMap = new Map<string, { count: number; sales: number }>();
  const categoryMap = new Map<string, Map<string, { count: number; sales: number }>>();
  let onlineCount = 0;
  let offlineCount = 0;
  let onlineSales = 0;
  let offlineSales = 0;
  let refunds = 0;
  let unpaidCount = 0;
  let unpaidValue = 0;
  let gross = 0;

  for (const row of transactions) {
    const amount = parseMoney(row.netAmount);
    const status = String(row.status || "").toLowerCase();
    if (status.includes("refund")) {
      refunds += Math.abs(amount);
      continue;
    }
    if (status.includes("unpaid") || status.includes("pending") || status.includes("overdue")) {
      unpaidCount += 1;
      unpaidValue += amount;
    }
    if (status.includes("void") || status.includes("cancel")) continue;

    gross += amount;
    if (row.entryType === "onlineBooking") {
      onlineCount += 1;
      onlineSales += amount;
    } else {
      offlineCount += 1;
      offlineSales += amount;
    }

    const lines = row.document?.lineItems ?? [];
    if (!lines.length) {
      const key = row.entryLabel || "Sale";
      const prev = productMap.get(key) || { count: 0, sales: 0 };
      productMap.set(key, { count: prev.count + 1, sales: prev.sales + amount });
      continue;
    }

    for (const line of lines) {
      const name = line.description || "Item";
      const qty = Number(line.quantity) || 1;
      const lineSales = parseMoney(line.totalPrice ?? line.pricePerUnit) || amount;
      const prev = productMap.get(name) || { count: 0, sales: 0 };
      productMap.set(name, {
        count: prev.count + qty,
        sales: prev.sales + lineSales,
      });

      const category = "Services";
      if (!categoryMap.has(category)) categoryMap.set(category, new Map());
      const serviceMap = categoryMap.get(category)!;
      const servicePrev = serviceMap.get(name) || { count: 0, sales: 0 };
      serviceMap.set(name, {
        count: servicePrev.count + qty,
        sales: servicePrev.sales + lineSales,
      });
    }
  }

  const productTotalSales = [...productMap.values()].reduce((sum, item) => sum + item.sales, 0);
  const productDenom = productTotalSales || 1;
  const productRows = [
    ...[...productMap.entries()].map(([product, stats]) => ({
      product,
      count: stats.count,
      salesEur: Math.round(stats.sales * 100) / 100,
      sharePct: pct(stats.sales, productDenom),
    })),
    {
      product: "Total",
      count: [...productMap.values()].reduce((sum, item) => sum + item.count, 0),
      salesEur: Math.round(productTotalSales * 100) / 100,
      sharePct: 100,
      isTotal: true,
    },
  ];

  const categoryRows: Array<{
    category: string;
    service: string;
    count: number;
    netSalesEur: number;
    sharePct: number;
    hideCategoryCell?: boolean;
    isCategoryTotal?: boolean;
    isGrandTotal?: boolean;
  }> = [];
  let categoryGrand = 0;
  for (const [category, services] of categoryMap.entries()) {
    const entries = [...services.entries()];
    const catTotal = entries.reduce((sum, [, s]) => sum + s.sales, 0);
    categoryGrand += catTotal;
    entries.forEach(([service, stats], index) => {
      categoryRows.push({
        category,
        service,
        count: stats.count,
        netSalesEur: Math.round(stats.sales * 100) / 100,
        sharePct: pct(stats.sales, catTotal || 1),
        hideCategoryCell: index > 0,
      });
    });
    categoryRows.push({
      category,
      service: "Category total",
      count: entries.reduce((sum, [, s]) => sum + s.count, 0),
      netSalesEur: Math.round(catTotal * 100) / 100,
      sharePct: 100,
      isCategoryTotal: true,
    });
  }
  if (categoryRows.length) {
    categoryRows.push({
      category: "Grand total",
      service: "",
      count: categoryRows
        .filter((row) => row.isCategoryTotal)
        .reduce((sum, row) => sum + row.count, 0),
      netSalesEur: Math.round(categoryGrand * 100) / 100,
      sharePct: 100,
      isGrandTotal: true,
    });
  }

  const salesOriginTotal = onlineSales + offlineSales || 1;

  const categoryBars = [...categoryMap.entries()].map(([category, services]) => {
    const segments = [...services.entries()].map(([service, stats]) => ({
      service,
      salesEur: Math.round(stats.sales * 100) / 100,
      shareWithinBarPct: pct(stats.sales, categoryGrand || 1),
    }));
    const totalSalesEur = segments.reduce((sum, segment) => sum + segment.salesEur, 0);
    return {
      category,
      segments,
      totalSalesEur,
      totalSharePct: pct(totalSalesEur, categoryGrand || 1),
    };
  });


  return {
    ...template,
    productSales: {
      ...template.productSales,
      rows: productRows,
      chartMaxEur: Math.max(...productRows.map((row) => row.salesEur), 1),
    },
    salesByCategoriesAndServices: {
      ...template.salesByCategoriesAndServices,
      rows: categoryRows,
      categoryBars,
      chartMaxEur: Math.max(...categoryBars.map((bar) => bar.totalSalesEur), 1),
    },
    refundsAndAdjustments: {
      ...template.refundsAndAdjustments,
      rows: [
        {
          adjustmentType: "Refunds",
          amountEur: Math.round(refunds * 100) / 100,
          shareOfGrossSalesPct: pct(refunds, gross || 1),
        },
      ],
    },
    unpaidInvoicesAndFeeCompliance: {
      ...template.unpaidInvoicesAndFeeCompliance,
      rows: [
        {
          invoiceStatus: "Unpaid / Pending",
          count: unpaidCount,
          valueEur: Math.round(unpaidValue * 100) / 100,
        },
      ],
    },
    netSalesOverview: {
      ...template.netSalesOverview,
      rows: [
        { metric: "Gross sales", amountEur: Math.round(gross * 100) / 100 },
        { metric: "Refunds", amountEur: Math.round(refunds * 100) / 100 },
        {
          metric: "Net sales",
          amountEur: Math.round((gross - refunds) * 100) / 100,
        },
      ],
    },
    salesByBookingOrigin: {
      ...template.salesByBookingOrigin,
      rows: [
        {
          bookingOrigin: "Online",
          count: onlineCount,
          salesEur: Math.round(onlineSales * 100) / 100,
          sharePct: pct(onlineSales, salesOriginTotal),
        },
        {
          bookingOrigin: "Offline / Manual",
          count: offlineCount,
          salesEur: Math.round(offlineSales * 100) / 100,
          sharePct: pct(offlineSales, salesOriginTotal),
        },
        {
          bookingOrigin: "Total",
          count: onlineCount + offlineCount,
          salesEur: Math.round((onlineSales + offlineSales) * 100) / 100,
          sharePct: 100,
          isTotal: true,
        },
      ],
    },
  };
}

function buildPerformance(
  bookings: CalendarBooking[],
  setup: BusinessSetup | null,
  reviews: ReviewItem[],
  template: ProfessionalFixedLocationPerformanceAnalyticsData,
): ProfessionalFixedLocationPerformanceAnalyticsData {
  const members = setup?.team_members ?? [];
  const rows = members.map((member) => {
    const memberBookings = bookings.filter(
      (booking) =>
        String(booking.team_member_id || "") === String(member.id) &&
        normalizeStatus(booking.status) === "Completed",
    );
    const revenue = memberBookings.reduce(
      (sum, booking) => sum + parseMoney(booking.total_price),
      0,
    );
    const memberReviews = reviews.filter(
      (review) => String(review.teamMemberId || "") === String(member.id),
    );
    const avgRating =
      memberReviews.length > 0
        ? memberReviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
          memberReviews.length
        : Number(member.rating) || 0;
    const hoursWorked = Math.max(1, memberBookings.length * 1.5);

    return {
      teamMember: member.full_name || "Team member",
      hoursWorked: Math.round(hoursWorked * 10) / 10,
      completedBookings: memberBookings.length,
      revenueEur: Math.round(revenue * 100) / 100,
      productivityEurPerHr: Math.round((revenue / hoursWorked) * 10) / 10,
      efficiencyPct: memberBookings.length
        ? Math.min(100, Math.round((memberBookings.length / Math.max(memberBookings.length, 1)) * 100))
        : 0,
      averageRating: Math.round(avgRating * 10) / 10,
      reviews: memberReviews.length || Number(member.total_reviews) || 0,
    };
  });

  if (rows.length) {
    const avg = {
      teamMember: "Team Average",
      hoursWorked:
        Math.round(
          (rows.reduce((sum, row) => sum + row.hoursWorked, 0) / rows.length) * 10,
        ) / 10,
      completedBookings: Math.round(
        rows.reduce((sum, row) => sum + row.completedBookings, 0) / rows.length,
      ),
      revenueEur:
        Math.round(
          (rows.reduce((sum, row) => sum + row.revenueEur, 0) / rows.length) * 100,
        ) / 100,
      productivityEurPerHr:
        Math.round(
          (rows.reduce((sum, row) => sum + row.productivityEurPerHr, 0) /
            rows.length) *
            10,
        ) / 10,
      efficiencyPct: Math.round(
        rows.reduce((sum, row) => sum + row.efficiencyPct, 0) / rows.length,
      ),
      averageRating:
        Math.round(
          (rows.reduce((sum, row) => sum + row.averageRating, 0) / rows.length) *
            10,
        ) / 10,
      reviews: Math.round(
        rows.reduce((sum, row) => sum + row.reviews, 0) / rows.length,
      ),
      isAverage: true as const,
    };
    rows.push(avg);
  }

  return {
    productivityAndEfficiency: {
      ...template.productivityAndEfficiency,
      rows,
    },
  };
}

function buildRatingReview(
  reviews: ReviewItem[],
  stats: ReviewStats | null,
  template: ProfessionalFixedLocationRatingReviewAnalyticsData,
): ProfessionalFixedLocationRatingReviewAnalyticsData {
  const mapped = reviews.map(mapReviewItem);
  const bad = mapped.filter((item) => item.rating <= 2);
  const good = mapped.filter((item) => item.rating === 3 || item.rating === 4);
  const excellent = mapped.filter((item) => item.rating >= 5);
  const total = mapped.length || 1;

  const categoryRows = [
    {
      category: "Bad",
      range: "1–2★",
      count: bad.length,
      sharePct: pct(bad.length, total),
      repliedTo: bad.filter((item) => Boolean(item.reply)).length,
    },
    {
      category: "Good",
      range: "3–4★",
      count: good.length,
      sharePct: pct(good.length, total),
      repliedTo: good.filter((item) => Boolean(item.reply)).length,
    },
    {
      category: "Excellent",
      range: "5★",
      count: excellent.length,
      sharePct: pct(excellent.length, total),
      repliedTo: excellent.filter((item) => Boolean(item.reply)).length,
    },
    {
      category: "Total",
      range: "",
      count: mapped.length,
      sharePct: 100,
      repliedTo: mapped.filter((item) => Boolean(item.reply)).length,
      isTotal: true,
    },
  ];

  return {
    ...template,
    reviewManagementOverview: {
      ...template.reviewManagementOverview,
      overallRating: stats?.average ?? 0,
      totalReviews: stats?.total ?? mapped.length,
    },
    ratingReviewAnalytics: {
      ...template.ratingReviewAnalytics,
      rows: categoryRows,
    },
    ratingDistributionByCategory: {
      ...template.ratingDistributionByCategory,
      rows: [
        {
          category: "All reviews",
          badPct: pct(bad.length, total),
          goodPct: pct(good.length, total),
          excellentPct: pct(excellent.length, total),
          totalReviews: mapped.length,
          isTotal: true,
        },
      ],
    },
    reviewSummaryByCategory: {
      ...template.reviewSummaryByCategory,
      bars: [
        {
          category: "All",
          totalReviews: mapped.length,
          badPct: pct(bad.length, total),
          goodPct: pct(good.length, total),
          excellentPct: pct(excellent.length, total),
        },
      ],
      maxReviews: Math.max(mapped.length, 1),
    },
    reviewsByCategory: {
      Bad: bad,
      Good: good,
      Excellent: excellent,
      "Total Review": mapped,
    },
  };
}

export function mapProfessionalAnalytics(input: {
  bookings: CalendarBooking[];
  transactions: TransactionRow[];
  reviews: ReviewItem[];
  stats: ReviewStats | null;
  setup: BusinessSetup | null;
}): ProfessionalFixedLocationAnalyticsData {
  const template = professionalFixedLocationAnalyticsData;
  const { originRows, statusRows, noShowRows } = buildBookingSections(input.bookings);
  const transactionRows = buildTransactionSummary(input.transactions);

  return {
    ...template,
    sections: {
      bookingOriginAndType: {
        ...template.sections.bookingOriginAndType,
        rows: originRows,
      },
      bookingStatusSummary: {
        ...template.sections.bookingStatusSummary,
        rows: statusRows,
      },
      attendanceNoShowAnalytics: {
        ...template.sections.attendanceNoShowAnalytics,
        rows: noShowRows,
      },
      transactionSummary: {
        ...template.sections.transactionSummary,
        rows: transactionRows,
      },
    },
    salesVolume: buildSalesVolume(input.transactions, template.salesVolume),
    performance: buildPerformance(
      input.bookings,
      input.setup,
      input.reviews,
      template.performance,
    ),
    ratingReview: buildRatingReview(input.reviews, input.stats, template.ratingReview),
  };
}
