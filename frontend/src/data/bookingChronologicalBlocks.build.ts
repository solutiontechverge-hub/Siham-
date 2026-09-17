import {
  ensureServiceStartEndTimes,
} from "./bookingServiceEdit.data";
import {
  type ChronologicalParticipantType,
  type ChronologicalPerson,
  type ChronologicalServiceLine,
  type ChronologicalTimedEntry,
  type ChronologicalBlock,
} from "./bookingChronologicalBlocks.participants";
import {
  getLatestEntryEnd,
  groupTimedEntriesIntoBlocks,
  resolveParticipantType,
  resolvePlanningWindow,
  collapsePersonBlocks,
} from "./bookingChronologicalBlocks.group";
export {
  resolveParticipantType,
  collapsePersonBlocks,
} from "./bookingChronologicalBlocks.group";
export {
  buildClientDraftChronologicalBlocks,
  type BuildClientDraftChronologicalBlocksInput,
} from "./bookingChronologicalBlocks.clientDraft";

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

function resolveLineTeamMemberId<T extends ChronologicalServiceLine>(item: T) {
  return item.staffResourceId?.trim() || item.teamMemberId?.trim() || undefined;
}

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
