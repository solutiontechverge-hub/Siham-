import * as React from "react";
import type {
  CalendarBookingLocation,
  CalendarBookingStatus,
  CalendarBookingType,
  CalendarResource,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { CalendarFilters } from "./calendar.utils";

const bookingTypes: readonly CalendarBookingType[] = ["Online", "Offline", "Project", "Requests"];
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
        booking: {
          Online: false,
          Offline: false,
          Project: false,
          Requests: false,
        },
      };
    }
  }

  if (next.statusAll === false) {
    const selectedStatuses = bookingStatuses.filter((status) => next.statuses[status]);
    if (!selectedStatuses.length) {
      next = {
        ...next,
        statusAll: true,
        statuses: {
          Confirmed: false,
          Completed: false,
          Cancelled: false,
          Invalid: false,
          "No Show": false,
          Requested: false,
          "In Progress": false,
        },
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
      booking: { Online: false, Offline: false, Project: false, Requests: false },
      statusAll: true,
      statuses: {
        Confirmed: false,
        Completed: false,
        Cancelled: false,
        Invalid: false,
        "No Show": false,
        Requested: false,
        "In Progress": false,
      },
    }),
    [locations, resources],
  );

  const [draftFilters, setDraftFilters] = React.useState<CalendarFilters>(() => initialFilters);
  const [appliedFilters, setAppliedFilters] = React.useState<CalendarFilters>(() => initialFilters);

  const resourceKey = React.useMemo(() => resources.map((resource) => resource.id).join("|"), [resources]);

  React.useEffect(() => {
    const mergeTeamIds = (prev: CalendarFilters) => ({
      ...Object.fromEntries(resources.map((resource) => [resource.id, false])),
      ...prev.teamIds,
    });

    setDraftFilters((prev) => ({
      ...prev,
      teamAll: true,
      teamIds: mergeTeamIds(prev),
    }));
    setAppliedFilters((prev) => ({
      ...prev,
      teamAll: true,
      teamIds: mergeTeamIds(prev),
    }));
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
