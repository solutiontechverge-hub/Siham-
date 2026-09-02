import type { CalendarBookingLocation } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { Interval } from "./calendar.utils";
import {
  addDaysIso,
  intersectIntervals,
  isBlockTimeRangeFullyPast,
  mergeIntervals,
  minutesSinceMidnight,
  subtractIntervals,
  toIsoLocalDate,
  weekdayNameFromIso,
} from "./calendar.utils";
import type { ScheduleAvailabilityRow, ScheduleDateOverride } from "./calendar-settings.types";

export function makeScheduleRowId() {
  return `sch-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

/** Match by date span only — dayFrom/dayTo are display-only. */
export function rowMatchesDate(row: ScheduleAvailabilityRow, iso: string) {
  if (row.archived) return false;
  if (row.excludedDates?.includes(iso)) return false;
  return iso >= row.dateFrom && iso <= row.dateTo;
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

export type LocationAvailabilityKind = "fixed" | "desired" | "both";

export type LocationAvailabilityBand = {
  kind: LocationAvailabilityKind;
  interval: Interval;
};

export function locationAvailabilityTooltip(kind: LocationAvailabilityKind) {
  if (kind === "fixed") return "Available for Fixed Location";
  if (kind === "desired") return "Available for Desired Location";
  return "Available for Both";
}

export function locationAvailabilityKindAtMinute(
  bands: readonly LocationAvailabilityBand[],
  minute: number,
): LocationAvailabilityKind | null {
  const band = bands.find(
    (item) => minute >= item.interval.startMin && minute < item.interval.endMin,
  );
  return band?.kind ?? null;
}

/** FL / DL / overlap bands from the team member's Schedule (not Public Hours). */
export function getLocationAvailabilityBands(
  resourceId: string,
  iso: string,
  offeredLocations: readonly CalendarBookingLocation[],
  rows: readonly ScheduleAvailabilityRow[],
  overrides: readonly ScheduleDateOverride[],
  combinedFallback: readonly Interval[] = [],
): LocationAvailabilityBand[] {
  const offersFixed = offeredLocations.includes("FL");
  const offersDesired = offeredLocations.includes("DL");
  const fixed = offersFixed
    ? mergeIntervals(
        getLocationAvailabilityIntervals(resourceId, iso, "FL", rows, overrides),
      )
    : [];
  const desired = offersDesired
    ? mergeIntervals(
        getLocationAvailabilityIntervals(resourceId, iso, "DL", rows, overrides),
      )
    : [];
  const combined = mergeIntervals(combinedFallback);

  const toBands = (
    kind: LocationAvailabilityKind,
    intervals: readonly Interval[],
  ): LocationAvailabilityBand[] =>
    intervals.map((interval) => ({ kind, interval }));

  if (offersFixed && !offersDesired) {
    return toBands("fixed", fixed.length ? fixed : combined);
  }
  if (offersDesired && !offersFixed) {
    return toBands("desired", desired.length ? desired : combined);
  }

  if (!fixed.length && !desired.length) {
    return toBands("both", combined);
  }

  return [
    ...toBands("fixed", subtractIntervals(fixed, desired)),
    ...toBands("desired", subtractIntervals(desired, fixed)),
    ...toBands("both", intersectIntervals(fixed, desired)),
  ];
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

/** Mark availability rows archived when their full Date–Date range is before today. */
export function archiveFullyPastScheduleRows(
  rows: readonly ScheduleAvailabilityRow[],
  todayIso = toIsoLocalDate(new Date()),
): ScheduleAvailabilityRow[] {
  let changed = false;
  const next = rows.map((row) => {
    if (row.archived) return row;
    if (
      !isBlockTimeRangeFullyPast(
        row.dateFrom,
        row.dateTo || row.dateFrom,
        todayIso,
      )
    ) {
      return row;
    }
    changed = true;
    return { ...row, archived: true };
  });
  return changed ? next : (rows as ScheduleAvailabilityRow[]);
}

/** True when the member has non-archived availability or a block on the given date. */
export function resourceHasScheduleOrBlockOnDate(
  resourceId: string,
  iso: string,
  rows: readonly ScheduleAvailabilityRow[],
  blocks: readonly { resourceId: string; date: string }[],
) {
  if (hasAvailabilityOnDate(rows, iso, resourceId)) return true;
  return blocks.some(
    (block) => block.resourceId === resourceId && block.date === iso,
  );
}

export function resourceHasScheduleOrBlockOnAnyDate(
  resourceId: string,
  isos: readonly string[],
  rows: readonly ScheduleAvailabilityRow[],
  blocks: readonly { resourceId: string; date: string }[],
) {
  return isos.some((iso) =>
    resourceHasScheduleOrBlockOnDate(resourceId, iso, rows, blocks),
  );
}

export function expandRowDates(row: ScheduleAvailabilityRow): string[] {
  const dates: string[] = [];
  let cursor = row.dateFrom;
  const end = row.dateTo;

  while (cursor <= end) {
    if (!row.excludedDates?.includes(cursor)) {
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
    dayFrom: weekdayNameFromIso(iso),
    dayTo: weekdayNameFromIso(iso),
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
