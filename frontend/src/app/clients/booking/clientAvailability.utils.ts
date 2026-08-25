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
  getPublicBusinessHoursInterval,
  intervalsOverlap,
  subtractIntervals,
  type Interval,
  type PublicBusinessHoursLike,
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
  publicBusinessHours: PublicBusinessHoursLike[];
  teamMembers: SetupAvailabilityTeamMember[];
  busyByMember: Record<string, Array<{ startMin: number; endMin: number }>>;
};

export function getMemberWorkingIntervals(
  memberId: string,
  dateIso: string,
  location: CalendarBookingLocation,
  snapshot: Pick<
    SetupAvailabilitySnapshot,
    | "scheduleAvailability"
    | "dateOverrides"
    | "publicBusinessHours"
  >,
): Interval[] {
  const publicInterval = getPublicBusinessHoursInterval(
    snapshot.publicBusinessHours,
    dateIso,
    location,
  );
  if (publicInterval) return [publicInterval];

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

export function findAvailableMemberForAllServices(
  snapshot: SetupAvailabilitySnapshot,
  candidateMemberIds: string[],
  services: Array<{ catalogServiceId: string; durationMins: number }>,
  fallbackCatalogIds: string[],
  startMin: number,
) {
  const totalDuration = services.reduce(
    (sum, service) => sum + (service.durationMins || 0),
    0,
  );
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
}) {
  const {
    snapshot,
    services,
    candidateMemberIds,
    fallbackCatalogIds,
    startMin,
    assignOneMemberForAll = false,
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
        const totalDuration = normalized.reduce(
          (sum, service) => sum + service.durationMins,
          0,
        );
        if (
          canPerformAll &&
          isMemberAvailableAt(startMin, totalDuration, working, busy)
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
    );
    return services.map((service) => ({
      id: service.id,
      teamMemberId: sharedMember ?? service.teamMemberId ?? null,
    }));
  }

  let cursor = startMin;
  return services.map((service) => {
    const catalogServiceId =
      service.catalogServiceId?.trim() ||
      service.id.split("-")[0] ||
      service.id;
    const durationMins = service.durationMins || 30;

    if (service.teamMemberId) {
      const member = snapshot.teamMembers.find(
        (row) => row.id === service.teamMemberId,
      );
      if (member) {
        const working = getMemberWorkingIntervals(
          service.teamMemberId,
          snapshot.date,
          snapshot.location,
          snapshot,
        );
        const busy = snapshot.busyByMember[service.teamMemberId] ?? [];
        if (
          memberCanPerformService(member, catalogServiceId, fallbackCatalogIds) &&
          isMemberAvailableAt(cursor, durationMins, working, busy)
        ) {
          cursor += durationMins;
          return { id: service.id, teamMemberId: service.teamMemberId };
        }
      }
    }

    const memberId =
      findAvailableMemberForService(
        snapshot,
        candidateMemberIds,
        catalogServiceId,
        fallbackCatalogIds,
        cursor,
        durationMins,
      ) ?? service.teamMemberId ?? null;
    cursor += durationMins;
    return { id: service.id, teamMemberId: memberId };
  });
}
