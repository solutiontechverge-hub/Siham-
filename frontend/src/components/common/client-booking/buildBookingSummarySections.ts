import type { ClientBookingDraft, ClientBookingDraftPerson, ClientBookingSummarySection } from "./types";

function isPlanningPerson(p: ClientBookingDraftPerson) {
  return p.participantType === "planning" || p.name === "Planning";
}

export function buildBookingSummarySections(draft: ClientBookingDraft | null): ClientBookingSummarySection[] {
  if (!draft?.services?.length) return [];

  const serviceGroups = new Map<string, ClientBookingDraft["services"]>();
  for (const s of draft.services) {
    const key = s.guestId ?? s.assignedTo ?? "unassigned";
    const prev = serviceGroups.get(key) ?? [];
    prev.push(s);
    serviceGroups.set(key, prev);
  }

  const teamMemberNameById = new Map<string, string>();
  for (const tm of draft.teamMembers ?? []) teamMemberNameById.set(tm.id, tm.name);

  const teamMemberChipLabelForItems = (items: ClientBookingDraft["services"]) => {
    const ids = [...new Set(items.map((s) => s.teamMemberId).filter((id): id is string => Boolean(id)))];
    if (ids.length !== 1) return undefined;
    const fullName = teamMemberNameById.get(ids[0]);
    if (!fullName) return undefined;
    return fullName.split(/\s+/)[0];
  };

  const assigneeTitle = (assigneeId: string, people: ClientBookingDraftPerson[]) => {
    const person = people.find((p) => p.id === assigneeId);
    if (person?.name) return person.name;
    if (assigneeId === "unassigned") return "Unassigned";
    return "Guest";
  };

  const people = draft.people ?? [];
  if (people.length) {
    const requesterPerson = people.find((p) => p.isRequester) ?? people[0];
    const unassigned = serviceGroups.get("unassigned");
    if (unassigned?.length && requesterPerson) {
      const requesterItems = serviceGroups.get(requesterPerson.id) ?? [];
      serviceGroups.set(requesterPerson.id, [...requesterItems, ...unassigned]);
      serviceGroups.delete("unassigned");
    }

    const sections: ClientBookingSummarySection[] = [];
    for (const p of people) {
      const items = serviceGroups.get(p.id) ?? [];
      const planningItem =
        isPlanningPerson(p) && p.planningIsLocked
          ? {
              activity: p.planningActivity?.trim() ?? "",
              duration: p.planningDuration?.trim() ?? "",
            }
          : undefined;
      const hasPlanning = Boolean(planningItem?.activity || planningItem?.duration);
      if (!items.length && !hasPlanning) continue;
      sections.push({
        key: p.id,
        title: p.name,
        items,
        isRequester: Boolean(p.isRequester),
        teamMemberLabel: teamMemberChipLabelForItems(items),
        ...(hasPlanning ? { planningItem } : {}),
      });
    }
    return sections;
  }

  // No guests/clients on the draft — treat all services as the main requester (not Guest:Unassigned).
  return [...serviceGroups.entries()].map(([key, items]) => ({
    key,
    title: key === "unassigned" ? "Unassigned" : assigneeTitle(key, people),
    items,
    isRequester: true,
    teamMemberLabel: teamMemberChipLabelForItems(items),
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
