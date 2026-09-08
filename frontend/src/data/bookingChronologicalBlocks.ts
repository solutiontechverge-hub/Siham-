import { minutesSinceMidnight } from "../components/common/calendar/calendar.utils";
import type { ClientBookingDraftService } from "../components/common/client-booking/types";
import type {
  CalendarBookingGuestItem,
  CalendarBookingServiceItem,
  CalendarEvent,
} from "../app/professionals/fixed-location/calendar/calendar.data";
import {
  addMinutesToTime,
  ensureServiceStartEndTimes,
  parseDurationMinsLabel,
  sortServicesByStartTime,
  type BookingServiceLineItem,
} from "./bookingServiceEdit.data";

export type ChronologicalParticipantType =
  | "requester"
  | "guest"
  | "model"
  | "planning"
  | "buffer";

export type ChronologicalPerson = {
  id: string;
  name: string;
  isRequester?: boolean;
  participantType?: "model" | "planning" | "guest" | "buffer" | "notes";
  planningActivity?: string;
  planningDuration?: string;
  planningIsLocked?: boolean;
  planningStartTime?: string;
  planningEndTime?: string;
  bufferStartTime?: string;
  bufferEndTime?: string;
  bufferTeamMemberId?: string;
};

export type ChronologicalServiceLine = {
  id: string;
  name: string;
  durationMins: number;
  startTime?: string;
  endTime?: string;
  guestId?: string | null;
  teamMemberId?: string | null;
  staffResourceId?: string | null;
};

export type ChronologicalTimedEntry<T extends ChronologicalServiceLine> = {
  id: string;
  participantId: string;
  participantType: ChronologicalParticipantType;
  startTime: string;
  endTime: string;
  kind: "service" | "planning" | "buffer";
  service?: T;
  planningActivity?: string;
  planningDuration?: string;
  teamMemberId?: string;
};

export type ChronologicalBlock<T extends ChronologicalServiceLine> = {
  key: string;
  blockIndex: number;
  participantId: string;
  participantType: ChronologicalParticipantType;
  title: string;
  isRequester: boolean;
  startTime: string;
  endTime: string;
  items: T[];
  planningItem?: { activity: string; duration: string };
  teamMemberLabel?: string;
  teamMemberId?: string;
};

function isPlanningPerson(person: ChronologicalPerson) {
  return person.participantType === "planning" || person.name === "Planning";
}

function isBufferPerson(person: ChronologicalPerson) {
  if (person.participantType === "buffer") return true;
  const id = String(person.id ?? "").toLowerCase();
  return id === "buffer" || id.startsWith("buffer-") || id.startsWith("p-buffer");
}

function isNotesPerson(person: ChronologicalPerson) {
  return person.participantType === "notes" || person.id === "p-notes";
}

/** Display order for booking cards: Client → Models/Guests → Planning → Buffers. */
export function canonicalParticipantRank(
  type: ChronologicalParticipantType | ChronologicalPerson["participantType"] | string | undefined,
): number {
  switch (type) {
    case "requester":
      return 0;
    case "model":
    case "guest":
      return 1;
    case "planning":
      return 2;
    case "buffer":
      return 3;
    case "notes":
      return 4;
    default:
      return 1;
  }
}

export function sortByCanonicalBookingOrder<T>(
  items: readonly T[],
  getType: (item: T) => ChronologicalParticipantType | string | undefined,
): T[] {
  return [...items].sort(
    (a, b) => canonicalParticipantRank(getType(a)) - canonicalParticipantRank(getType(b)),
  );
}

function planningFingerprint(person: ChronologicalPerson) {
  return [
    (person.planningActivity ?? "").trim().toLowerCase(),
    (person.planningStartTime ?? person.bufferStartTime ?? "").trim(),
    (person.planningEndTime ?? person.bufferEndTime ?? "").trim(),
    (person.planningDuration ?? "").trim().toLowerCase(),
  ].join("|");
}

/** Collapse duplicate planning rows that were saved with different ids but the same window. */
export function dedupePlanningPeople<T extends ChronologicalPerson>(people: readonly T[]): T[] {
  const seen = new Set<string>();
  const next: T[] = [];
  for (const person of people) {
    if (!isPlanningPerson(person)) {
      next.push(person);
      continue;
    }
    const fingerprint = planningFingerprint(person);
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    next.push(person);
  }
  return next;
}

function resolveParticipantType(
  person: ChronologicalPerson,
): ChronologicalParticipantType {
  if (person.isRequester) return "requester";
  if (isPlanningPerson(person)) return "planning";
  if (isBufferPerson(person)) return "buffer";
  if (person.participantType === "model") return "model";
  return "guest";
}

function resolveBlockTitle(
  person: ChronologicalPerson,
  participantType: ChronologicalParticipantType,
  modelOrdinal: number,
): string {
  if (participantType === "planning") return "Planning Details";
  if (participantType === "buffer") {
    const trimmed = person.name.trim();
    return trimmed ? `Buffer: ${trimmed}` : "Buffer";
  }
  if (participantType === "model") {
    const trimmed = person.name.trim();
    if (trimmed && trimmed.toLowerCase() !== "model") return trimmed;
    return `Model ${modelOrdinal}`;
  }
  if (participantType === "guest") {
    const trimmed = person.name.trim();
    if (trimmed && trimmed.toLowerCase() !== "guest") return trimmed;
    return "Guest";
  }
  return person.name.trim() || "Client";
}

function resolvePlanningWindow(person: ChronologicalPerson, fallbackStart?: string) {
  const durationMins = parseDurationMinsLabel(person.planningDuration) ?? 0;
  const startTime =
    person.planningStartTime?.trim() ||
    person.bufferStartTime?.trim() ||
    fallbackStart?.trim() ||
    "";
  if (!startTime) return null;
  const endTime =
    person.planningEndTime?.trim() ||
    person.bufferEndTime?.trim() ||
    addMinutesToTime(startTime, durationMins > 0 ? durationMins : 60);
  if (!endTime) return null;
  return { startTime, endTime };
}

function compareTimedEntries<T extends ChronologicalServiceLine>(
  a: ChronologicalTimedEntry<T>,
  b: ChronologicalTimedEntry<T>,
) {
  const startDiff =
    minutesSinceMidnight(a.startTime) - minutesSinceMidnight(b.startTime);
  if (startDiff !== 0) return startDiff;
  if (a.participantId !== b.participantId) {
    return a.participantId.localeCompare(b.participantId);
  }
  return a.id.localeCompare(b.id);
}

function resolveLineTeamMemberId<T extends ChronologicalServiceLine>(item: T) {
  return item.staffResourceId?.trim() || item.teamMemberId?.trim() || undefined;
}

function teamMemberChipLabelForItems<T extends ChronologicalServiceLine>(
  items: readonly T[],
  teamMemberNameById: ReadonlyMap<string, string>,
) {
  const ids = [
    ...new Set(
      items
        .map((item) => item.teamMemberId ?? item.staffResourceId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (ids.length !== 1) return undefined;
  const fullName = teamMemberNameById.get(ids[0]);
  if (!fullName) return undefined;
  return fullName.split(/\s+/)[0];
}

function groupTimedEntriesIntoBlocks<T extends ChronologicalServiceLine>(
  entries: readonly ChronologicalTimedEntry<T>[],
  peopleById: ReadonlyMap<string, ChronologicalPerson>,
  teamMemberNameById: ReadonlyMap<string, string>,
): ChronologicalBlock<T>[] {
  if (!entries.length) return [];

  const sorted = [...entries].sort(compareTimedEntries);
  const blocks: ChronologicalBlock<T>[] = [];
  let modelOrdinal = 0;

  for (const entry of sorted) {
    const person = peopleById.get(entry.participantId);
    const participantType = entry.participantType;
    if (participantType === "model") modelOrdinal += 1;

    const last = blocks[blocks.length - 1];
    const canMerge =
      last &&
      last.participantId === entry.participantId &&
      last.endTime === entry.startTime &&
      entry.kind === "service" &&
      last.items.length > 0;

    if (canMerge && entry.service) {
      last.items.push(entry.service);
      last.endTime = entry.endTime;
      last.teamMemberLabel = teamMemberChipLabelForItems(
        last.items,
        teamMemberNameById,
      );
      last.teamMemberId = resolveLineTeamMemberId(last.items[0] ?? entry.service);
      continue;
    }

    const title = person
      ? resolveBlockTitle(person, participantType, modelOrdinal)
      : entry.participantId;

    blocks.push({
      key: `${entry.participantId}::${blocks.length}`,
      blockIndex: blocks.length,
      participantId: entry.participantId,
      participantType,
      title,
      isRequester: Boolean(person?.isRequester),
      startTime: entry.startTime,
      endTime: entry.endTime,
      items: entry.service ? [entry.service] : [],
      ...(entry.kind === "planning" || entry.kind === "buffer"
        ? {
            planningItem: {
              activity: entry.planningActivity?.trim() ?? "",
              duration: entry.planningDuration?.trim() ?? "",
            },
          }
        : {}),
      teamMemberLabel: entry.service
        ? teamMemberChipLabelForItems([entry.service], teamMemberNameById)
        : entry.teamMemberId
          ? teamMemberNameById.get(entry.teamMemberId)?.split(/\s+/)[0]
          : undefined,
      teamMemberId: entry.service
        ? resolveLineTeamMemberId(entry.service)
        : entry.teamMemberId,
    });
  }

  return blocks;
}

function sortBlockItemsByStartTime<T extends ChronologicalServiceLine>(items: T[]) {
  return [...items].sort((a, b) => {
    const aStart = a.startTime?.trim();
    const bStart = b.startTime?.trim();
    if (!aStart && !bStart) return a.id.localeCompare(b.id);
    if (!aStart) return 1;
    if (!bStart) return -1;
    const diff = minutesSinceMidnight(aStart) - minutesSinceMidnight(bStart);
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Drawer / payment-summary grouping: one card per person with every service
 * that belongs to them. Calendar timeline still uses time-sliced blocks.
 */
function collapsePersonBlocks<T extends ChronologicalServiceLine>(
  blocks: readonly ChronologicalBlock<T>[],
  teamMemberNameById: ReadonlyMap<string, string>,
): ChronologicalBlock<T>[] {
  if (blocks.length <= 1) return [...blocks];

  const collapsed: ChronologicalBlock<T>[] = [];
  const indexByParticipant = new Map<string, number>();

  for (const block of blocks) {
    const keepSeparate =
      block.participantType === "planning" ||
      block.participantType === "buffer";
    if (keepSeparate) {
      collapsed.push({
        ...block,
        items: [...block.items],
        key: `${block.participantId}::${collapsed.length}`,
        blockIndex: collapsed.length,
      });
      continue;
    }

    const existingIndex = indexByParticipant.get(block.participantId);
    if (existingIndex == null) {
      indexByParticipant.set(block.participantId, collapsed.length);
      collapsed.push({
        ...block,
        items: [...block.items],
        key: `${block.participantId}::${collapsed.length}`,
        blockIndex: collapsed.length,
      });
      continue;
    }

    const existing = collapsed[existingIndex];
    existing.items.push(...block.items);
    if (
      minutesSinceMidnight(block.startTime) <
      minutesSinceMidnight(existing.startTime)
    ) {
      existing.startTime = block.startTime;
    }
    if (
      minutesSinceMidnight(block.endTime) >
      minutesSinceMidnight(existing.endTime)
    ) {
      existing.endTime = block.endTime;
    }
  }

  return collapsed.map((block, index) => {
    const items = sortBlockItemsByStartTime(block.items);
    return {
      ...block,
      key: `${block.participantId}::${index}`,
      blockIndex: index,
      items,
      teamMemberLabel: teamMemberChipLabelForItems(items, teamMemberNameById),
      teamMemberId: items[0]
        ? resolveLineTeamMemberId(items[0])
        : block.teamMemberId,
    };
  });
}

export type BuildChronologicalBlocksInput<T extends ChronologicalServiceLine> = {
  bookingStart?: string;
  requesterPerson: ChronologicalPerson;
  mainServices: readonly T[];
  guests?: ReadonlyArray<{
    person: ChronologicalPerson;
    services: readonly T[];
  }>;
  teamMembers?: ReadonlyArray<{ id: string; name: string }>;
};

function resolveTimedServices<T extends ChronologicalServiceLine>(
  services: readonly T[],
  participantId: string,
  participantType: ChronologicalParticipantType,
  bookingStart?: string,
): ChronologicalTimedEntry<T>[] {
  const timed = ensureServiceStartEndTimes(services, bookingStart);

  return timed
    .filter((service) => service.startTime?.trim() && service.endTime?.trim())
    .map((service) => ({
      id: service.id,
      participantId,
      participantType,
      startTime: service.startTime!.trim(),
      endTime: service.endTime!.trim(),
      kind: "service" as const,
      service,
      teamMemberId: resolveLineTeamMemberId(service),
    }));
}

export function buildChronologicalBlocks<T extends ChronologicalServiceLine>(
  input: BuildChronologicalBlocksInput<T>,
): ChronologicalBlock<T>[] {
  const {
    bookingStart,
    requesterPerson,
    mainServices,
    guests = [],
    teamMembers = [],
  } = input;

  const peopleById = new Map<string, ChronologicalPerson>();
  peopleById.set(requesterPerson.id, requesterPerson);
  for (const guest of guests) peopleById.set(guest.person.id, guest.person);

  const teamMemberNameById = new Map(
    teamMembers.map((member) => [member.id, member.name]),
  );

  const entries: ChronologicalTimedEntry<T>[] = [
    ...resolveTimedServices(
      mainServices,
      requesterPerson.id,
      "requester",
      bookingStart,
    ),
  ];

  let cursor =
    getLatestEntryEnd(entries) || bookingStart?.trim() || "";

  for (const guest of guests) {
    const participantType = resolveParticipantType(guest.person);
    if (participantType === "planning" || participantType === "buffer") {
      const window = resolvePlanningWindow(guest.person, cursor || bookingStart);
      if (window) {
        entries.push({
          id: `${guest.person.id}::${participantType}`,
          participantId: guest.person.id,
          participantType,
          startTime: window.startTime,
          endTime: window.endTime,
          kind: participantType,
          planningActivity: guest.person.planningActivity,
          planningDuration: guest.person.planningDuration,
          teamMemberId: guest.person.bufferTeamMemberId,
        });
        cursor = window.endTime;
      }
      continue;
    }

    const guestEntries = resolveTimedServices(
      guest.services,
      guest.person.id,
      participantType,
      cursor || bookingStart,
    );
    entries.push(...guestEntries);
    cursor = getLatestEntryEnd(guestEntries) || cursor;
  }

  return groupTimedEntriesIntoBlocks(entries, peopleById, teamMemberNameById);
}

function getLatestEntryEnd<T extends ChronologicalServiceLine>(
  entries: readonly ChronologicalTimedEntry<T>[],
) {
  let latest = "";
  let latestMin = -1;
  for (const entry of entries) {
    const mins = minutesSinceMidnight(entry.endTime);
    if (mins >= latestMin) {
      latestMin = mins;
      latest = entry.endTime;
    }
  }
  return latest;
}

export type BuildClientDraftChronologicalBlocksInput = {
  bookingStart?: string;
  combineServices?: boolean;
  people: readonly ChronologicalPerson[];
  services: readonly ClientBookingDraftService[];
  teamMembers?: ReadonlyArray<{ id: string; name: string }>;
  productGuestIds?: ReadonlySet<string>;
};

/** Client booking drafts often lack explicit times — infer sequentially in people order. */
export function buildClientDraftChronologicalBlocks(
  input: BuildClientDraftChronologicalBlocksInput,
): ChronologicalBlock<ClientBookingDraftService>[] {
  const {
    bookingStart,
    combineServices = false,
    people,
    services,
    teamMembers = [],
    productGuestIds = new Set<string>(),
  } = input;
  if (
    !services.length &&
    !people.some((p) => isPlanningPerson(p) || isBufferPerson(p)) &&
    productGuestIds.size === 0
  ) {
    return [];
  }

  const requesterPerson =
    people.find((person) => person.isRequester) ?? people[0] ?? {
      id: "requester",
      name: "Client",
      isRequester: true,
    };

  const peopleList: ChronologicalPerson[] = sortByCanonicalBookingOrder(
    dedupePlanningPeople(people),
    (person) =>
      person.isRequester ? "requester" : resolveParticipantType(person),
  );
  const knownIds = new Set(peopleList.map((person) => person.id));
  const addOrphanPerson = (id: string) => {
    if (!id || id === "unassigned" || knownIds.has(id) || id === requesterPerson.id) {
      return;
    }
    knownIds.add(id);
    peopleList.push({ id, name: "Guest", participantType: "guest" });
  };
  for (const service of services) {
    addOrphanPerson(String(service.guestId ?? service.assignedTo ?? "").trim());
  }
  for (const guestId of productGuestIds) {
    addOrphanPerson(String(guestId).trim());
  }
  if (!peopleList.some((person) => person.id === requesterPerson.id)) {
    peopleList.unshift(requesterPerson);
  }
  peopleList.sort(
    (a, b) =>
      canonicalParticipantRank(
        a.isRequester ? "requester" : resolveParticipantType(a),
      ) -
      canonicalParticipantRank(
        b.isRequester ? "requester" : resolveParticipantType(b),
      ),
  );

  const serviceGroups = new Map<string, ClientBookingDraftService[]>();
  for (const service of services) {
    const key = service.guestId ?? service.assignedTo ?? requesterPerson.id;
    const prev = serviceGroups.get(key) ?? [];
    prev.push(service);
    serviceGroups.set(key, prev);
  }

  const unassigned = serviceGroups.get("unassigned");
  if (unassigned?.length) {
    const requesterItems = serviceGroups.get(requesterPerson.id) ?? [];
    serviceGroups.set(requesterPerson.id, [...requesterItems, ...unassigned]);
    serviceGroups.delete("unassigned");
  }

  let cursor = bookingStart?.trim() || "08:00";
  const entries: ChronologicalTimedEntry<ClientBookingDraftService>[] = [];

  for (const person of peopleList) {
    if (isNotesPerson(person)) continue;

    const participantType = resolveParticipantType(person);
    if (participantType === "planning" || participantType === "buffer") {
      const window = resolvePlanningWindow(person, cursor);
      if (window) {
        entries.push({
          id: `${person.id}::${participantType}`,
          participantId: person.id,
          participantType,
          startTime: window.startTime,
          endTime: window.endTime,
          kind: participantType,
          planningActivity: person.planningActivity,
          planningDuration: person.planningDuration,
          teamMemberId: person.bufferTeamMemberId,
        });
        cursor = window.endTime;
      }
      continue;
    }

    const items = serviceGroups.get(person.id) ?? [];
    const hasProducts = productGuestIds.has(person.id);
    if (!items.length && !hasProducts) continue;

    if (!items.length && hasProducts) {
      const startTime = cursor;
      const endTime = addMinutesToTime(startTime, 15);
      entries.push({
        id: `${person.id}::products`,
        participantId: person.id,
        participantType,
        startTime,
        endTime,
        kind: "service",
      });
      continue;
    }

    if (combineServices && person.isRequester) {
      const totalDuration = items.reduce(
        (sum, item) => sum + (item.durationMins || 0),
        0,
      );
      const startTime = cursor;
      const endTime = addMinutesToTime(startTime, totalDuration || 60);
      for (const service of items) {
        entries.push({
          id: service.id,
          participantId: person.id,
          participantType,
          startTime,
          endTime,
          kind: "service",
          service,
        });
      }
      cursor = endTime;
      continue;
    }

    for (const service of items) {
      const startTime = cursor;
      const endTime = addMinutesToTime(
        startTime,
        service.durationMins > 0 ? service.durationMins : 60,
      );
      entries.push({
        id: service.id,
        participantId: person.id,
        participantType,
        startTime,
        endTime,
        kind: "service",
        service,
      });
      cursor = endTime;
    }
  }

  const peopleById = new Map(peopleList.map((person) => [person.id, person]));
  const teamMemberNameById = new Map(
    teamMembers.map((member) => [member.id, member.name]),
  );

  const sortedEntries = [...entries].sort(compareTimedEntries);
  return sortByCanonicalBookingOrder(
    collapsePersonBlocks(
      groupTimedEntriesIntoBlocks(sortedEntries, peopleById, teamMemberNameById),
      teamMemberNameById,
    ),
    (block) => block.participantType,
  );
}

export type DrawerChronologicalBlock = {
  key: string;
  blockIndex: number;
  participantId: string;
  participantType: ChronologicalParticipantType;
  isMainClient: boolean;
  guestId?: string;
  services: BookingServiceLineItem[];
  planningItem?: { activity: string; duration: string };
  startTime: string;
  endTime: string;
};

/** Split a person's chronological blocks so products can attach to the earliest only. */
export function splitParticipantDrawerBlocks(
  blocks: readonly DrawerChronologicalBlock[],
  participantId: string,
): {
  first: DrawerChronologicalBlock | undefined;
  rest: DrawerChronologicalBlock[];
} {
  const matches = blocks.filter(
    (block) => block.participantId === participantId,
  );
  return { first: matches[0], rest: matches.slice(1) };
}

export function buildDrawerChronologicalBlocks(input: {
  bookingStart?: string;
  requesterPerson: ChronologicalPerson;
  mainServices: readonly BookingServiceLineItem[];
  guests: readonly CalendarBookingGuestItem[];
  teamMembers?: ReadonlyArray<{ id: string; name: string }>;
}): DrawerChronologicalBlock[] {
  const teamMemberNameById = new Map(
    (input.teamMembers ?? []).map((member) => [member.id, member.name]),
  );
  const blocks = collapsePersonBlocks(
    buildChronologicalBlocks({
      bookingStart: input.bookingStart,
      requesterPerson: input.requesterPerson,
      mainServices: input.mainServices,
      guests: input.guests.map((guest) => ({
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
      })),
      teamMembers: input.teamMembers,
    }),
    teamMemberNameById,
  );

  return blocks.map((block) => ({
    key: block.key,
    blockIndex: block.blockIndex,
    participantId: block.participantId,
    participantType: block.participantType,
    isMainClient: block.isRequester,
    guestId: block.isRequester ? undefined : block.participantId,
    services: block.items as BookingServiceLineItem[],
    planningItem: block.planningItem,
    startTime: block.startTime,
    endTime: block.endTime,
  }));
}

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
  const name = value?.trim();
  if (!name) return "";
  return name.split(/\s+/)[0] ?? "";
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

/** One calendar card per chronological participant block. Shared only when 2+ members. */
export function calendarEventToDisplaySegments(
  event: CalendarEvent,
  nameById: ReadonlyMap<string, string> = new Map(),
): CalendarEvent[] {
  const slots = collectAssignedTeamMemberSlots(event);
  const teamIds = slots.map((slot) => slot.id);
  const names = resolveTeamMemberNames(teamIds, event, nameById);
  const teamShared = teamIds.length > 1;

  return expandCalendarEventToChronologicalSegments(event).map((segment) =>
    calendarSegmentToDisplayEvent(segment, event, {
      teamShared,
      sharedTeamMemberNames: names,
    }),
  );
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
