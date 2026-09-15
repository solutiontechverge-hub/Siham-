import * as React from "react";
import { dedupeCalendarDisplaySegments } from "../calendar-overlap.utils";
import { calendarEventToDisplaySegments } from "../../../../data/bookingChronologicalBlocks";
import { toMonthIso } from "../calendar.utils";
import type {
  CalendarBlock,
  CalendarEvent,
  CalendarResource,
  CalendarViewMode,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  buildMonthCells,
  filterMonthEventsForFocusedTeam,
  filterRangeEventsForFocusedTeam,
  remountDayViewSegmentsOntoVisibleColumns,
} from "./useProfessionalFixedLocationCalendar.helpers";

export type UseProfessionalFixedLocationCalendarViewRangeArgs = {
  grid: { stepMinutes: number };
  eventsMatchingDrawerFilters: readonly CalendarEvent[];
  blocks: readonly CalendarBlock[];
  appliedFilters: {
    teamAll: boolean;
    teamIds: Record<string, boolean>;
  };
  filtersAreNarrowing: boolean;
  viewMode: CalendarViewMode;
  visibleDates: readonly string[];
  selectedResourceId: string | null;
  activeResourceId: string | undefined;
  fallbackTeamMemberId: string;
  knownResourceIds: ReadonlySet<string>;
  resourceNameById: ReadonlyMap<string, string>;
  dayViewMemberColumnSource: readonly { id: string }[];
  resources: readonly CalendarResource[];
  activeMonthIso: string;
  activeDateIso: string;
  todayIso: string;
  nowMin: number;
};

/** Day/week/month range derived lists + now-line geometry (ponytail: deps bag). */
export function useProfessionalFixedLocationCalendarViewRange({
  grid,
  eventsMatchingDrawerFilters,
  blocks,
  appliedFilters,
  filtersAreNarrowing,
  viewMode,
  visibleDates,
  selectedResourceId,
  activeResourceId,
  fallbackTeamMemberId,
  knownResourceIds,
  resourceNameById,
  dayViewMemberColumnSource,
  resources,
  activeMonthIso,
  activeDateIso,
  todayIso,
  nowMin,
}: UseProfessionalFixedLocationCalendarViewRangeArgs) {
  /** Full-day grid (00:00–24:00) so early/late bookings stay visible. */
  const { startMin, endMin } = React.useMemo(
    () => ({
      startMin: 0,
      endMin: 24 * 60,
    }),
    [],
  );

  const rows = Math.max(
    1,
    Math.floor((endMin - startMin) / grid.stepMinutes),
  );
  const rowPx = 78;
  const laneHeaderPx = 48;

  const slotLines = React.useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < rows; i++) out.push(startMin + i * grid.stepMinutes);
    return out;
  }, [rows, startMin, grid.stepMinutes]);

  const eventsInRange = React.useMemo(() => {
    const base = eventsMatchingDrawerFilters.filter((e) =>
      visibleDates.includes(e.date),
    );
    const scoped = (() => {
      if (filtersAreNarrowing || viewMode === "day") return base;
      const focusedTeamId = String(selectedResourceId || activeResourceId || "");
      return filterRangeEventsForFocusedTeam(
        base,
        focusedTeamId,
        fallbackTeamMemberId,
        knownResourceIds,
      );
    })();
    const segments = dedupeCalendarDisplaySegments(
      scoped.flatMap((event) =>
        calendarEventToDisplaySegments(event, resourceNameById),
      ),
    );
    if (viewMode !== "day") return segments;
    return remountDayViewSegmentsOntoVisibleColumns(
      segments,
      dayViewMemberColumnSource,
      selectedResourceId ?? "",
    );
  }, [
    activeResourceId,
    dayViewMemberColumnSource,
    eventsMatchingDrawerFilters,
    filtersAreNarrowing,
    knownResourceIds,
    resourceNameById,
    selectedResourceId,
    viewMode,
    visibleDates,
    fallbackTeamMemberId,
  ]);

  const showNowLine =
    (viewMode === "week"
      ? visibleDates.includes(todayIso)
      : activeDateIso === todayIso) &&
    nowMin >= startMin &&
    nowMin <= endMin;
  const nowLineTop = ((nowMin - startMin) / grid.stepMinutes) * rowPx;

  const monthEvents = React.useMemo(() => {
    const base = eventsMatchingDrawerFilters.filter(
      (e) => toMonthIso(e.date) === activeMonthIso,
    );
    if (filtersAreNarrowing) return base;
    const focusedTeamId = String(selectedResourceId || activeResourceId || "");
    return filterMonthEventsForFocusedTeam(
      base,
      focusedTeamId,
      fallbackTeamMemberId,
      resources,
    );
  }, [
    activeMonthIso,
    activeResourceId,
    resources,
    eventsMatchingDrawerFilters,
    fallbackTeamMemberId,
    filtersAreNarrowing,
    selectedResourceId,
  ]);

  const monthCells = React.useMemo(
    () =>
      buildMonthCells({
        activeMonthIso,
        activeDateIso,
        todayIso,
        monthEvents,
      }),
    [activeDateIso, activeMonthIso, monthEvents, todayIso],
  );

  const blocksInRange = React.useMemo(() => {
    const base = blocks.filter((b) => visibleDates.includes(b.date));
    if (appliedFilters.teamAll) return base;
    return base.filter((b) => appliedFilters.teamIds[b.resourceId]);
  }, [appliedFilters.teamAll, appliedFilters.teamIds, blocks, visibleDates]);

  return {
    startMin,
    endMin,
    rows,
    rowPx,
    laneHeaderPx,
    slotLines,
    eventsInRange,
    showNowLine,
    nowLineTop,
    monthEvents,
    monthCells,
    blocksInRange,
  };
}
