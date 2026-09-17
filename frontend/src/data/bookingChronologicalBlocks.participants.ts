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

export function isPlanningPerson(person: ChronologicalPerson) {
  return person.participantType === "planning" || person.name === "Planning";
}

export function isBufferPerson(person: ChronologicalPerson) {
  if (person.participantType === "buffer") return true;
  const id = String(person.id ?? "").toLowerCase();
  return id === "buffer" || id.startsWith("buffer-") || id.startsWith("p-buffer");
}

export function isNotesPerson(person: ChronologicalPerson) {
  return person.participantType === "notes" || person.id === "p-notes";
}

/**
 * Extra cards (guest / model / planning / buffer). Anyone else — requester,
 * company contact, or untyped person — stays on the main Client section.
 */
export function isExtraBookingParticipant(
  person: Pick<
    ChronologicalPerson,
    "id" | "name" | "isRequester" | "participantType"
  >,
): boolean {
  if (person.isRequester) return false;
  if (isNotesPerson(person)) return false;
  if (isPlanningPerson(person) || isBufferPerson(person)) return true;
  return person.participantType === "model" || person.participantType === "guest";
}

export function extraBookingParticipantIds(
  people: readonly ChronologicalPerson[] | null | undefined,
): Set<string> {
  const ids = new Set<string>();
  for (const person of people ?? []) {
    if (!isExtraBookingParticipant(person)) continue;
    const id = String(person.id ?? "").trim();
    if (id) ids.add(id);
  }
  return ids;
}

/** Map a line's guestId onto requester unless it belongs to an extra participant. */
export function resolveBookingLineOwnerId(
  guestId: string | null | undefined,
  requesterId: string,
  extraIds: ReadonlySet<string>,
  assignedTo?: string | null,
): string {
  const raw = String(guestId ?? assignedTo ?? "").trim();
  if (raw && extraIds.has(raw)) return raw;
  return requesterId;
}

const SERVICE_UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

/** Catalog identity for a line — UUID if present, otherwise the raw id. */
export function catalogServiceIdentity(id: string | null | undefined): string {
  const raw = String(id ?? "").trim();
  if (!raw) return "";
  const match = raw.match(SERVICE_UUID_RE);
  return (match ? match[0] : raw).toLowerCase();
}

export function bookingServiceOwnerKey(
  guestId: string | null | undefined,
  extraIds: ReadonlySet<string>,
  assignedTo?: string | null,
): string {
  const raw = String(guestId ?? assignedTo ?? "").trim();
  if (raw && extraIds.has(raw)) return raw;
  return "";
}

type DedupeServiceLine = {
  id: string;
  name?: string;
  durationMins?: number;
  price?: number;
  guestId?: string | null;
  assignedTo?: string | null;
  startTime?: string;
};

/**
 * One catalog service per owner. Same person + same catalog/name+duration
 * is one line even if guestId or id formatting differs.
 */
export function dedupeServicesByOwner<T extends DedupeServiceLine>(
  services: readonly T[],
  extraIds: ReadonlySet<string>,
): T[] {
  const kept = new Map<string, T>();
  const fingerprintToKey = new Map<string, string>();
  const order: string[] = [];

  for (const service of services) {
    const owner = bookingServiceOwnerKey(
      service.guestId,
      extraIds,
      service.assignedTo,
    );
    const catalog = catalogServiceIdentity(service.id) || String(service.id);
    const catalogKey = `${owner}::id::${catalog}`;
    const fingerprint = `${owner}::fp::${String(service.name ?? "").trim().toLowerCase()}::${Math.round((Number(service.price) || 0) * 100)}`;
    const existingKey = kept.has(catalogKey)
      ? catalogKey
      : fingerprintToKey.get(fingerprint);
    const next: T = { ...service, guestId: owner || null };

    if (existingKey) {
      const existing = kept.get(existingKey);
      if (
        existing &&
        !String(existing.startTime ?? "").trim() &&
        String(next.startTime ?? "").trim()
      ) {
        kept.set(existingKey, next);
      }
      continue;
    }

    kept.set(catalogKey, next);
    if (String(service.name ?? "").trim()) {
      fingerprintToKey.set(fingerprint, catalogKey);
    }
    order.push(catalogKey);
  }

  return order.map((key) => kept.get(key)!);
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

export function planningFingerprint(person: ChronologicalPerson) {
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

