import type {
  CalendarBlock,
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
  statusAll: boolean;
  statuses: Record<CalendarBookingStatus, boolean>;
};

export type BlockTimeDraft = {
  title: "Meeting" | "Training" | "Holiday" | "Custom";
  customTitle?: string;
  teamIds: string[];
  locations: CalendarBookingLocation[];
  dayFrom: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  dayTo: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  dateFrom: string;
  dateTo: string;
  startTime: string;
  endTime: string;
};

import { statusChipSx as bookingStatusChipSx } from "./bookingStatus";

export function statusChipSx(status: CalendarBookingStatus, _m?: { navy: string }) {
  return bookingStatusChipSx(status);
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

const ISO_DOW_TO_DAY_NAME = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type PublicBusinessHoursLike = {
  location?: string;
  day?: string;
  dateFrom?: string;
  dateTo?: string;
  startTime?: string;
  endTime?: string;
  notAvailable?: boolean;
  note?: string;
};

export type PublicBusinessHoursDayStatus =
  | { kind: "open"; interval: Interval; note?: string }
  | { kind: "notAvailable"; note?: string }
  | { kind: "none" };

/** Fallback when a not-available day has no custom note saved. */
export const DEFAULT_PUBLIC_HOURS_NOT_AVAILABLE_NOTE =
  "Shop will be remain close";

function rankPublicBusinessHoursCandidates(
  entries: readonly PublicBusinessHoursLike[],
  isoDate: string,
  location: string,
): PublicBusinessHoursLike[] {
  const dayName = ISO_DOW_TO_DAY_NAME[parseIsoDate(isoDate).getUTCDay()];
  const candidates = entries.filter((entry) => {
    if (entry.location !== location) return false;
    // Incomplete rows (no weekday + no dates) must not match every day.
    if (!entry.day && !entry.dateFrom && !entry.dateTo) return false;
    // Empty day = applies to every weekday within the date span.
    if (entry.day && entry.day !== dayName) return false;
    // Legacy entries without a range still apply by weekday.
    if (entry.dateFrom && isoDate < entry.dateFrom) return false;
    if (entry.dateTo && isoDate > entry.dateTo) return false;
    return true;
  });
  if (!candidates.length) return [];

  // Prefer exact single-date overrides (incl. off days) over broader ranges.
  return [...candidates].sort((a, b) => {
    const aExact =
      a.dateFrom &&
      a.dateFrom === (a.dateTo || a.dateFrom) &&
      a.dateFrom === isoDate
        ? 0
        : 1;
    const bExact =
      b.dateFrom &&
      b.dateFrom === (b.dateTo || b.dateFrom) &&
      b.dateFrom === isoDate
        ? 0
        : 1;
    if (aExact !== bExact) return aExact - bExact;
    const aOff = a.notAvailable ? 0 : 1;
    const bOff = b.notAvailable ? 0 : 1;
    return aOff - bOff;
  });
}

/** Resolve open / not-available / none for a date + FL/DL location. */
export function resolvePublicBusinessHoursDay(
  entries: readonly PublicBusinessHoursLike[] | undefined,
  isoDate: string,
  location: string,
): PublicBusinessHoursDayStatus {
  if (!entries?.length) return { kind: "none" };
  const ranked = rankPublicBusinessHoursCandidates(entries, isoDate, location);
  const match = ranked[0];
  if (!match) return { kind: "none" };
  if (match.notAvailable) {
    return { kind: "notAvailable", note: match.note };
  }
  if (!match.startTime || !match.endTime) return { kind: "none" };
  const openMin = minutesSinceMidnight(match.startTime);
  const closeMin = minutesSinceMidnight(match.endTime);
  if (
    !Number.isFinite(openMin) ||
    !Number.isFinite(closeMin) ||
    closeMin <= openMin
  ) {
    return { kind: "none" };
  }
  return {
    kind: "open",
    interval: { startMin: openMin, endMin: closeMin },
    note: match.note,
  };
}

export function isPublicBusinessHoursNotAvailable(
  entries: readonly PublicBusinessHoursLike[] | undefined,
  isoDate: string,
  location: string,
): boolean {
  return (
    resolvePublicBusinessHoursDay(entries, isoDate, location).kind ===
    "notAvailable"
  );
}

/** Note for a not-available day (per-professional), or null if the day is open. */
export function getPublicBusinessHoursNotAvailableNote(
  entries: readonly PublicBusinessHoursLike[] | undefined,
  isoDate: string,
  location: string,
): string | null {
  const status = resolvePublicBusinessHoursDay(entries, isoDate, location);
  if (status.kind !== "notAvailable") return null;
  return status.note?.trim() || DEFAULT_PUBLIC_HOURS_NOT_AVAILABLE_NOTE;
}

/** Resolve open/close window from public business hours for a date + FL/DL location. */
export function getPublicBusinessHoursInterval(
  entries: readonly PublicBusinessHoursLike[] | undefined,
  isoDate: string,
  location: string,
): Interval | null {
  const status = resolvePublicBusinessHoursDay(entries, isoDate, location);
  return status.kind === "open" ? status.interval : null;
}

export function intervalsOverlap(a: Interval, b: Interval) {
  return a.startMin < b.endMin && a.endMin > b.startMin;
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function fmtTimeLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export type TimelineGridLineKind = "hour" | "halfHour" | "quarter";

export type TimelineGridSlotColors = {
  hour: string;
  halfHour: string;
  normal: string;
};

export function getDefaultCalendarResourceId(
  rankedResources: readonly { id: string }[],
): string {
  return rankedResources[0]?.id ?? "";
}

/** Classify a minute-of-day mark for timeline grid styling. */
export function timelineGridLineKind(minutes: number): TimelineGridLineKind {
  const m = minutes % 60;
  if (m === 0) return "hour";
  if (m === 30) return "halfHour";
  return "quarter";
}

/** Background color for a 15-minute timeline slot row. */
export function timelineGridSlotBg(
  minutes: number,
  colors: TimelineGridSlotColors,
  options?: { blocked?: boolean; blockedBg?: string },
): string {
  if (options?.blocked && options.blockedBg) return options.blockedBg;
  const kind = timelineGridLineKind(minutes);
  if (kind === "hour") return colors.hour;
  if (kind === "halfHour") return colors.halfHour;
  return colors.normal;
}

/** Whether a slot row overlaps a blocked-time interval. */
export function slotOverlapsBlock(
  slotStartMin: number,
  slotStepMinutes: number,
  blocks: readonly { start: string; end: string }[],
): boolean {
  const slotEnd = slotStartMin + slotStepMinutes;
  return blocks.some((block) => {
    const blockStart = minutesSinceMidnight(block.start);
    const blockEnd = minutesSinceMidnight(block.end);
    return blockStart < slotEnd && blockEnd > slotStartMin;
  });
}

/** Map pointer Y within a timeline lane body to a clamped line position and minute. */
export function timelineHoverFromPointerY(
  yPx: number,
  {
    rowPx,
    startMin,
    endMin,
    stepMinutes,
  }: {
    rowPx: number;
    startMin: number;
    endMin: number;
    stepMinutes: number;
  },
): { topPx: number; timeMin: number } {
  const maxYPx = Math.max(0, ((endMin - startMin) / stepMinutes) * rowPx);
  const topPx = Math.max(0, Math.min(maxYPx, yPx));
  const rawMin = startMin + (topPx / rowPx) * stepMinutes;
  const timeMin = Math.max(startMin, Math.min(endMin, Math.round(rawMin)));
  return { topPx, timeMin };
}

export function parseIsoDate(iso: string) {
  const [y, m, d] = iso.split("-").map((v) => Number(v));
  return new Date(Date.UTC(y, m - 1, d));
}

export function toIsoLocalDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Extract YYYY-MM-DD without UTC timezone shifts (for API timestamps). */
export function wallClockDateFromDateTime(value?: string | null) {
  if (!value) return null;
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/** Extract HH:mm without UTC timezone shifts (for API timestamps). */
export function wallClockTimeFromDateTime(value?: string | null) {
  if (!value) return null;
  const match = String(value).match(/T(\d{2}:\d{2})/);
  if (match) return match[1];
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  return null;
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

export type CalendarQueryViewMode = "day" | "week" | "month";

export type CalendarQueryDateRange = {
  startDate: string;
  endDate: string;
};

/** Maps the visible calendar range to API query params for /calendar/overview. */
export function getCalendarQueryDateRange(
  activeDateIso: string,
  viewMode: CalendarQueryViewMode,
): CalendarQueryDateRange {
  if (viewMode === "day") {
    return { startDate: activeDateIso, endDate: activeDateIso };
  }

  if (viewMode === "week") {
    const startDate = startOfWeekIso(activeDateIso);
    return { startDate, endDate: addDaysIso(startDate, 6) };
  }

  const monthStart = toMonthIso(activeDateIso);
  const gridStart = startOfWeekIso(monthStart);
  return { startDate: gridStart, endDate: addDaysIso(gridStart, 41) };
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

export function intersectIntervals(
  left: readonly Interval[],
  right: readonly Interval[],
) {
  const a = mergeIntervals(left);
  const b = mergeIntervals(right);
  const out: Interval[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const startMin = Math.max(a[i].startMin, b[j].startMin);
    const endMin = Math.min(a[i].endMin, b[j].endMin);
    if (startMin < endMin) out.push({ startMin, endMin });
    if (a[i].endMin < b[j].endMin) i += 1;
    else j += 1;
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

const blockDayNameToDow: Record<BlockTimeDraft["dayFrom"], number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const isBlockDayAllowed = (dow: number, dayFrom: BlockTimeDraft["dayFrom"], dayTo: BlockTimeDraft["dayTo"]) => {
  const fromDow = blockDayNameToDow[dayFrom];
  const toDow = blockDayNameToDow[dayTo];
  if (fromDow <= toDow) return dow >= fromDow && dow <= toDow;
  return dow >= fromDow || dow <= toDow;
};

export const blockTitleFromDraft = (draft: BlockTimeDraft) =>
  draft.title === "Custom" ? draft.customTitle?.trim() || "Custom" : draft.title;

export function buildBlocksFromDraft(draft: BlockTimeDraft, teamIds: readonly string[]): CalendarBlock[] {
  const endDate = draft.dateTo || draft.dateFrom;
  const singleDay = draft.dateFrom === endDate;
  const blocks: CalendarBlock[] = [];
  let cursor = draft.dateFrom;

  while (cursor <= endDate) {
    const dow = parseIsoDate(cursor).getUTCDay();
    if (singleDay || isBlockDayAllowed(dow, draft.dayFrom, draft.dayTo)) {
      for (const teamId of teamIds) {
        blocks.push({
          id: `blk-local-${teamId}-${cursor}-${draft.startTime}-${draft.endTime}-${blocks.length}`,
          resourceId: teamId,
          date: cursor,
          start: draft.startTime,
          end: draft.endTime,
          title: blockTitleFromDraft(draft),
          kind: "unavailable",
        });
      }
    }
    cursor = addDaysIso(cursor, 1);
  }

  return blocks;
}
