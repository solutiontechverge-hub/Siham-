import { buildClientDraftChronologicalBlocks } from "../../../data/bookingChronologicalBlocks";
import type { ClientBookingDraft, ClientBookingSummarySection } from "./types";

export function buildBookingSummarySections(
  draft: ClientBookingDraft | null,
): ClientBookingSummarySection[] {
  if (!draft?.services?.length && !draft?.people?.some(
    (person) =>
      person.participantType === "planning" ||
      person.participantType === "buffer" ||
      Boolean(person.planningActivity?.trim() || person.planningDuration?.trim()),
  )) {
    return [];
  }

  const people = draft.people ?? [];
  const requesterPerson =
    people.find((person) => person.isRequester) ??
    people[0] ?? {
      id: "requester",
      name: "Client",
      isRequester: true,
    };

  const blocks = buildClientDraftChronologicalBlocks({
    bookingStart: draft.selectedTime,
    combineServices: draft.combineServices,
    people: people.length
      ? people
      : [{ ...requesterPerson, isRequester: true }],
    services: draft.services ?? [],
    teamMembers: draft.teamMembers,
  });

  return blocks.map((block) => ({
    key: block.key,
    title: block.title,
    items: block.items,
    planningItem: block.planningItem,
    teamMemberLabel: block.teamMemberLabel,
    isRequester: block.isRequester,
    participantType:
      block.participantType === "requester" ? "requester" : block.participantType,
    startTime: block.startTime,
    endTime: block.endTime,
  }));
}

export function resolveTeamMemberFirstName(
  teamMemberId: string | null | undefined,
  teamMembers: ClientBookingDraft["teamMembers"],
): string | undefined {
  if (!teamMemberId) return undefined;
  const fullName = teamMembers?.find((tm) => tm.id === teamMemberId)?.name;
  if (!fullName) return undefined;
  return fullName.split(/\s+/)[0];
}
