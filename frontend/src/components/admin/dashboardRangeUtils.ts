import type { AdminTimeRange } from "./AdminTimeRangeFilter";
import { dashboardKpisByRange, dashboardTrendData } from "./adminMockData";
import { dashboardBookingsTrend, dashboardKpiMetrics } from "./dashboardData";

export type AdminDashboardRangeValue = {
  preset: AdminTimeRange;
  customStart: string;
  customEnd: string;
};

export const RANGE_OPTIONS: { value: AdminTimeRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

export function isoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function defaultDashboardRange(): AdminDashboardRangeValue {
  return {
    preset: "7d",
    customStart: isoDaysAgo(13),
    customEnd: isoToday(),
  };
}

export function getRangeLabel(range: AdminDashboardRangeValue): string {
  if (range.preset !== "custom") {
    return RANGE_OPTIONS.find((o) => o.value === range.preset)?.label ?? "Last 7 Days";
  }
  if (range.customStart && range.customEnd) {
    return `${formatShortDate(range.customStart)} – ${formatShortDate(range.customEnd)}`;
  }
  return "Custom Range";
}

export function getTrendLabel(preset: AdminTimeRange): string {
  switch (preset) {
    case "today":
      return "vs yesterday";
    case "7d":
      return "vs last 7 days";
    case "30d":
      return "vs last 30 days";
    case "year":
      return "vs last year";
    default:
      return "vs prior period";
  }
}

function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
}

const TRENDS_BY_RANGE: Record<AdminTimeRange, number[]> = {
  today: [4.2, 5.1, 3.8, 2.9, 6.5, 4.8],
  "7d": [18.7, 23.9, 20.4, 15.2, 21.3, 12.6],
  "30d": [14.2, 19.5, 17.1, 11.8, 16.4, 9.3],
  year: [22.4, 28.1, 24.6, 18.9, 26.2, 15.7],
  custom: [12.0, 16.5, 14.2, 10.1, 14.8, 8.6],
};

export function getDashboardKpiMetrics(range: AdminDashboardRangeValue) {
  const key = range.preset === "custom" ? "custom" : range.preset;
  const raw = dashboardKpisByRange[key];

  if (range.preset === "custom" && range.customStart && range.customEnd) {
    const days = daysBetween(range.customStart, range.customEnd);
    const scale = days / 30;
    return dashboardKpiMetrics.map((kpi, i) => ({
      ...kpi,
      value: Math.round(kpi.value * scale * 0.85),
      trend: TRENDS_BY_RANGE.custom[i] ?? kpi.trend,
    }));
  }

  const trends = TRENDS_BY_RANGE[key];
  return [
    { label: "New Professionals", value: raw.newProfessionals, trend: trends[0], icon: "business" as const },
    { label: "New Clients", value: raw.newClients, trend: trends[1], icon: "people" as const },
    { label: "New Individual Clients (IC)", value: raw.newIC, trend: trends[2], icon: "person" as const },
    { label: "New Company Clients (BC)", value: raw.newCC, trend: trends[3], icon: "company" as const },
    { label: "Total Online Bookings", value: raw.onlineBookings, trend: trends[4], icon: "online" as const },
    { label: "Total Offline Bookings", value: raw.offlineBookings, trend: trends[5], icon: "offline" as const },
  ];
}

export function getBookingsChartData(range: AdminDashboardRangeValue) {
  if (range.preset === "7d") return dashboardBookingsTrend;

  if (range.preset === "today") {
    const last = dashboardBookingsTrend[dashboardBookingsTrend.length - 1];
    return [{ date: "Today", online: last.online, offline: last.offline }];
  }

  if (range.preset === "30d") {
    return Array.from({ length: 4 }, (_, i) => ({
      date: `Week ${i + 1}`,
      online: 720 + i * 95,
      offline: 470 + i * 58,
    }));
  }

  if (range.preset === "year") {
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, i) => ({
      date: month,
      online: 520 + i * 48,
      offline: 340 + i * 28,
    }));
  }

  if (range.customStart && range.customEnd) {
    const days = Math.min(daysBetween(range.customStart, range.customEnd), 14);
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(range.customStart);
      d.setDate(d.getDate() + i);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const base = dashboardTrendData[i % dashboardTrendData.length];
      return {
        date: label,
        online: base.onlineBookings * 12,
        offline: base.offlineBookings * 12,
      };
    });
  }

  return dashboardBookingsTrend;
}

export function isDateInRange(iso: string, start: string, end: string): boolean {
  if (!start || !end) return iso === start || iso === end;
  const [a, b] = start <= end ? [start, end] : [end, start];
  return iso >= a && iso <= b;
}
