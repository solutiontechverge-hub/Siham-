import { alpha } from "@mui/material/styles";
import type {
  CalendarBookingLocation,
  CalendarBookingStatus,
  CalendarBookingType,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";

export type Interval = { startMin: number; endMin: number };

export type SelectedSlot = {
  resourceId: string;
  date: string;
  start: string;
  end: string;
  freeStart: string;
  freeEnd: string;
};

export type CalendarFilters = {
  teamAll: boolean;
  teamIds: Record<string, boolean>;
  locationAll: boolean;
  locations: Record<CalendarBookingLocation, boolean>;
  bookingAll: boolean;
  booking: Record<CalendarBookingType, boolean>;
};

export type BlockTimeDraft = {
  title: "Meeting" | "Training" | "Holiday" | "Custom";
  teamIds: string[];
  locations: CalendarBookingLocation[];
  dayFrom: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  dayTo: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  dateFrom: string;
  dateTo: string;
  startTime: string;
  endTime: string;
};

export function statusChipSx(status: CalendarBookingStatus, m: { navy: string }) {
  switch (status) {
    case "Requested":
      return { bgcolor: alpha("#F4A100", 0.12), color: "#C87800", borderColor: alpha("#F4A100", 0.5) };
    case "Cancelled":
      return { bgcolor: alpha("#D32F2F", 0.1), color: "#B71C1C", borderColor: alpha("#D32F2F", 0.4) };
    case "Confirmed":
      return { bgcolor: alpha("#2E7D32", 0.1), color: "#1B5E20", borderColor: alpha("#2E7D32", 0.4) };
    case "Completed":
      return { bgcolor: alpha(m.navy, 0.06), color: alpha(m.navy, 0.7), borderColor: alpha(m.navy, 0.2) };
    case "No Show":
    default:
      return { bgcolor: alpha(m.navy, 0.06), color: alpha(m.navy, 0.7), borderColor: alpha(m.navy, 0.2) };
  }
}

export function extractBookingId(rawId: string) {
  const parts = rawId.split("-");
  if (parts.length >= 3) return parts.slice(1, parts.length - 1).join("-");
  if (parts.length === 2) return parts[1];
  return rawId;
}

export function minutesSinceMidnight(hhmm: string) {
  const [h, m] = hhmm.split(":").map((v) => Number(v));
  return h * 60 + m;
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function fmtTimeLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function parseIsoDate(iso: string) {
  const [y, m, d] = iso.split("-").map((v) => Number(v));
  return new Date(Date.UTC(y, m - 1, d));
}

export function toIsoLocalDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatLongDateUtc(iso: string) {
  return parseIsoDate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatMdyDate(iso: string) {
  const dt = parseIsoDate(iso);
  return `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}/${dt.getUTCFullYear()}`;
}

export function toMonthIso(iso: string) {
  return `${iso.slice(0, 7)}-01`;
}

export function addMonthsIso(iso: string, months: number) {
  const dt = parseIsoDate(iso);
  dt.setUTCMonth(dt.getUTCMonth() + months, 1);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function formatMonthYearUtc(iso: string) {
  const safeIso = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : toMonthIso(toIsoLocalDate(new Date()));
  return parseIsoDate(safeIso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function addDaysIso(iso: string, days: number) {
  const dt = parseIsoDate(iso);
  dt.setUTCDate(dt.getUTCDate() + days);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfWeekIso(iso: string) {
  const dt = parseIsoDate(iso);
  const dow = dt.getUTCDay();
  return addDaysIso(iso, -((dow + 6) % 7));
}

export function mergeIntervals(intervals: readonly Interval[]) {
  const sorted = [...intervals].sort((a, b) => a.startMin - b.startMin);
  const out: Interval[] = [];
  for (const it of sorted) {
    const last = out[out.length - 1];
    if (!last || it.startMin > last.endMin) out.push({ ...it });
    else last.endMin = Math.max(last.endMin, it.endMin);
  }
  return out;
}

export function subtractIntervals(base: readonly Interval[], busy: readonly Interval[]) {
  const mergedBusy = mergeIntervals(busy);
  const out: Interval[] = [];
  for (const b of base) {
    let cursor = b.startMin;
    for (const u of mergedBusy) {
      if (u.endMin <= cursor) continue;
      if (u.startMin >= b.endMin) break;
      if (u.startMin > cursor) out.push({ startMin: cursor, endMin: Math.min(u.startMin, b.endMin) });
      cursor = Math.max(cursor, u.endMin);
      if (cursor >= b.endMin) break;
    }
    if (cursor < b.endMin) out.push({ startMin: cursor, endMin: b.endMin });
  }
  return out;
}

export function fmtMinToTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function sumIntervalsMins(intervals: readonly Interval[]) {
  return intervals.reduce((acc, it) => acc + Math.max(0, it.endMin - it.startMin), 0);
}
