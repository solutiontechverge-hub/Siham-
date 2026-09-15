import * as React from "react";
import type {
  CalendarBookingLocation,
  CalendarResource,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  type Interval,
  dailyBookingOccupancyRatio,
  intervalsOverlap,
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
    (resourceId: string, iso: string) =>
      dailyBookingOccupancyRatio(
        getBusyFor(resourceId, iso),
        getAvailabilityFor(resourceId, iso),
      ),
    [getAvailabilityFor, getBusyFor],
  );

  /**
   * Client-like “most available” pick: lowest day occupancy, free at the slot.
   * Falls back to lowest occupancy when nobody is free (still assign someone).
   * prefer/avoid/only pools support DL sticky reuse and Fixed Location spread + max-3.
   */
  const pickMostAvailableTeamMemberId = React.useCallback(
    (
      dateIso: string,
      startMin: number,
      durationMins: number,
      extraBusyByMember?: ReadonlyMap<string, readonly Interval[]>,
      options?: {
        preferMemberIds?: readonly string[];
        avoidMemberIds?: readonly string[];
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

      const avoid = options?.avoidMemberIds?.length
        ? new Set(options.avoidMemberIds.map(String))
        : null;
      if (avoid) {
        const freeOther = candidates.find(
          (resource) => !avoid.has(String(resource.id)) && isFree(resource),
        );
        if (freeOther) return freeOther.id;
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

  /**
   * Members free for a service window (working hours + not busy).
   * Always includes `includeMemberIds` (e.g. current assignee) even if busy.
   */
  const listAvailableTeamMembersForWindow = React.useCallback(
    (
      dateIso: string,
      startMin: number,
      durationMins: number,
      options?: {
        onlyMemberIds?: readonly string[];
        includeMemberIds?: readonly string[];
        extraBusyByMember?: ReadonlyMap<string, readonly Interval[]>;
      },
    ): CalendarResource[] => {
      let candidates = [...resources];
      if (options?.onlyMemberIds?.length) {
        const only = new Set(options.onlyMemberIds.map(String));
        candidates = candidates.filter((resource) =>
          only.has(String(resource.id)),
        );
      }

      const endMin = startMin + Math.max(1, durationMins || 0);
      const include = new Set(
        (options?.includeMemberIds ?? []).map(String).filter(Boolean),
      );

      const isFree = (resource: CalendarResource) => {
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
          ...(options?.extraBusyByMember?.get(resource.id) ?? []),
        ];
        return !busy.some((interval) =>
          intervalsOverlap({ startMin, endMin }, interval),
        );
      };

      const free = candidates.filter(isFree);
      const byId = new Map(free.map((resource) => [String(resource.id), resource]));
      for (const id of include) {
        if (byId.has(id)) continue;
        const resource = resources.find((item) => String(item.id) === id);
        if (resource) byId.set(id, resource);
      }
      return [...byId.values()].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );
    },
    [
      resources,
      getAvailabilityFor,
      getBusyFor,
      getLocationAvailability,
      slotLocation,
    ],
  );

  return {
    getDailyBookingRatio,
    listAvailableTeamMembersForWindow,
    pickMostAvailableTeamMemberId,
  };
}
