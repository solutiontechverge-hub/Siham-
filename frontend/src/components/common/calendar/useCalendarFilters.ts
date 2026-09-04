import * as React from "react";
import type {
  CalendarBookingLocation,
  CalendarBookingStatus,
  CalendarBookingType,
  CalendarResource,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  EMPTY_CALENDAR_BOOKING_TYPES,
  EMPTY_CALENDAR_STATUSES,
  type CalendarFilters,
} from "./calendar.utils";

const bookingTypes: readonly CalendarBookingType[] = ["Online", "Offline", "Project"];
const bookingStatuses: readonly CalendarBookingStatus[] = [
  "Confirmed",
  "Completed",
  "Cancelled",
  "Invalid",
  "No Show",
  "Requested",
  "In Progress",
];
const allLocations: readonly CalendarBookingLocation[] = ["FL", "DL"];

export function normalizeCalendarFilters(
  filters: CalendarFilters,
  resources: readonly CalendarResource[],
  availableLocations: readonly CalendarBookingLocation[] = allLocations,
): CalendarFilters {
  let next = filters;

  if (!next.teamAll) {
    const selectedTeamIds = resources.filter((resource) => next.teamIds[resource.id]);
    if (!selectedTeamIds.length) {
      next = {
        ...next,
        teamAll: true,
        teamIds: Object.fromEntries(resources.map((resource) => [resource.id, false])),
      };
    }
  }

  if (!next.locationAll) {
    const selectedLocations = availableLocations.filter(
      (location) => next.locations[location],
    );
    if (!selectedLocations.length) {
      next = {
        ...next,
        locationAll: true,
        locations: { FL: false, DL: false },
      };
    }
  }

  if (!next.bookingAll) {
    const selectedBookingTypes = bookingTypes.filter((type) => next.booking[type]);
    if (!selectedBookingTypes.length) {
      next = {
        ...next,
        bookingAll: true,
        booking: { ...EMPTY_CALENDAR_BOOKING_TYPES },
      };
    }
  }

  if (next.statusAll === false) {
    const selectedStatuses = bookingStatuses.filter((status) => next.statuses[status]);
    if (!selectedStatuses.length && !next.brRejectedOnly) {
      next = {
        ...next,
        statusAll: true,
        brRejectedOnly: false,
        statuses: { ...EMPTY_CALENDAR_STATUSES },
      };
    }
  }

  return next;
}

export function useCalendarFilters(
  resources: readonly CalendarResource[],
  availableLocations: readonly CalendarBookingLocation[] = allLocations,
) {
  const locations = availableLocations.length ? availableLocations : allLocations;
  const initialFilters = React.useMemo<CalendarFilters>(
    () => ({
      teamAll: true,
      teamIds: Object.fromEntries(resources.map((r) => [r.id, false])),
      locationAll: locations.length > 1,
      locations: {
        FL: locations.length === 1 && locations[0] === "FL",
        DL: locations.length === 1 && locations[0] === "DL",
      },
      bookingAll: true,
      booking: { ...EMPTY_CALENDAR_BOOKING_TYPES },
      statusAll: true,
      brRejectedOnly: false,
      statuses: { ...EMPTY_CALENDAR_STATUSES },
    }),
    [locations, resources],
  );

  const [draftFilters, setDraftFilters] = React.useState<CalendarFilters>(() => initialFilters);
  const [appliedFilters, setAppliedFilters] = React.useState<CalendarFilters>(() => initialFilters);

  const resourceKey = React.useMemo(() => resources.map((resource) => resource.id).join("|"), [resources]);

  React.useEffect(() => {
    const mergeTeamState = (prev: CalendarFilters): CalendarFilters => {
      const teamIds = {
        ...Object.fromEntries(resources.map((resource) => [resource.id, false])),
        ...prev.teamIds,
      };
      const knownIds = new Set(resources.map((resource) => resource.id));
      const selectedStillExist = Object.entries(teamIds).some(
        ([id, checked]) => checked && knownIds.has(id),
      );
      return {
        ...prev,
        teamIds,
        teamAll: prev.teamAll || !selectedStillExist,
      };
    };

    setDraftFilters(mergeTeamState);
    setAppliedFilters(mergeTeamState);
  }, [resourceKey, resources]);

  const filteredResources = React.useMemo(() => {
    if (appliedFilters.teamAll) return resources;
    const selectedIds = Object.entries(appliedFilters.teamIds)
      .filter(([, checked]) => checked)
      .map(([id]) => id);
    if (!selectedIds.length) return [];
    return resources.filter((r) => selectedIds.includes(r.id));
  }, [appliedFilters.teamAll, appliedFilters.teamIds, resources]);

  const applyFilters = React.useCallback(
    (filters: CalendarFilters) => {
      setAppliedFilters(normalizeCalendarFilters(filters, resources, locations));
    },
    [locations, resources],
  );

  return {
    appliedFilters,
    applyFilters,
    bookingTypes,
    bookingStatuses,
    draftFilters,
    filteredResources,
    initialFilters,
    locations,
    setAppliedFilters,
    setDraftFilters,
  };
}
