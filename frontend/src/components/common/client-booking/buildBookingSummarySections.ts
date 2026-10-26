import {
  buildClientDraftChronologicalBlocks,
} from "../../../data/bookingChronologicalBlocks";
import { parseDurationMinsLabel } from "../../../data/bookingServiceEdit.data";
import { fmtMinutesToTimeLabel } from "../../../app/clients/booking/booking-time";
import { parseClockToMinutes } from "../calendar/calendar.utils";
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
  const people = (draft?.people ?? []).filter(
    (person) =>
      person.participantType !== "notes" &&
      person.id !== "p-notes",
  );
  const productGuestIds = new Set(
    (draft?.products ?? [])
      .map((product) => String(product.guestId ?? "").trim())
      .filter(Boolean),
  );
  const hasRequesterCatalog = (draft?.products ?? []).some(
    (product) => !String(product.guestId ?? "").trim(),
  );
  if (
    !draft?.services?.length &&
    !people.some(
      (person) =>
        person.participantType === "planning" ||
        person.participantType === "buffer" ||
        Boolean(person.planningActivity?.trim() || person.planningDuration?.trim()),
    ) &&
    productGuestIds.size === 0 &&
    !hasRequesterCatalog
  ) {
    return [];
  }

  const requesterPerson =
    people.find((person) => person.isRequester) ??
    people[0] ?? {
      id: "requester",
      name: "Client",
      isRequester: true,
    };
  if (hasRequesterCatalog) productGuestIds.add(requesterPerson.id);

  const blocks = buildClientDraftChronologicalBlocks({
    bookingStart: draft?.selectedTime,
    combineServices: draft?.combineServices,
    people: people.length
      ? people
      : [{ ...requesterPerson, isRequester: true }],
    services: draft?.services ?? [],
    teamMembers: draft?.teamMembers,
    productGuestIds,
  });

  // Client-facing summaries only — pro calendar/drawer still shows buffers.
  return blocks
    .filter((block) => block.participantType !== "buffer")
    .map((block) => ({
      key: block.key,
      title: block.title,
      items: block.items,
      planningItem: block.planningItem,
      teamMemberLabel: block.teamMemberLabel,
      isRequester: block.isRequester,
      participantType:
        block.participantType === "requester"
          ? "requester"
          : block.participantType,
      startTime: block.startTime,
      endTime: block.endTime,
      participantId: block.participantId,
    }));
}

/** Full professional-set TM name (API `full_name` / draft name) — not first-name-only. */
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
  return fullName || undefined;
}

/** Role label above a person card (Client / Model 2 / Guest). */
export function participantRoleHeading(
  participantType:
    | ClientBookingSummarySection["participantType"]
    | "requester",
  ordinal?: { index?: number; total?: number },
): string {
  if (participantType === "requester") return "Client";
  return bookingParticipantDisplayHeading(
    {
      participantType,
      isRequester: false,
      title: "",
    },
    ordinal,
  );
}

/** Guest / Model / Planning headings on booking details (dynamic ordinals). */
export function bookingParticipantDisplayHeading(
  section: Pick<
    ClientBookingSummarySection,
    "participantType" | "isRequester" | "title"
  >,
  ordinal?: { index?: number; total?: number },
): string {
  if (section.isRequester || section.participantType === "requester") {
    return section.title;
  }
  if (section.participantType === "planning") return "Planning Details";
  if (section.participantType === "buffer") {
    return (ordinal?.total ?? 1) > 1 && ordinal?.index
      ? `Buffer ${ordinal.index}`
      : "Buffer";
  }
  if (section.participantType === "guest") {
    return (ordinal?.total ?? 1) > 1 && ordinal?.index
      ? `Guest ${ordinal.index}`
      : "Guest";
  }
  if (section.participantType === "model") {
    return (ordinal?.total ?? 1) > 1 && ordinal?.index
      ? `Model ${ordinal.index}`
      : "Model";
  }
  return section.title;
}

export function planningScheduleMeta(section: {
  startTime?: string;
  endTime?: string;
  planningItem?: { activity: string; duration: string };
}): { timeRange?: string; durationLabel?: string } {
  const startMins = section.startTime
    ? parseClockToMinutes(section.startTime)
    : null;
  const endMins = section.endTime ? parseClockToMinutes(section.endTime) : null;
  const timeRange =
    startMins == null
      ? undefined
      : endMins == null
        ? fmtMinutesToTimeLabel(startMins)
        : `${fmtMinutesToTimeLabel(startMins)}–${fmtMinutesToTimeLabel(endMins)}`;
  // Clock range wins when both ends exist (avoids "9:00–9:35 • 18 Mins").
  const durationMins =
    startMins != null && endMins != null && endMins > startMins
      ? endMins - startMins
      : parseDurationMinsLabel(section.planningItem?.duration);
  const durationLabel =
    durationMins && durationMins > 0
      ? `${durationMins} Mins`
      : section.planningItem?.duration?.trim() || undefined;
  return { timeRange, durationLabel };
}

export function participantOrdinals(
  sections: ReadonlyArray<
    Pick<ClientBookingSummarySection, "participantType" | "participantId" | "key">
  >,
) {
  const guestIds: string[] = [];
  const modelIds: string[] = [];
  const bufferIds: string[] = [];
  for (const section of sections) {
    const id = section.participantId || section.key;
    if (section.participantType === "guest" && !guestIds.includes(id)) {
      guestIds.push(id);
    }
    if (section.participantType === "model" && !modelIds.includes(id)) {
      modelIds.push(id);
    }
    if (section.participantType === "buffer" && !bufferIds.includes(id)) {
      bufferIds.push(id);
    }
  }
  return {
    guestTotal: guestIds.length,
    modelTotal: modelIds.length,
    bufferTotal: bufferIds.length,
    guestIndex: (section: (typeof sections)[number]) => {
      const id = section.participantId || section.key;
      return guestIds.indexOf(id) + 1;
    },
    modelIndex: (section: (typeof sections)[number]) => {
      const id = section.participantId || section.key;
      return modelIds.indexOf(id) + 1;
    },
    bufferIndex: (section: (typeof sections)[number]) => {
      const id = section.participantId || section.key;
      return bufferIds.indexOf(id) + 1;
    },
  };
}

export function participantHeadingOrdinal(
  section: Pick<
    ClientBookingSummarySection,
    "participantType" | "participantId" | "key"
  >,
  ordinals: ReturnType<typeof participantOrdinals>,
) {
  if (section.participantType === "guest") {
    return { index: ordinals.guestIndex(section), total: ordinals.guestTotal };
  }
  if (section.participantType === "model") {
    return { index: ordinals.modelIndex(section), total: ordinals.modelTotal };
  }
  if (section.participantType === "buffer") {
    return { index: ordinals.bufferIndex(section), total: ordinals.bufferTotal };
  }
  return undefined;
}
