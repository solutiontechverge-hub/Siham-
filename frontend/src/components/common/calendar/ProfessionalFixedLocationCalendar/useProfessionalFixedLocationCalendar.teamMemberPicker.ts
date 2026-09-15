import * as React from "react";
import type {
  CalendarBookingLocation,
  CalendarResource,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  type Interval,
  intervalsOverlap,
  mergeIntervals,
  sumIntervalsMins,
} from "../calendar.utils";

export type UseProfessionalFixedLocationCalendarTeamMemberPickerArgs = {
  resources: readonly CalendarResource[];
  getAvailabilityFor: (resourceId: string, iso: string) => Interval[];
  getBusyFor: (resourceId: string, iso: string) => Interval[];
  getLocationAvailability: (
    resourceId: string,
    iso: string,
    location: CalendarBookingLocation,
  ) => Interval[];
  slotLocation: CalendarBookingLocation;
};

export function useProfessionalFixedLocationCalendarTeamMemberPicker({
  resources,
  getAvailabilityFor,
  getBusyFor,
  getLocationAvailability,
  slotLocation,
}: UseProfessionalFixedLocationCalendarTeamMemberPickerArgs) {
  const getDailyBookingRatio = React.useCallback(
    (resourceId: string, iso: string) => {
      const busy = getBusyFor(resourceId, iso);
      const bookedMins = sumIntervalsMins(mergeIntervals(busy));
      const availability = getAvailabilityFor(resourceId, iso);
      const availableMins = sumIntervalsMins(availability);
      if (availableMins <= 0) {
        return bookedMins > 0 ? 1 : 0;
      }
      return Math.max(0, Math.min(1, bookedMins / availableMins));
    },
    [getAvailabilityFor, getBusyFor],
  );

  /**
   * Client-like “most available” pick: lowest day occupancy, free at the slot.
   * Falls back to lowest occupancy when nobody is free (still assign someone).
   * Optional prefer/only pools support Fixed Location max-3 reuse.
   */
  const pickMostAvailableTeamMemberId = React.useCallback(
    (
      dateIso: string,
      startMin: number,
      durationMins: number,
      extraBusyByMember?: ReadonlyMap<string, readonly Interval[]>,
      options?: {
        preferMemberIds?: readonly string[];
        onlyMemberIds?: readonly string[];
      },
    ): string => {
      let candidates = [...resources];
      if (options?.onlyMemberIds?.length) {
        const only = new Set(options.onlyMemberIds.map(String));
        candidates = candidates.filter((resource) =>
          only.has(String(resource.id)),
        );
      }
      candidates.sort((a, b) => {
        const diff =
          getDailyBookingRatio(a.id, dateIso) -
          getDailyBookingRatio(b.id, dateIso);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      });
      if (!candidates.length) return "";

      const endMin = startMin + Math.max(1, durationMins || 0);
      const isFree = (resource: (typeof candidates)[number]) => {
        const locationWindows = slotLocation
          ? getLocationAvailability(resource.id, dateIso, slotLocation)
          : [];
        const working = locationWindows.length
          ? locationWindows
          : getAvailabilityFor(resource.id, dateIso);
        if (!working.length) return false;
        const withinWorking = working.some(
          (window) => startMin >= window.startMin && endMin <= window.endMin,
        );
        if (!withinWorking) return false;
        const busy = [
          ...getBusyFor(resource.id, dateIso),
          ...(extraBusyByMember?.get(resource.id) ?? []),
        ];
        return !busy.some((interval) =>
          intervalsOverlap({ startMin, endMin }, interval),
        );
      };

      const prefer = options?.preferMemberIds?.length
        ? new Set(options.preferMemberIds.map(String))
        : null;
      if (prefer) {
        const freePreferred = candidates.find(
          (resource) => prefer.has(String(resource.id)) && isFree(resource),
        );
        if (freePreferred) return freePreferred.id;
      }

      const free = candidates.find(isFree);
      if (free) return free.id;

      if (prefer) {
        const preferredBusy = candidates.find((resource) =>
          prefer.has(String(resource.id)),
        );
        if (preferredBusy) return preferredBusy.id;
      }
      return candidates[0]?.id ?? "";
    },
    [
      resources,
      getAvailabilityFor,
      getBusyFor,
      getDailyBookingRatio,
      getLocationAvailability,
      slotLocation,
    ],
  );

  return { getDailyBookingRatio, pickMostAvailableTeamMemberId };
}
