import type {
  CalendarBlock,
  CalendarEvent,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";

type Interval = { startMin: number; endMin: number };

function minutesSinceMidnight(hhmm: string): number {
  const [h, m] = String(hhmm || "0:0")
    .split(":")
    .map((part) => Number(part));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

function assignedMemberId(service: {
  teamMemberId?: string | null;
  staffResourceId?: string | null;
}): string {
  return String(service.teamMemberId || service.staffResourceId || "").trim();
}

function hasServiceLevelAssignee(event: CalendarEvent): boolean {
  if ((event.details?.services ?? []).some((service) => assignedMemberId(service))) {
    return true;
  }
  for (const guest of event.details?.guests ?? []) {
    if (String(guest.bufferTeamMemberId ?? "").trim()) return true;
    if ((guest.services ?? []).some((service) => assignedMemberId(service))) {
      return true;
    }
  }
  return (event.details?.clientSnapshot?.services ?? []).some(
    (service) => String(service.teamMemberId ?? "").trim(),
  );
}

/** Service/buffer windows assigned to this member (not the host remount). */
function assignedBusySlotsForMember(
  event: CalendarEvent,
  resourceId: string,
): Interval[] {
  const focusedId = String(resourceId);
  const slots: Interval[] = [];
  const push = (start?: string | null, end?: string | null) => {
    const startMin = minutesSinceMidnight(
      String(start || event.start || "00:00"),
    );
    const endMin = minutesSinceMidnight(String(end || event.end || "00:00"));
    if (endMin > startMin) slots.push({ startMin, endMin });
  };

  for (const service of event.details?.services ?? []) {
    if (assignedMemberId(service) === focusedId) {
      push(
        (service as { startTime?: string }).startTime,
        (service as { endTime?: string }).endTime,
      );
    }
  }
  for (const guest of event.details?.guests ?? []) {
    if (String(guest.bufferTeamMemberId ?? "").trim() === focusedId) {
      push(guest.bufferStartTime, guest.bufferEndTime);
    }
    for (const service of guest.services ?? []) {
      if (assignedMemberId(service) === focusedId) {
        push(
          (service as { startTime?: string }).startTime,
          (service as { endTime?: string }).endTime,
        );
      }
    }
  }
  for (const service of event.details?.clientSnapshot?.services ?? []) {
    if (String(service.teamMemberId ?? "").trim() === focusedId) {
      push(undefined, undefined);
    }
  }
  return slots;
}

/**
 * Busy minutes per team member from service/buffer assignees
 * (`teamMemberId` / `staffResourceId`), not only event.resourceId / chronological host.
 */
export function buildBusyIntervalsForResource(input: {
  resourceId: string;
  iso: string;
  events: readonly CalendarEvent[];
  blocks: readonly CalendarBlock[];
  fallbackTeamMemberId: string;
  knownTeamMemberIds: ReadonlySet<string>;
}): Interval[] {
  const {
    resourceId,
    iso,
    events,
    blocks,
    fallbackTeamMemberId,
    knownTeamMemberIds,
  } = input;
  const busy: Interval[] = [];
  const focusedId = String(resourceId);

  for (const e of events) {
    if (e.date !== iso) continue;
    // Cancelled slots stay visually shown but are free to rebook.
    if (e.status === "Cancelled") continue;

    const assignedSlots = assignedBusySlotsForMember(e, focusedId);
    if (assignedSlots.length) {
      busy.push(...assignedSlots);
      continue;
    }

    // Line-level assignees exist for others → do not dump the full window
    // onto event.resourceId (fixes multi-member occupancy undercount/overcount).
    if (hasServiceLevelAssignee(e)) continue;

    const hostId = String(e.resourceId || "");
    const belongs =
      hostId === focusedId ||
      (focusedId === String(fallbackTeamMemberId) &&
        (!hostId || !knownTeamMemberIds.has(hostId)));
    if (!belongs) continue;

    busy.push({
      startMin: minutesSinceMidnight(e.start),
      endMin: minutesSinceMidnight(e.end),
    });
  }

  for (const b of blocks) {
    if (b.resourceId !== resourceId || b.date !== iso) continue;
    busy.push({
      startMin: minutesSinceMidnight(b.start),
      endMin: minutesSinceMidnight(b.end),
    });
  }
  return busy;
}
