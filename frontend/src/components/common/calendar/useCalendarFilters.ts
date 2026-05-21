import * as React from "react";
import type {
  CalendarBookingLocation,
  CalendarBookingType,
  CalendarResource,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { CalendarFilters } from "./calendar.utils";

const bookingTypes: readonly CalendarBookingType[] = ["Online", "Offline", "Project", "Requests"];
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
    }),
    [locations, resources],
  );

  const [draftFilters, setDraftFilters] = React.useState<CalendarFilters>(() => initialFilters);
  const [appliedFilters, setAppliedFilters] = React.useState<CalendarFilters>(() => initialFilters);

  React.useEffect(() => {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }, [initialFilters]);

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
    draftFilters,
    filteredResources,
    initialFilters,
    locations,
    setAppliedFilters,
    setDraftFilters,
  };
}
