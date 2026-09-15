import {
  eventBelongsToTeamMember,
  eventHasKnownTeamAssignment,
} from "../teamMemberBookings";
import type { CalendarFilters } from "../calendar.utils";
import { eventMatchesNonTeamCalendarFilters } from "../calendar.utils";
import type {
  CalendarBlock,
  CalendarEvent,
  CalendarResource,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { resourceHasScheduleOrBlockOnAnyDate } from "../calendar-schedule.utils";
import type { ScheduleAvailabilityRow } from "../calendar-settings.types";

export function filterEventsMatchingDrawerFilters(
  events: readonly CalendarEvent[],
  appliedFilters: CalendarFilters,
): CalendarEvent[] {
  return events.filter((event) => {
    if (appliedFilters.teamAll === false) {
      const selectedIds = Object.entries(appliedFilters.teamIds)
        .filter(([, checked]) => checked)
        .map(([id]) => id);
      if (
        selectedIds.length &&
        !selectedIds.some((id) => eventBelongsToTeamMember(event, id))
      ) {
        return false;
      }
    }
    return eventMatchesNonTeamCalendarFilters(event, appliedFilters);
  });
}

export function filterResourcesForVisibleDates(input: {
  teamAll: boolean;
  filterDrawerResources: readonly CalendarResource[];
  visibleDates: readonly string[];
  scheduleRows: readonly ScheduleAvailabilityRow[];
  blocks: readonly CalendarBlock[];
  eventsMatchingDrawerFilters: readonly CalendarEvent[];
}): CalendarResource[] {
  const {
    teamAll,
    filterDrawerResources,
    visibleDates,
    scheduleRows,
    blocks,
    eventsMatchingDrawerFilters,
  } = input;
  // Filter "All" → every team member column (viewport scrolls to 3).
  if (teamAll) return filterDrawerResources as CalendarResource[];
  return filterDrawerResources.filter((resource) => {
    if (
      resourceHasScheduleOrBlockOnAnyDate(
        resource.id,
        visibleDates,
        scheduleRows,
        blocks,
      )
    ) {
      return true;
    }
    return eventsMatchingDrawerFilters.some(
      (event) =>
        visibleDates.includes(event.date) &&
        eventBelongsToTeamMember(event, resource.id),
    );
  });
}

/** Month grid: unassigned bookings stay on the fallback (first) team member. */
export function filterMonthEventsForFocusedTeam(
  events: readonly CalendarEvent[],
  focusedTeamId: string,
  fallbackTeamId: string,
  resources: readonly CalendarResource[],
): CalendarEvent[] {
  if (!focusedTeamId) return [...events];
  return events.filter((event) => {
    if (eventBelongsToTeamMember(event, focusedTeamId)) return true;
    const hasKnownTeam = Boolean(
      event.resourceId &&
        resources.some(
          (resource) => String(resource.id) === String(event.resourceId),
        ),
    );
    return !hasKnownTeam && focusedTeamId === fallbackTeamId;
  });
}

/** Day/week range: unassigned bookings use known-team assignment check. */
export function filterRangeEventsForFocusedTeam(
  events: readonly CalendarEvent[],
  focusedTeamId: string,
  fallbackTeamId: string,
  knownResourceIds: ReadonlySet<string>,
): CalendarEvent[] {
  if (!focusedTeamId) return [...events];
  return events.filter((event) => {
    if (eventBelongsToTeamMember(event, focusedTeamId)) return true;
    return (
      !eventHasKnownTeamAssignment(event, knownResourceIds) &&
      focusedTeamId === fallbackTeamId
    );
  });
}
