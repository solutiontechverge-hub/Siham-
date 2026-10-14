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
  const slots: string[] = [];
  for (const window of free) {
    for (
      let min = window.startMin;
      min + durationMins <= window.endMin;
      min += slotStepMins
    ) {
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
    const existingMemberId = services.find((service) => service.teamMemberId)
      ?.teamMemberId;
    if (existingMemberId) {
      const member = snapshot.teamMembers.find((row) => row.id === existingMemberId);
      if (member) {
        const canPerformAll = normalized.every((service) =>
          memberCanPerformService(
            member,
            service.catalogServiceId,
            fallbackCatalogIds,
          ),
        );
        const working = getMemberWorkingIntervals(
          existingMemberId,
          snapshot.date,
          snapshot.location,
          snapshot,
        );
        const busy = snapshot.busyByMember[existingMemberId] ?? [];
        if (
          canPerformAll &&
          isMemberAvailableAt(startMin, windowMins, working, busy)
        ) {
          return services.map((service) => ({
            id: service.id,
            teamMemberId: existingMemberId,
          }));
        }
      }
    }
    const sharedMember = findAvailableMemberForAllServices(
      snapshot,
      candidateMemberIds,
      normalized,
      fallbackCatalogIds,
      startMin,
      sharedWindowMins,
    );
    // Keep prior assignment only when it was already validated as free above.
    return services.map((service) => ({
      id: service.id,
      teamMemberId: sharedMember,
    }));
  }

  // Fixed Location: choose the least busy capable member per service. Each
  // provisional assignment counts immediately, so concurrent work can spread.
  const usedMemberIds = new Set<string>();
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

    const atCap =
      usedMemberIds.size >= FIXED_LOCATION_MAX_DISTINCT_TEAM_MEMBERS;
    const assignSnapshot: SetupAvailabilitySnapshot = {
      ...snapshot,
      busyByMember: plannedBusyByMember,
    };
    const preferredIds = atCap
      ? candidateMemberIds.filter((id) => usedMemberIds.has(id))
      : candidateMemberIds;

    // Only assign members free at this slot — never fall back onto blocked/busy TMs.
    const memberId = findAvailableMemberForService(
      assignSnapshot,
      preferredIds,
      catalogServiceId,
      fallbackCatalogIds,
      cursor,
      durationMins,
    );

    if (memberId) {
      usedMemberIds.add(memberId);
      plannedBusyByMember[memberId] = [
        ...(plannedBusyByMember[memberId] ?? []),
        { startMin: cursor, endMin: cursor + durationMins },
      ];
    }
    cursor += durationMins;
    return {
      id: service.id,
      teamMemberId: memberId,
    };
  });
}
