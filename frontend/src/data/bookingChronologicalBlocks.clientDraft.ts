import type { ClientBookingDraftService } from "../components/common/client-booking/types";
import { addMinutesToTime } from "./bookingServiceEdit.data";
import {
  isPlanningPerson,
  isBufferPerson,
  isNotesPerson,
  isExtraBookingParticipant,
  extraBookingParticipantIds,
  resolveBookingLineOwnerId,
  dedupeServicesByOwner,
  canonicalParticipantRank,
  sortByCanonicalBookingOrder,
  dedupePlanningPeople,
  type ChronologicalPerson,
  type ChronologicalTimedEntry,
  type ChronologicalBlock,
} from "./bookingChronologicalBlocks.participants";
import {
  collapsePersonBlocks,
  compareTimedEntries,
  groupTimedEntriesIntoBlocks,
  resolveParticipantType,
  resolvePlanningWindow,
} from "./bookingChronologicalBlocks.group";

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
    teamMembers = [],
    productGuestIds = new Set<string>(),
  } = input;
  if (
    !input.services.length &&
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
  const extraIds = extraBookingParticipantIds(peopleList);
  const services = dedupeServicesByOwner(input.services, extraIds);
  const knownIds = new Set(peopleList.map((person) => person.id));
  const addOrphanPerson = (id: string) => {
    if (!id || id === "unassigned" || knownIds.has(id) || id === requesterPerson.id) {
      return;
    }
    if (!extraIds.has(id)) return;
    knownIds.add(id);
    peopleList.push({ id, name: "Guest", participantType: "guest" });
  };
  for (const service of services) {
    const ownerId = resolveBookingLineOwnerId(
      service.guestId,
      requesterPerson.id,
      extraIds,
      service.assignedTo,
    );
    if (ownerId !== requesterPerson.id) addOrphanPerson(ownerId);
  }
  for (const guestId of productGuestIds) {
    const ownerId = resolveBookingLineOwnerId(guestId, requesterPerson.id, extraIds);
    if (ownerId !== requesterPerson.id) addOrphanPerson(ownerId);
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
    const key = resolveBookingLineOwnerId(
      service.guestId,
      requesterPerson.id,
      extraIds,
      service.assignedTo,
    );
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
    const hasProducts = [...productGuestIds].some(
      (guestId) =>
        resolveBookingLineOwnerId(guestId, requesterPerson.id, extraIds) ===
        person.id,
    );
    if (!items.length && !hasProducts) {
      // Show empty Model/Guest cards only for real extras (not company contacts).
      if (
        isExtraBookingParticipant(person) &&
        (participantType === "model" || participantType === "guest")
      ) {
        const startTime = cursor;
        entries.push({
          id: `${person.id}::identity`,
          participantId: person.id,
          participantType,
          startTime,
          endTime: startTime,
          kind: "service",
        });
      }
      continue;
    }

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
