import { minutesSinceMidnight } from "../components/common/calendar/calendar.utils";
import type {
  CalendarBookingGuestItem,
  CalendarEvent,
} from "../app/professionals/fixed-location/calendar/calendar.data";
import {
  ensureServiceStartEndTimes,
  sortServicesByStartTime,
  type BookingServiceLineItem,
} from "./bookingServiceEdit.data";
import {
  buildChronologicalBlocks,
  sortByCanonicalBookingOrder,
  type ChronologicalParticipantType,
  type ChronologicalPerson,
  type ChronologicalServiceLine,
} from "./bookingChronologicalBlocks.core";

export type CalendarChronologicalSegment = {
  id: string;
  parentEventId: string;
  resourceId: string;
  date: string;
  start: string;
  end: string;
  title: string;
  participantLabel: string;
  participantType: ChronologicalParticipantType;
};

export function expandCalendarEventToChronologicalSegments(
  event: CalendarEvent,
): CalendarChronologicalSegment[] {
  const details = event.details;
  const snapshot = details?.clientSnapshot;
  const requesterPerson =
    snapshot?.people?.find((person) => person.isRequester) ??
    snapshot?.people?.[0] ?? {
      id: "requester",
      name: event.showClientName || event.title,
      isRequester: true,
    };

  const mainServices =
    details?.services?.filter((service) => !service.guestId) ??
    snapshot?.services?.filter((service) => !service.guestId) ??
    [];

  const guests = details?.guests ?? [];
  const guestParticipants: Array<{
    person: ChronologicalPerson;
    services: BookingServiceLineItem[];
  }> = guests.map((guest) => ({
    person: {
      id: guest.id,
      name: guest.name,
      participantType: guest.participantType,
      planningActivity: guest.planningActivity,
      planningDuration: guest.planningDuration,
      planningStartTime: guest.planningStartTime,
      planningEndTime: guest.planningEndTime,
      bufferStartTime: guest.bufferStartTime,
      bufferEndTime: guest.bufferEndTime,
      bufferTeamMemberId: guest.bufferTeamMemberId,
    },
    services: guest.services,
  }));

  const snapshotGuestServices =
    snapshot?.services?.filter((service) => service.guestId) ?? [];
  if (snapshotGuestServices.length && !guestParticipants.length) {
    const guestIds = [...new Set(snapshotGuestServices.map((service) => service.guestId))];
    for (const guestId of guestIds) {
      if (!guestId) continue;
      const person =
        snapshot?.people?.find((row) => row.id === guestId) ?? {
          id: guestId,
          name: "Guest",
        };
      guestParticipants.push({
        person,
        services: snapshotGuestServices
          .filter((service) => service.guestId === guestId)
          .map((service) => ({
            ...service,
            startTime: undefined,
            endTime: undefined,
          })),
      });
    }
  }

  for (const person of snapshot?.people ?? []) {
    if (person.participantType !== "buffer" && person.participantType !== "planning") {
      continue;
    }
    if (guestParticipants.some((guest) => guest.person.id === person.id)) continue;
    guestParticipants.push({ person, services: [] });
  }

  const blocks = buildChronologicalBlocks({
    bookingStart: event.start,
    requesterPerson,
    mainServices: sortServicesByStartTime(
      ensureServiceStartEndTimes(
        mainServices as BookingServiceLineItem[],
        event.start,
      ),
    ),
    guests: guestParticipants,
    teamMembers: snapshot?.teamMembers,
  });

  if (!blocks.length) {
    return [
      {
        id: `${event.id}::segment-0`,
        parentEventId: event.id,
        resourceId: event.resourceId,
        date: event.date,
        start: event.start,
        end: event.end,
        title: event.title,
        participantLabel: requesterPerson.name,
        participantType: "requester",
      },
    ];
  }

  return blocks.map((block, index) => {
    const serviceTitle = block.items.map((item) => item.name).join(" · ");
    const planningTitle = block.planningItem?.activity?.trim();
    const segmentTitle =
      block.participantType === "planning" || block.participantType === "buffer"
        ? planningTitle || block.title
        : serviceTitle || block.title;

    return {
      id: `${event.id}::segment-${index}`,
      parentEventId: event.id,
      resourceId: block.teamMemberId || event.resourceId,
      date: event.date,
      start: block.startTime,
      end: block.endTime,
      title: segmentTitle,
      participantLabel: block.title,
      participantType: block.participantType,
    };
  });
}

export function calendarSegmentToDisplayEvent(
  segment: CalendarChronologicalSegment,
  parent: CalendarEvent,
  extras?: Pick<CalendarEvent, "teamShared" | "sharedTeamMemberNames">,
): CalendarEvent {
  return {
    ...parent,
    id: segment.id,
    resourceId: segment.resourceId || parent.resourceId,
    start: segment.start,
    end: segment.end,
    title: segment.title,
    showClientName: segment.participantLabel,
    teamShared: extras?.teamShared ?? parent.teamShared,
    sharedTeamMemberNames:
      extras?.sharedTeamMemberNames ?? parent.sharedTeamMemberNames,
  };
}

function firstName(value: string | undefined) {
  return value?.trim() || "";
}

function collectAssignedTeamMemberSlots(event: CalendarEvent) {
  const byId = new Map<
    string,
    { start: string; end: string; titles: string[] }
  >();
  const add = (
    teamId: string | null | undefined,
    start?: string,
    end?: string,
    title?: string,
  ) => {
    const id = String(teamId ?? "").trim();
    if (!id) return;
    const slotStart = start?.trim() || event.start;
    const slotEnd = end?.trim() || event.end;
    const prev = byId.get(id);
    if (!prev) {
      byId.set(id, {
        start: slotStart,
        end: slotEnd,
        titles: title?.trim() ? [title.trim()] : [],
      });
      return;
    }
    if (slotStart < prev.start) prev.start = slotStart;
    if (slotEnd > prev.end) prev.end = slotEnd;
    const label = title?.trim();
    if (label && !prev.titles.includes(label)) prev.titles.push(label);
  };

  for (const service of event.details?.services ?? []) {
    add(
      service.teamMemberId || service.staffResourceId,
      service.startTime,
      service.endTime,
      service.name,
    );
  }
  for (const guest of event.details?.guests ?? []) {
    add(guest.bufferTeamMemberId, guest.bufferStartTime, guest.bufferEndTime);
    for (const service of guest.services ?? []) {
      add(
        service.teamMemberId || service.staffResourceId,
        service.startTime,
        service.endTime,
        service.name,
      );
    }
  }
  for (const service of event.details?.clientSnapshot?.services ?? []) {
    add(service.teamMemberId, undefined, undefined, service.name);
  }
  if (!byId.size && event.resourceId) {
    add(event.resourceId, event.start, event.end, event.title);
  }

  return [...byId.entries()].map(([id, slot]) => ({
    id,
    start: slot.start,
    end: slot.end,
    title: slot.titles.join(" · ") || event.title,
  }));
}

function resolveTeamMemberNames(
  teamIds: readonly string[],
  event: CalendarEvent,
  nameById: ReadonlyMap<string, string>,
) {
  return [
    ...new Set(
      teamIds
        .map(
          (id) =>
            firstName(nameById.get(id)) ||
            firstName(
              event.details?.clientSnapshot?.teamMembers?.find(
                (member) => String(member.id) === id,
              )?.name,
            ),
        )
        .filter(Boolean),
    ),
  ];
}

function pickDisplaySpan(
  parts: ReadonlyArray<{ start?: string; end?: string }>,
  fallback: { start: string; end: string },
) {
  let start = fallback.start;
  let end = fallback.end;
  let startMin = minutesSinceMidnight(fallback.start);
  let endMin = minutesSinceMidnight(fallback.end);
  for (const part of parts) {
    const partStart = part.start?.trim();
    if (partStart) {
      const min = minutesSinceMidnight(partStart);
      if (Number.isFinite(min) && min < startMin) {
        startMin = min;
        start = partStart;
      }
    }
    const partEnd = part.end?.trim();
    if (partEnd) {
      const min = minutesSinceMidnight(partEnd);
      if (Number.isFinite(min) && min > endMin) {
        endMin = min;
        end = partEnd;
      }
    }
  }
  return { start, end };
}

/**
 * Overview cards:
 * Desired Location — one team member, one card for the full booking window.
 * Fixed Location — one card per assigned team member (not per client/model block).
 */
export function calendarEventToDisplaySegments(
  event: CalendarEvent,
  nameById: ReadonlyMap<string, string> = new Map(),
): CalendarEvent[] {
  const slots = collectAssignedTeamMemberSlots(event);
  const teamIds = slots.map((slot) => slot.id);
  const names = resolveTeamMemberNames(teamIds, event, nameById);
  const isDesiredLocation = event.location === "DL";
  const teamShared = !isDesiredLocation && teamIds.length > 1;
  const blocks = expandCalendarEventToChronologicalSegments(event);
  const span = pickDisplaySpan(blocks, {
    start: event.start,
    end: event.end,
  });

  if (isDesiredLocation || teamIds.length <= 1) {
    const resourceId = teamIds[0] || event.resourceId;
    return [
      {
        ...event,
        resourceId: resourceId || event.resourceId,
        start: span.start,
        end: span.end,
        title: event.title,
        showClientName: event.showClientName,
        teamShared: false,
        sharedTeamMemberNames: names,
      },
    ];
  }

  return slots.map((slot, index) => ({
    ...event,
    id: `${event.id}::segment-${index}`,
    resourceId: slot.id,
    start: slot.start,
    end: slot.end,
    title: event.title,
    showClientName: event.showClientName,
    teamShared,
    sharedTeamMemberNames: names,
  }));
}

export function resolveParentCalendarEventId(eventId: string) {
  const marker = "::segment-";
  const idx = eventId.indexOf(marker);
  return idx >= 0 ? eventId.slice(0, idx) : eventId;
}

export function getBookingTimedSpanMins(input: {
  bookingStart?: string;
  requesterPerson?: ChronologicalPerson;
  mainServices: readonly ChronologicalServiceLine[];
  guests?: ReadonlyArray<{
    person: ChronologicalPerson;
    services: readonly ChronologicalServiceLine[];
  }>;
}): number {
  const blocks = buildChronologicalBlocks({
    ...input,
    requesterPerson: input.requesterPerson ?? {
      id: "requester",
      name: "Client",
      isRequester: true,
    },
  });
  if (!blocks.length) return 0;
  const start = Math.min(...blocks.map((block) => minutesSinceMidnight(block.startTime)));
  const end = Math.max(...blocks.map((block) => minutesSinceMidnight(block.endTime)));
  return Math.max(0, end - start);
}

/** Start time used to place a guest / planning / buffer card on the drawer timeline. */
export function getCalendarGuestStartTime(
  guest: Pick<
    CalendarBookingGuestItem,
    "participantType" | "planningStartTime" | "bufferStartTime" | "services"
  >,
): string {
  if (guest.participantType === "planning") {
    return guest.planningStartTime?.trim() || "";
  }
  if (guest.participantType === "buffer") {
    return guest.bufferStartTime?.trim() || "";
  }
  let earliest = "";
  let earliestMin = Number.POSITIVE_INFINITY;
  for (const service of guest.services) {
    const start = service.startTime?.trim();
    if (!start) continue;
    const mins = minutesSinceMidnight(start);
    if (mins < earliestMin) {
      earliestMin = mins;
      earliest = start;
    }
  }
  return earliest;
}

/** Drawer participant cards: timed blocks first by start, untimed last, stable by id. */
export function sortCalendarGuestsByStartTime<T extends CalendarBookingGuestItem>(
  guests: readonly T[],
): T[] {
  return [...guests].sort((a, b) => {
    const aStart = getCalendarGuestStartTime(a);
    const bStart = getCalendarGuestStartTime(b);
    if (!aStart && !bStart) return a.id.localeCompare(b.id);
    if (!aStart) return 1;
    if (!bStart) return -1;
    const diff = minutesSinceMidnight(aStart) - minutesSinceMidnight(bStart);
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });
}

function calendarGuestParticipantType(
  guest: Pick<CalendarBookingGuestItem, "participantType" | "name">,
): ChronologicalParticipantType {
  if (guest.participantType === "planning" || guest.name === "Planning") {
    return "planning";
  }
  if (guest.participantType === "buffer") return "buffer";
  if (guest.participantType === "model") return "model";
  return "guest";
}

/** Drawer / details cards: Client, then models/guests, then planning, buffers last. */
export function sortCalendarGuestsByCanonicalOrder<T extends CalendarBookingGuestItem>(
  guests: readonly T[],
): T[] {
  return sortByCanonicalBookingOrder(guests, calendarGuestParticipantType);
}

