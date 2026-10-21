import {
  fmtMinutesToTimeLabel,
  parseTimeLabelToMinutes,
} from "./booking-time";
import {
  getCombinedAvailabilityIntervals,
  getLocationAvailabilityIntervals,
} from "../../../components/common/calendar/calendar-schedule.utils";
import type {
  ScheduleAvailabilityRow,
  ScheduleDateOverride,
} from "../../../components/common/calendar/calendar-settings.types";
import type { CalendarBookingLocation } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  intervalsOverlap,
  subtractIntervals,
  type Interval,
} from "../../../components/common/calendar/calendar.utils";

export type SetupAvailabilityTeamMember = {
  id: string;
  name: string;
  assignedServiceIds: string[];
};

export type SetupAvailabilitySnapshot = {
  date: string;
  location: CalendarBookingLocation;
  slotStepMinutes: number;
  scheduleAvailability: ScheduleAvailabilityRow[];
  dateOverrides: ScheduleDateOverride[];
  teamMembers: SetupAvailabilityTeamMember[];
  busyByMember: Record<string, Array<{ startMin: number; endMin: number }>>;
};

export function getMemberWorkingIntervals(
  memberId: string,
  dateIso: string,
  location: CalendarBookingLocation,
  snapshot: Pick<
    SetupAvailabilitySnapshot,
    "scheduleAvailability" | "dateOverrides"
  >,
): Interval[] {
  // Public Hours are display-only — bookable windows come from Schedule only.
  const fromSchedule = getLocationAvailabilityIntervals(
    memberId,
    dateIso,
    location,
    snapshot.scheduleAvailability,
    snapshot.dateOverrides,
  );
  if (fromSchedule.length) return fromSchedule;

  return getCombinedAvailabilityIntervals(
    memberId,
    dateIso,
    snapshot.scheduleAvailability,
    snapshot.dateOverrides,
  );
}

export function memberCanPerformService(
  member: SetupAvailabilityTeamMember,
  catalogServiceId: string,
  fallbackCatalogIds: string[],
) {
  const assigned = member.assignedServiceIds;
  if (assigned.length === 0) return fallbackCatalogIds.includes(catalogServiceId);
  return assigned.includes(catalogServiceId);
}

export function isMemberAvailableAt(
  startMin: number,
  durationMins: number,
  workingIntervals: Interval[],
  busyIntervals: Interval[],
) {
  const endMin = startMin + durationMins;
  const withinWorking = workingIntervals.some(
    (window) => startMin >= window.startMin && endMin <= window.endMin,
  );
  if (!withinWorking) return false;
  return !busyIntervals.some((busy) =>
    intervalsOverlap({ startMin, endMin }, busy),
  );
}

export function isMemberBookedAtSlot(
  snapshot: SetupAvailabilitySnapshot,
  memberId: string,
  startMin: number,
  durationMins: number,
) {
  return getMemberSlotStatus(snapshot, memberId, startMin, durationMins).booked;
}

export function getMemberSlotStatus(
  snapshot: SetupAvailabilitySnapshot,
  memberId: string,
  startMin: number,
  durationMins: number,
) {
  const working = getMemberWorkingIntervals(
    memberId,
    snapshot.date,
    snapshot.location,
    snapshot,
  );
  const busy = snapshot.busyByMember[memberId] ?? [];
  const endMin = startMin + durationMins;
  const withinWorking = working.some(
    (window) => startMin >= window.startMin && endMin <= window.endMin,
  );
  const booked = busy.some((interval) =>
    intervalsOverlap({ startMin, endMin }, interval),
  );
  return {
    withinWorking,
    booked,
    available: withinWorking && !booked,
  };
}

export function computeFreeSlotStarts(
  workingIntervals: Interval[],
  busyIntervals: Interval[],
  durationMins: number,
  slotStepMins: number,
  minStartMin?: number,
) {
  const free = subtractIntervals(workingIntervals, busyIntervals);
  const step = Math.max(1, slotStepMins || 1);
  const slots: string[] = [];
  for (const window of free) {
    // Snap to slot grid so labels match the :00/:30 strip (off-grid busy ends
    // must not produce only :15/:45 starts that never appear as buttons).
    let min = window.startMin;
    const rem = ((min % step) + step) % step;
    if (rem !== 0) min += step - rem;
    for (; min + durationMins <= window.endMin; min += step) {
      if (minStartMin != null && min < minStartMin) continue;
      slots.push(fmtMinutesToTimeLabel(min));
    }
  }
  return slots;
}

export function computeUnionBookableSlots(
  snapshot: SetupAvailabilitySnapshot,
  memberIds: string[],
  durationMins: number,
  minStartMin?: number,
) {
  const seen = new Set<string>();
  const slots: string[] = [];
  for (const memberId of memberIds) {
    const working = getMemberWorkingIntervals(
      memberId,
      snapshot.date,
      snapshot.location,
      snapshot,
    );
    const busy = snapshot.busyByMember[memberId] ?? [];
    for (const slot of computeFreeSlotStarts(
      working,
      busy,
      durationMins,
      snapshot.slotStepMinutes,
      minStartMin,
    )) {
      if (seen.has(slot)) continue;
      seen.add(slot);
      slots.push(slot);
    }
  }
  return slots.sort(
    (a, b) => parseTimeLabelToMinutes(a) - parseTimeLabelToMinutes(b),
  );
}

export function memberOccupancyRatio(
  snapshot: SetupAvailabilitySnapshot,
  memberId: string,
) {
  const working = getMemberWorkingIntervals(
    memberId,
    snapshot.date,
    snapshot.location,
    snapshot,
  );
  const availableMins = working.reduce(
    (sum, window) => sum + Math.max(0, window.endMin - window.startMin),
    0,
  );
  const busyMins = (snapshot.busyByMember[memberId] ?? []).reduce(
    (sum, window) => sum + Math.max(0, window.endMin - window.startMin),
    0,
  );
  if (availableMins <= 0) return 1;
  return Math.min(1, busyMins / availableMins);
}

export function sortMembersByLowestOccupancy(
  snapshot: SetupAvailabilitySnapshot,
  memberIds: readonly string[],
) {
  return [...memberIds].sort((a, b) => {
    const diff = memberOccupancyRatio(snapshot, a) - memberOccupancyRatio(snapshot, b);
    if (diff !== 0) return diff;
    return a.localeCompare(b);
  });
}

/** Max distinct team members auto-assigned across one Fixed Location booking. */
export const FIXED_LOCATION_MAX_DISTINCT_TEAM_MEMBERS = 3;

export function findAvailableMemberForService(
  snapshot: SetupAvailabilitySnapshot,
  candidateMemberIds: string[],
  catalogServiceId: string,
  fallbackCatalogIds: string[],
  startMin: number,
  durationMins: number,
) {
  for (const memberId of sortMembersByLowestOccupancy(snapshot, candidateMemberIds)) {
    const member = snapshot.teamMembers.find((row) => row.id === memberId);
    if (!member) continue;
    if (
      !memberCanPerformService(member, catalogServiceId, fallbackCatalogIds)
    ) {
      continue;
    }
    const working = getMemberWorkingIntervals(
      memberId,
      snapshot.date,
      snapshot.location,
      snapshot,
    );
    const busy = snapshot.busyByMember[memberId] ?? [];
    if (isMemberAvailableAt(startMin, durationMins, working, busy)) {
      return memberId;
    }
  }
  return null;
}

/** Capable members only, lowest day occupancy first (may be busy at the slot). */
export function findLowestOccupancyMemberForService(
  snapshot: SetupAvailabilitySnapshot,
  candidateMemberIds: string[],
  catalogServiceId: string,
  fallbackCatalogIds: string[],
) {
  for (const memberId of sortMembersByLowestOccupancy(snapshot, candidateMemberIds)) {
    const member = snapshot.teamMembers.find((row) => row.id === memberId);
    if (!member) continue;
    if (
      !memberCanPerformService(member, catalogServiceId, fallbackCatalogIds)
    ) {
      continue;
    }
    return memberId;
  }
  return null;
}

export function findAvailableMemberForAllServices(
  snapshot: SetupAvailabilitySnapshot,
  candidateMemberIds: string[],
  services: Array<{ catalogServiceId: string; durationMins: number }>,
  fallbackCatalogIds: string[],
  startMin: number,
  /** When set (Combine Services), check this window instead of summing durations. */
  sharedWindowMins?: number,
) {
  const totalDuration =
    sharedWindowMins != null && sharedWindowMins > 0
      ? sharedWindowMins
      : services.reduce((sum, service) => sum + (service.durationMins || 0), 0);
  if (totalDuration <= 0) return null;

  for (const memberId of sortMembersByLowestOccupancy(snapshot, candidateMemberIds)) {
    const member = snapshot.teamMembers.find((row) => row.id === memberId);
    if (!member) continue;
    const canPerformAll = services.every((service) =>
      memberCanPerformService(
        member,
        service.catalogServiceId,
        fallbackCatalogIds,
      ),
    );
    if (!canPerformAll) continue;

    const working = getMemberWorkingIntervals(
      memberId,
      snapshot.date,
      snapshot.location,
      snapshot,
    );
    const busy = snapshot.busyByMember[memberId] ?? [];
    if (isMemberAvailableAt(startMin, totalDuration, working, busy)) {
      return memberId;
    }
  }
  return null;
}

export function autoAssignServicesByAvailability(input: {
  snapshot: SetupAvailabilitySnapshot;
  services: Array<{
    id: string;
    catalogServiceId?: string | null;
    durationMins: number;
    teamMemberId?: string | null;
  }>;
  candidateMemberIds: string[];
  fallbackCatalogIds: string[];
  startMin: number;
  assignOneMemberForAll?: boolean;
  /** Combine Services: occupancy window = max duration, not sum. */
  sharedWindowMins?: number;
}) {
  const {
    snapshot,
    services,
    candidateMemberIds,
    fallbackCatalogIds,
    startMin,
    assignOneMemberForAll = false,
    sharedWindowMins,
  } = input;

  if (!candidateMemberIds.length || !services.length) {
    return services.map((service) => ({
      id: service.id,
      teamMemberId: service.teamMemberId ?? null,
    }));
  }

  // Keep free client picks; clear busy/invalid. Never fill blanks — backend
  // createBooking assigns free TMs for null teamMemberId.
  if (assignOneMemberForAll) {
    const normalized = services.map((service) => ({
      catalogServiceId:
        service.catalogServiceId?.trim() ||
        service.id.split("-")[0] ||
        service.id,
      durationMins: service.durationMins || 30,
    }));
    const windowMins =
      sharedWindowMins != null && sharedWindowMins > 0
        ? sharedWindowMins
        : normalized.reduce((sum, service) => sum + service.durationMins, 0);

    // Slot freeness only for explicit picks. Skill checks wiped Guest specialist
    // picks (assignedServiceIds id-space ≠ row catalogServiceId) even after
    // dropping canPerformAll — dropdown already offered the member.
    const isFreeSharedPick = (memberId: string) => {
      if (!candidateMemberIds.includes(memberId)) return false;
      if (!snapshot.teamMembers.some((row) => row.id === memberId)) return false;
      const working = getMemberWorkingIntervals(
        memberId,
        snapshot.date,
        snapshot.location,
        snapshot,
      );
      const busy = snapshot.busyByMember[memberId] ?? [];
      return isMemberAvailableAt(startMin, windowMins, working, busy);
    };

    // Apply by index — callers must not find()-by-id when CLIENT+Guest share a
    // catalog line id (duplicate ids); that kept only the first row's result.
    return services.map((service) => {
      const existingId = String(service.teamMemberId ?? "").trim() || null;
      if (!existingId) return { id: service.id, teamMemberId: null };
      return {
        id: service.id,
        teamMemberId: isFreeSharedPick(existingId) ? existingId : null,
      };
    });
  }

  // Fixed Location (per service): keep a free client pick; leave blanks null.
  const plannedBusyByMember: Record<string, Interval[]> = Object.fromEntries(
    Object.entries(snapshot.busyByMember).map(([memberId, intervals]) => [
      memberId,
      [...intervals],
    ]),
  );
  let cursor = startMin;
  return services.map((service) => {
    const catalogServiceId =
      service.catalogServiceId?.trim() ||
      service.id.split("-")[0] ||
      service.id;
    const durationMins = service.durationMins || 30;
    const existingId = String(service.teamMemberId ?? "").trim() || null;

    const keepExisting = (() => {
      if (!existingId || !candidateMemberIds.includes(existingId)) return null;
      const member = snapshot.teamMembers.find((row) => row.id === existingId);
      if (
        !member ||
        !memberCanPerformService(member, catalogServiceId, fallbackCatalogIds)
      ) {
        return null;
      }
      const working = getMemberWorkingIntervals(
        existingId,
        snapshot.date,
        snapshot.location,
        snapshot,
      );
      const busy = plannedBusyByMember[existingId] ?? [];
      return isMemberAvailableAt(cursor, durationMins, working, busy)
        ? existingId
        : null;
    })();

    if (keepExisting) {
      plannedBusyByMember[keepExisting] = [
        ...(plannedBusyByMember[keepExisting] ?? []),
        { startMin: cursor, endMin: cursor + durationMins },
      ];
    }
    cursor += durationMins;
    return {
      id: service.id,
      teamMemberId: keepExisting,
    };
  });
}
