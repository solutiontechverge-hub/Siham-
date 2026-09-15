import * as React from "react";
import type {
  ResourceAvailability,
  CalendarBlock,
  CalendarBookingLocation,
  CalendarEvent,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  getCombinedAvailabilityIntervals,
  getLocationAvailabilityIntervals,
} from "../calendar-schedule.utils";
import type {
  ScheduleAvailabilityRow,
  ScheduleDateOverride,
} from "../calendar-settings.types";
import type { Interval } from "../calendar.utils";
import {
  mergeIntervals,
  minutesSinceMidnight,
  parseIsoDate,
  timelineHoverFromPointerY,
} from "../calendar.utils";
import { buildBusyIntervalsForResource } from "./useProfessionalFixedLocationCalendar.helpers";

export type UseProfessionalFixedLocationCalendarAvailabilityArgs = {
  scheduleRows: readonly ScheduleAvailabilityRow[];
  dateOverrides: readonly ScheduleDateOverride[] | null | undefined;
  dataAvailability: readonly ResourceAvailability[];
  events: readonly CalendarEvent[];
  blocks: readonly CalendarBlock[];
  fallbackTeamMemberId: string;
  knownTeamMemberIds: ReadonlySet<string>;
  /** Preserve prior getBusyFor dep invalidation (unused inside callback). */
  activeResourceId?: string;
  knownResourceIds: ReadonlySet<string>;
  locationAll: boolean;
  locations: Readonly<Record<"FL" | "DL", boolean>>;
  activeDateIso: string;
  viewMode: string;
  startMin: number;
  endMin: number;
  stepMinutes: number;
  rowPx: number;
};

export function useProfessionalFixedLocationCalendarAvailability({
  scheduleRows,
  dateOverrides,
  dataAvailability,
  events,
  blocks,
  fallbackTeamMemberId,
  knownTeamMemberIds,
  activeResourceId,
  knownResourceIds,
  locationAll,
  locations,
  activeDateIso,
  viewMode,
  startMin,
  endMin,
  stepMinutes,
  rowPx,
}: UseProfessionalFixedLocationCalendarAvailabilityArgs) {
  const getAvailabilityFor = React.useCallback(
    (resourceId: string, iso: string): Interval[] => {
      const fromSchedule = getCombinedAvailabilityIntervals(
        resourceId,
        iso,
        scheduleRows,
        dateOverrides ?? [],
      );
      if (fromSchedule.length) return mergeIntervals(fromSchedule);

      const av = dataAvailability.find((a) => a.resourceId === resourceId);
      if (!av) return [];
      const dow = parseIsoDate(iso).getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      const windows = av.weekly[dow] ?? [];
      return mergeIntervals(
        windows.map((w) => ({
          startMin: minutesSinceMidnight(w.start),
          endMin: minutesSinceMidnight(w.end),
        })),
      );
    },
    [dataAvailability, dateOverrides, scheduleRows],
  );

  const getLocationAvailability = React.useCallback(
    (
      resourceId: string,
      iso: string,
      location: CalendarBookingLocation,
    ): Interval[] =>
      mergeIntervals(
        getLocationAvailabilityIntervals(
          resourceId,
          iso,
          location,
          scheduleRows,
          dateOverrides ?? [],
        ),
      ),
    [dateOverrides, scheduleRows],
  );

  const getFilteredAvailabilityFor = React.useCallback(
    (resourceId: string, iso: string): Interval[] => {
      if (locationAll) return getAvailabilityFor(resourceId, iso);
      const selected = (["FL", "DL"] as const).filter(
        (location) => locations[location],
      );
      if (!selected.length) return getAvailabilityFor(resourceId, iso);
      return mergeIntervals(
        selected.flatMap((location) =>
          getLocationAvailability(resourceId, iso, location),
        ),
      );
    },
    [getAvailabilityFor, getLocationAvailability, locationAll, locations],
  );

  const getBusyFor = React.useCallback(
    (resourceId: string, iso: string): Interval[] =>
      buildBusyIntervalsForResource({
        resourceId,
        iso,
        events,
        blocks,
        fallbackTeamMemberId,
        knownTeamMemberIds,
      }),
    // Match prior deps bag exactly (activeResourceId / knownResourceIds unused).
    [activeResourceId, blocks, events, knownResourceIds],
  );

  const timelineGridRef = React.useRef<HTMLDivElement | null>(null);
  const [timelineHover, setTimelineHover] = React.useState<{
    absoluteTop: number;
    timeMin: number;
  } | null>(null);
  const [availabilityHoverTitle, setAvailabilityHoverTitle] =
    React.useState("");

  const handleTimelineHoverMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const gridEl = timelineGridRef.current;
      if (!gridEl) return;
      const laneRect = e.currentTarget.getBoundingClientRect();
      const gridRect = gridEl.getBoundingClientRect();
      const yInBody = e.clientY - laneRect.top;
      const { topPx, timeMin } = timelineHoverFromPointerY(yInBody, {
        rowPx,
        startMin,
        endMin,
        stepMinutes,
      });
      setTimelineHover({
        absoluteTop: laneRect.top - gridRect.top + topPx,
        timeMin,
      });
    },
    [endMin, rowPx, startMin, stepMinutes],
  );

  const clearTimelineHover = React.useCallback(() => {
    setTimelineHover(null);
    setAvailabilityHoverTitle("");
  }, []);

  React.useEffect(() => {
    setTimelineHover(null);
  }, [activeDateIso, viewMode]);

  return {
    availabilityHoverTitle,
    clearTimelineHover,
    getAvailabilityFor,
    getBusyFor,
    getFilteredAvailabilityFor,
    getLocationAvailability,
    handleTimelineHoverMove,
    setAvailabilityHoverTitle,
    setTimelineHover,
    timelineGridRef,
    timelineHover,
  };
}
