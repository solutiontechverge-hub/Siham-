import type {
  ClientBookingDraft,
  ClientBookingDraftPerson,
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
  for (const tm of draft.teamMembers ?? []) {
    teamMemberNameById.set(String(tm.id), tm.name);
  }

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
    let modelOrdinal = 0;
    for (const p of people) {
      const items = serviceGroups.get(p.id) ?? [];
      const planningItem =
        isPlanningPerson(p) && (p.planningIsLocked || Boolean(p.planningActivity || p.planningDuration))
          ? {
              activity: p.planningActivity?.trim() ?? "",
              duration: p.planningDuration?.trim() ?? "",
            }
          : undefined;
      const hasPlanning = Boolean(planningItem?.activity || planningItem?.duration);
      if (p.participantType === "notes" || p.id === "p-notes") continue;
      if (!items.length && !hasPlanning) continue;

      const participantType: ClientBookingSummarySection["participantType"] = p.isRequester
        ? "requester"
        : isPlanningPerson(p)
          ? "planning"
          : p.participantType === "model"
            ? "model"
            : "guest";

      let title = p.name;
      if (participantType === "model") {
        modelOrdinal += 1;
        title = p.name.trim() && p.name.trim().toLowerCase() !== "model" ? p.name : `Model ${modelOrdinal}`;
      } else if (participantType === "planning") {
        title = "Planning Details";
      } else if (participantType === "guest") {
        title = p.name.trim() && p.name.trim().toLowerCase() !== "guest" ? p.name : "Guest";
      }

      sections.push({
        key: p.id,
        title,
        items,
        isRequester: Boolean(p.isRequester),
        participantType,
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
