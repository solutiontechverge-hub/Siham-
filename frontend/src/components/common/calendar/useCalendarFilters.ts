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
    if (!selectedIds.length) return resources;
    return resources.filter((r) => selectedIds.includes(r.id));
  }, [appliedFilters.teamAll, appliedFilters.teamIds, resources]);

  return {
    appliedFilters,
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
