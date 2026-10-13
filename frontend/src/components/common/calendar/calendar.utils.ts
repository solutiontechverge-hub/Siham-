import { alpha } from "@mui/material/styles";
import { mollureSectionTitleSx } from "../../../theme/mollureHierarchy";
import type {
  CalendarBlock,
  CalendarBookingLocation,
  CalendarBookingStatus,
  CalendarBookingType,
  CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { UUID_RE } from "../../../lib/uuid";
import {
  isOutgoingPlainBookingRequestRejected,
  statusChipSx as bookingStatusChipSx,
} from "./bookingStatus";

/** Row cell wrapper sx for date/day/time pairs in calendar modals. */
export const calendarModalFlexFieldSx = { flex: 1, minWidth: 0 } as const;

/** @deprecated Prefer mollureSectionTitleSx — kept for existing booking screen imports. */
export const bookingScreenTitleSx = mollureSectionTitleSx;


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
  /** When true and Invalid is not selected, only outgoing plain-BR rejects. */
  brRejectedOnly: boolean;
};

export const EMPTY_CALENDAR_BOOKING_TYPES: Record<CalendarBookingType, boolean> = {
  Online: false,
  Offline: false,
  Project: false,
};

export const EMPTY_CALENDAR_STATUSES: Record<CalendarBookingStatus, boolean> = {
  Confirmed: false,
  Completed: false,
  Cancelled: false,
  Invalid: false,
  "No Show": false,
  Requested: false,
  "BR Accepted": false,
  "In Progress": false,
};

export function calendarBookingChannel(
  bookingType?: CalendarBookingType,
): CalendarBookingType {
  if (bookingType === "Offline" || bookingType === "Project") return bookingType;
  return "Online";
}

export function eventMatchesBookingTypeFilter(
  event: Pick<CalendarEvent, "bookingType">,
  filters: Pick<CalendarFilters, "bookingAll" | "booking">,
) {
  if (filters.bookingAll) return true;
  return Boolean(filters.booking[calendarBookingChannel(event.bookingType)]);
}

export function eventMatchesStatusFilter(
  event: Pick<CalendarEvent, "status" | "bookingScenario" | "details" | "notes">,
  filters: Pick<CalendarFilters, "statusAll" | "statuses" | "brRejectedOnly">,
) {
  if (filters.statusAll !== false) return true;
  const invalidSelected = Boolean(filters.statuses?.Invalid);
  if (filters.brRejectedOnly && !invalidSelected) {
    return isOutgoingPlainBookingRequestRejected(event);
  }
  return Boolean(filters.statuses?.[event.status]);
}

export function eventMatchesLocationFilter(
  event: Pick<CalendarEvent, "location">,
  filters: Pick<CalendarFilters, "locationAll" | "locations">,
) {
  if (filters.locationAll) return true;
  return Boolean(filters.locations[event.location]);
}

export function eventMatchesNonTeamCalendarFilters(
  event: Pick<
    CalendarEvent,
    | "location"
    | "bookingType"
    | "status"
    | "bookingScenario"
    | "details"
    | "notes"
  >,
  filters: CalendarFilters,
) {
  return (
    eventMatchesLocationFilter(event, filters) &&
    eventMatchesBookingTypeFilter(event, filters) &&
    eventMatchesStatusFilter(event, filters)
  );
}

/** True when the drawer is narrowing results (not the default All/All/All view). */
export function calendarFiltersAreNarrowing(
  filters: CalendarFilters,
  options?: { locationFilterAvailable?: boolean },
) {
  const locationFilterAvailable = options?.locationFilterAvailable !== false;
  return (
    filters.teamAll === false ||
    (locationFilterAvailable && filters.locationAll === false) ||
    filters.bookingAll === false ||
    filters.statusAll === false
  );
}

export type BlockTimeTitle = "" | "Meeting" | "Training" | "Holiday" | "Custom";

export type BlockTimeDraft = {
  title: BlockTimeTitle;
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

export function createEmptyBlockTimeDraft(
  teamIds: string[],
  locations: readonly CalendarBookingLocation[],
  dateIso: string,
): BlockTimeDraft {
  const day = weekdayNameFromIso(dateIso);
  return {
    title: "",
    customTitle: "",
    teamIds,
    locations: [...locations],
    dateFrom: dateIso,
    dateTo: dateIso,
    dayFrom: day,
    dayTo: day,
    startTime: "09:00",
    endTime: "17:00",
  };
}

export function calendarBlockLogicalKey(
  block: Pick<CalendarBlock, "resourceId" | "date" | "start" | "end" | "title">,
) {
  return `${block.resourceId}|${block.date}|${block.start}|${block.end}|${block.title}`;
}

export function dedupeCalendarBlocks<T extends CalendarBlock>(
  blocks: readonly T[],
): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const block of blocks) {
    const key = calendarBlockLogicalKey(block);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(block);
  }
  return unique;
}

export function siblingCalendarBlocks<T extends CalendarBlock>(
  blocks: readonly T[],
  target: Pick<CalendarBlock, "resourceId" | "date" | "start" | "end" | "title">,
): T[] {
  const key = calendarBlockLogicalKey(target);
  return blocks.filter((block) => calendarBlockLogicalKey(block) === key);
}

/**
 * Resolve a persisted calendar_entries UUID from a UI block id.
 * Accepts `blk-<uuid>` and multi-day `blk-<uuid>-YYYY-MM-DD`.
 */
export function calendarEntryIdFromBlockId(blockId: string): string | null {
  const raw = String(blockId ?? "").trim();
  if (!raw) return null;
  const withoutPrefix = raw.startsWith("blk-") ? raw.slice(4) : raw;
  if (!withoutPrefix || withoutPrefix.startsWith("local-")) return null;
  if (UUID_RE.test(withoutPrefix)) return withoutPrefix;
  const withDate = withoutPrefix.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})-\d{4}-\d{2}-\d{2}$/i,
  );
  return withDate?.[1] ?? null;
}

/** Stable UI id for one day of a persisted blocked-time entry. */
export function blockedCalendarBlockId(entryId: string, dateIso: string) {
  return `blk-${entryId}-${dateIso}`;
}

/** Expand a blocked calendar entry across start_date…end_date (one UI block per day). */
export function expandBlockedEntryToBlocks(
  entry: {
    id: string;
    team_member_id?: string | null;
    title?: string | null;
    date?: string | null;
    start?: string | null;
    end?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    blocked_time_start?: string | null;
    blocked_time_end?: string | null;
  },
  fallbackResourceId: string,
): CalendarBlock[] {
  const startDate =
    wallClockDateFromDateTime(entry.start_date) ||
    wallClockDateFromDateTime(entry.blocked_time_start) ||
    wallClockDateFromDateTime(entry.date) ||
    null;
  const endDate =
    wallClockDateFromDateTime(entry.end_date) ||
    wallClockDateFromDateTime(entry.blocked_time_end) ||
    startDate;
  if (!startDate) return [];

  const start =
    entry.start ||
    wallClockTimeFromDateTime(entry.blocked_time_start) ||
    "08:00";
  const end =
    entry.end || wallClockTimeFromDateTime(entry.blocked_time_end) || "09:00";
  const resourceId = String(
    entry.team_member_id ?? fallbackResourceId ?? "",
  );
  const title = entry.title || "Blocked";
  const rangeEnd = endDate && endDate >= startDate ? endDate : startDate;

  const blocks: CalendarBlock[] = [];
  let cursor = startDate;
  while (cursor <= rangeEnd) {
    blocks.push({
      id: blockedCalendarBlockId(entry.id, cursor),
      resourceId,
      date: cursor,
      start,
      end,
      title,
      kind: "unavailable",
    });
    cursor = addDaysIso(cursor, 1);
  }
  return blocks;
}

export function calendarBlockOverlapsBooking(
  block: Pick<CalendarBlock, "resourceId" | "date" | "start" | "end">,
  booking: {
    resourceId: string;
    date: string;
    start: string;
    end: string;
    status?: string;
  },
) {
  if (booking.status === "Cancelled" || booking.status === "Invalid") {
    return false;
  }
  if (block.resourceId !== booking.resourceId) return false;
  if (block.date !== booking.date) return false;
  const blockStart = minutesSinceMidnight(block.start);
  const blockEnd = minutesSinceMidnight(block.end);
  const bookingStart = minutesSinceMidnight(booking.start);
  const bookingEnd = minutesSinceMidnight(booking.end);
  return blockStart < bookingEnd && bookingStart < blockEnd;
}

export function bookingOverlapsAnyBlock(
  booking: {
    resourceId: string;
    date: string;
    start: string;
    end: string;
    status?: string;
  },
  blocks: readonly Pick<
    CalendarBlock,
    "resourceId" | "date" | "start" | "end"
  >[],
) {
  return blocks.some((block) => calendarBlockOverlapsBooking(block, booking));
}

export function statusChipSx(status: CalendarBookingStatus, _m?: { navy: string }) {
  return bookingStatusChipSx(status);
}

export function extractBookingId(rawId: string) {
  const parts = rawId.split("-");
  if (parts.length >= 3) return parts.slice(1, parts.length - 1).join("-");
  if (parts.length === 2) return parts[1];
  return rawId;
}

const CLOCK_TIME_RE = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i;

/** Minutes from midnight for `HH:MM`, `H:MM`, or `HH:MM AM/PM`. */
export function parseClockToMinutes(hhmm: string): number | null {
  const match = hhmm.trim().match(CLOCK_TIME_RE);
  if (!match) return null;
  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const mer = match[3]?.toLowerCase();
  if (mer === "pm" && hours < 12) hours += 12;
  if (mer === "am" && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function minutesSinceMidnight(hhmm: string) {
  return parseClockToMinutes(hhmm) ?? Number.NaN;
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

/** Weekday label for an ISO date (UTC), e.g. "2026-09-02" → "Wednesday". */
export function weekdayNameFromIso(
  iso: string,
): BlockTimeDraft["dayFrom"] {
  return ISO_DOW_TO_DAY_NAME[parseIsoDate(iso).getUTCDay()];
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

/** True when the whole Date (from)–Date (to) range is before local today. */
export function isBlockTimeRangeFullyPast(
  dateFrom: string,
  dateTo: string,
  todayIso = toIsoLocalDate(new Date()),
) {
  const end = dateTo || dateFrom;
  return Boolean(end) && end < todayIso;
}

/** Extract YYYY-MM-DD without UTC timezone shifts (for API timestamps). */
export function wallClockDateFromDateTime(value?: string | Date | null) {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return toIsoLocalDate(value);
  }
  const raw = String(value).trim();
  if (!raw) return null;
  // Prefer the literal calendar prefix (avoids TZ off-by-one on DATE/ISO strings).
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  // Historical free-text dates ("July 9, 2026", locale strings).
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return toIsoLocalDate(parsed);
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

/** Local calendar tomorrow as `YYYY-MM-DD`. */
export function tomorrowIso() {
  return addDaysIso(toIsoLocalDate(new Date()), 1);
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

/**
 * Maps the visible calendar range to API query params for /calendar/overview.
 * Always fetches the month grid window (~42 days) so day/week UI switches do not
 * under-fetch; the UI still scopes cards via visibleDates / monthCells.
 * # ponytail: viewMode ignored for fetch width; restore day/week windows if payload size hurts.
 */
export function getCalendarQueryDateRange(
  activeDateIso: string,
  _viewMode?: CalendarQueryViewMode,
): CalendarQueryDateRange {
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

/** Busy mins / available mins — same metric as day-view occupancy % bars. */
export function dailyBookingOccupancyRatio(
  busy: readonly Interval[],
  availability: readonly Interval[],
): number {
  const bookedMins = sumIntervalsMins(mergeIntervals(busy));
  const availableMins = sumIntervalsMins(availability);
  if (availableMins <= 0) return bookedMins > 0 ? 1 : 0;
  return Math.max(0, Math.min(1, bookedMins / availableMins));
}

export const blockTitleFromDraft = (draft: BlockTimeDraft) =>
  draft.title === "Custom" ? draft.customTitle?.trim() || "Custom" : draft.title;

/** Every calendar day in [dateFrom, dateTo] — dayFrom/dayTo are display-only. */
export function buildBlocksFromDraft(draft: BlockTimeDraft, teamIds: readonly string[]): CalendarBlock[] {
  const endDate = draft.dateTo || draft.dateFrom;
  const blocks: CalendarBlock[] = [];
  let cursor = draft.dateFrom;

  while (cursor <= endDate) {
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
    cursor = addDaysIso(cursor, 1);
  }

  return blocks;
}
