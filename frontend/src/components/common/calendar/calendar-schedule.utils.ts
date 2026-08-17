import type { CalendarBookingLocation } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { Interval } from "./calendar.utils";
import {
  addDaysIso,
  minutesSinceMidnight,
  parseIsoDate,
} from "./calendar.utils";
import type { BlockTimeDraft } from "./calendar.utils";
import type { ScheduleAvailabilityRow, ScheduleDateOverride } from "./calendar-settings.types";

const dayNameToDow: Record<BlockTimeDraft["dayFrom"], number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const isDayInRange = (dow: number, dayFrom: BlockTimeDraft["dayFrom"], dayTo: BlockTimeDraft["dayTo"]) => {
  const fromDow = dayNameToDow[dayFrom];
  const toDow = dayNameToDow[dayTo];
  if (fromDow <= toDow) return dow >= fromDow && dow <= toDow;
  return dow >= fromDow || dow <= toDow;
};

export function makeScheduleRowId() {
  return `sch-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function rowMatchesDate(row: ScheduleAvailabilityRow, iso: string) {
  if (row.archived) return false;
  if (row.excludedDates?.includes(iso)) return false;
  if (iso < row.dateFrom || iso > row.dateTo) return false;
  const dow = parseIsoDate(iso).getUTCDay();
  const singleDay = row.dateFrom === row.dateTo;
  return singleDay || isDayInRange(dow, row.dayFrom, row.dayTo);
}

export function getScheduleRowsForDate(
  rows: readonly ScheduleAvailabilityRow[],
  resourceId: string,
  iso: string,
) {
  return rows.filter((row) => row.resourceIds.includes(resourceId) && rowMatchesDate(row, iso));
}

export function getDateOverride(
  overrides: readonly ScheduleDateOverride[],
  resourceId: string,
  iso: string,
) {
  return overrides.find((item) => item.resourceId === resourceId && item.date === iso) ?? null;
}

export function getLocationAvailabilityIntervals(
  resourceId: string,
  iso: string,
  location: CalendarBookingLocation,
  rows: readonly ScheduleAvailabilityRow[],
  overrides: readonly ScheduleDateOverride[],
): Interval[] {
  const override = getDateOverride(overrides, resourceId, iso);
  if (override?.locations.includes(location)) {
    return override.shifts.map((shift) => ({
      startMin: minutesSinceMidnight(shift.start),
      endMin: minutesSinceMidnight(shift.end),
    }));
  }

  const matchingRows = getScheduleRowsForDate(rows, resourceId, iso).filter((row) =>
    row.locations.includes(location),
  );
  const intervals: Interval[] = [];
  for (const row of matchingRows) {
    for (const shift of row.shifts) {
      intervals.push({
        startMin: minutesSinceMidnight(shift.start),
        endMin: minutesSinceMidnight(shift.end),
      });
    }
  }
  return intervals;
}

export function getCombinedAvailabilityIntervals(
  resourceId: string,
  iso: string,
  rows: readonly ScheduleAvailabilityRow[],
  overrides: readonly ScheduleDateOverride[],
): Interval[] {
  const override = getDateOverride(overrides, resourceId, iso);
  if (override) {
    return override.shifts.map((shift) => ({
      startMin: minutesSinceMidnight(shift.start),
      endMin: minutesSinceMidnight(shift.end),
    }));
  }

  const matchingRows = getScheduleRowsForDate(rows, resourceId, iso);
  const intervals: Interval[] = [];
  for (const row of matchingRows) {
    for (const shift of row.shifts) {
      intervals.push({
        startMin: minutesSinceMidnight(shift.start),
        endMin: minutesSinceMidnight(shift.end),
      });
    }
  }
  return intervals;
}

export function hasAvailabilityOnDate(
  rows: readonly ScheduleAvailabilityRow[],
  iso: string,
  resourceId?: string,
) {
  const relevant = resourceId
    ? rows.filter((row) => row.resourceIds.includes(resourceId))
    : rows;
  return relevant.some((row) => rowMatchesDate(row, iso));
}

export function expandRowDates(row: ScheduleAvailabilityRow): string[] {
  const dates: string[] = [];
  let cursor = row.dateFrom;
  const end = row.dateTo;
  const singleDay = row.dateFrom === end;

  while (cursor <= end) {
    const dow = parseIsoDate(cursor).getUTCDay();
    if (!row.excludedDates?.includes(cursor) && (singleDay || isDayInRange(dow, row.dayFrom, row.dayTo))) {
      dates.push(cursor);
    }
    cursor = addDaysIso(cursor, 1);
  }
  return dates;
}

export function splitScheduleRowForDate(
  row: ScheduleAvailabilityRow,
  iso: string,
  next: Pick<ScheduleAvailabilityRow, "resourceIds" | "locations" | "shifts">,
): ScheduleAvailabilityRow[] {
  if (!rowMatchesDate(row, iso)) return [row];

  const excluded = Array.from(new Set([...(row.excludedDates ?? []), iso]));
  const updatedOriginal: ScheduleAvailabilityRow = { ...row, excludedDates: excluded };
  const overrideRow: ScheduleAvailabilityRow = {
    ...row,
    id: makeScheduleRowId(),
    resourceIds: next.resourceIds,
    locations: next.locations,
    dateFrom: iso,
    dateTo: iso,
    dayFrom: "Monday",
    dayTo: "Sunday",
    shifts: next.shifts,
    excludedDates: [],
  };

  return [updatedOriginal, overrideRow];
}

function shiftToInterval(shift: { start: string; end: string }): Interval {
  return {
    startMin: minutesSinceMidnight(shift.start),
    endMin: minutesSinceMidnight(shift.end),
  };
}

export function scheduleShiftsOverlap(
  a: readonly { start: string; end: string }[],
  b: readonly { start: string; end: string }[],
) {
  for (const left of a) {
    const ia = shiftToInterval(left);
    for (const right of b) {
      const ib = shiftToInterval(right);
      if (ia.startMin < ib.endMin && ib.startMin < ia.endMin) return true;
    }
  }
  return false;
}

export function findConflictingAvailabilityRow(
  rows: readonly ScheduleAvailabilityRow[],
  candidate: Pick<
    ScheduleAvailabilityRow,
    "resourceIds" | "locations" | "dateFrom" | "dateTo" | "dayFrom" | "dayTo" | "shifts"
  >,
  excludeId?: string | null,
): ScheduleAvailabilityRow | null {
  const candidateDates = expandRowDates({
    ...candidate,
    id: "tmp",
    archived: false,
  } as ScheduleAvailabilityRow);

  for (const row of rows) {
    if (row.archived || row.id === excludeId) continue;
    const sharesTeam = row.resourceIds.some((id) => candidate.resourceIds.includes(id));
    const sharesLocation = row.locations.some((location) =>
      candidate.locations.includes(location),
    );
    if (!sharesTeam || !sharesLocation) continue;
    const dates = expandRowDates(row);
    if (!dates.some((iso) => candidateDates.includes(iso))) continue;
    if (scheduleShiftsOverlap(row.shifts, candidate.shifts)) return row;
  }
  return null;
}

export type ScheduleActiveBooking = {
  id: string;
  resourceId: string;
  date: string;
  start: string;
  end: string;
  prepaid?: boolean;
  status: string;
};

export function findBookingsInTimeslot(
  bookings: readonly ScheduleActiveBooking[],
  teamIds: readonly string[],
  dateFrom: string,
  dateTo: string,
  startTime: string,
  endTime: string,
) {
  const startMin = minutesSinceMidnight(startTime);
  const endMin = minutesSinceMidnight(endTime);
  return bookings.filter((booking) => {
    if (booking.status === "Cancelled" || booking.status === "Invalid") return false;
    if (!teamIds.includes(booking.resourceId)) return false;
    if (booking.date < dateFrom || booking.date > dateTo) return false;
    const bookingStart = minutesSinceMidnight(booking.start);
    const bookingEnd = minutesSinceMidnight(booking.end);
    return bookingStart < endMin && startMin < bookingEnd;
  });
}
