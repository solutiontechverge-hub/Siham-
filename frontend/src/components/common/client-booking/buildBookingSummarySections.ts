import { buildClientDraftChronologicalBlocks } from "../../../data/bookingChronologicalBlocks";
import type {
  ClientBookingDraft,
  ClientBookingDraftTeamMember,
  ClientBookingSummarySection,
} from "./types";

export function mergeBookingTeamMembers(
  ...lists: Array<
    ReadonlyArray<{ id?: string | null; name?: string | null }> | null | undefined
  >
): ClientBookingDraftTeamMember[] {
  const map = new Map<string, string>();
  for (const list of lists) {
    for (const member of list ?? []) {
      const id = String(member.id ?? "").trim();
      if (!id) continue;
      const name = String(member.name ?? "").trim();
      if (name) map.set(id, name);
      else if (!map.has(id)) map.set(id, "Team member");
    }
  }
  return [...map.entries()].map(([id, name]) => ({ id, name }));
}

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
  fallbackName?: string | null,
): string | undefined {
  const id = String(teamMemberId ?? "").trim();
  const fullName =
    (id
      ? teamMembers?.find((tm) => String(tm.id) === id)?.name
      : undefined) || fallbackName?.trim() || undefined;
  if (!fullName) return undefined;
  return fullName.split(/\s+/)[0];
}
