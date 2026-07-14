import type { ClientBookingDraft } from "../../../components/common/client-booking/types";
import type { ClientBookingRecord } from "./clientBookingRecords";

const DRAFT_SNAPSHOT_KEY = "mollure:booking_draft_snapshots_v1";

type DraftSnapshot = {
  people?: ClientBookingDraft["people"];
  services?: ClientBookingDraft["services"];
  projectDetails?: ClientBookingDraft["projectDetails"];
  teamMembers?: ClientBookingDraft["teamMembers"];
  total?: number;
  selectedDateISO?: string;
  selectedTime?: string;
  combineServices?: boolean;
};

type SnapshotStore = Record<string, DraftSnapshot>;

function readStore(): SnapshotStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DRAFT_SNAPSHOT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SnapshotStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: SnapshotStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_SNAPSHOT_KEY, JSON.stringify(store));
  } catch {
    // Quota / private mode — ignore.
  }
}

function keysForRecord(record: Pick<ClientBookingRecord, "id" | "apiBookingId" | "bookingRef">) {
  return [record.bookingRef, record.apiBookingId, record.id]
    .map((value) => String(value ?? "").replace(/^#/, "").trim())
    .filter(Boolean);
}

function toSnapshot(draft: ClientBookingDraft): DraftSnapshot {
  return {
    people: draft.people,
    services: draft.services,
    projectDetails: draft.projectDetails
      ? {
          description: draft.projectDetails.description ?? "",
          // Keep previewUrl when present so same-browser reopen can still show thumbnails.
          uploads: (draft.projectDetails.uploads ?? []).map((u) => ({
            id: u.id,
            name: u.name,
            previewUrl: u.previewUrl,
          })),
        }
      : undefined,
    teamMembers: draft.teamMembers,
    total: draft.total,
    selectedDateISO: draft.selectedDateISO,
    selectedTime: draft.selectedTime,
    combineServices: draft.combineServices,
  };
}

/** Persist rich Continue-layout draft so list reopen keeps Project / Model / Planning UI. */
export function cacheClientBookingDraftSnapshot(record: ClientBookingRecord) {
  if (!record?.draft) return;
  const keys = keysForRecord(record);
  if (!keys.length) return;
  const store = readStore();
  const snapshot = toSnapshot(record.draft);
  for (const key of keys) store[key] = snapshot;
  writeStore(store);
}

export function getCachedClientBookingDraftSnapshot(
  record: Pick<ClientBookingRecord, "id" | "apiBookingId" | "bookingRef">,
): DraftSnapshot | null {
  const store = readStore();
  for (const key of keysForRecord(record)) {
    if (store[key]) return store[key];
  }
  return null;
}

function hasPeople(draft?: ClientBookingDraft | DraftSnapshot | null) {
  return (draft?.people?.length ?? 0) > 0;
}

function hasProject(draft?: ClientBookingDraft | DraftSnapshot | null) {
  const project = draft?.projectDetails;
  return Boolean(project?.description?.trim()) || (project?.uploads?.length ?? 0) > 0;
}

function servicesHaveGuestIds(draft?: ClientBookingDraft | DraftSnapshot | null) {
  return (draft?.services ?? []).some((s) => Boolean(s.guestId));
}

/**
 * Prefer API draft, but fill missing Project/people/guest assignments from
 * session/local snapshot so Past/Ongoing/Upcoming reopen matches Continue design.
 */
export function mergeClientBookingDraftRichness(
  primary: ClientBookingDraft,
  fallback?: DraftSnapshot | ClientBookingDraft | null,
): ClientBookingDraft {
  if (!fallback) return primary;

  const people = hasPeople(primary) ? primary.people : fallback.people ?? primary.people;
  const projectDetails = hasProject(primary)
    ? primary.projectDetails
    : fallback.projectDetails ?? primary.projectDetails;
  const teamMembers = primary.teamMembers?.length
    ? primary.teamMembers
    : fallback.teamMembers ?? primary.teamMembers;

  let services = primary.services ?? [];
  if (!servicesHaveGuestIds(primary) && (fallback.services?.length ?? 0) > 0) {
    const byId = new Map((fallback.services ?? []).map((s) => [s.id, s]));
    const byName = new Map((fallback.services ?? []).map((s) => [s.name, s]));
    services = services.map((service) => {
      const match = byId.get(service.id) ?? byName.get(service.name);
      return {
        ...service,
        guestId: service.guestId ?? match?.guestId ?? null,
      };
    });
    // If API flattened to fewer rows, keep richer snapshot services when primary has no guest mapping.
    if (!services.some((s) => s.guestId) && fallback.services?.length) {
      services = fallback.services.map((service) => ({
        id: service.id,
        name: service.name,
        durationMins: service.durationMins,
        price: service.price,
        guestId: service.guestId ?? null,
        teamMemberId: service.teamMemberId ?? null,
        isAddOn: service.isAddOn,
      }));
    }
  }

  return {
    ...primary,
    people,
    projectDetails,
    teamMembers,
    services,
  };
}

export function enrichClientBookingRecord(record: ClientBookingRecord): ClientBookingRecord {
  if (!record.draft) return record;
  const cached = getCachedClientBookingDraftSnapshot(record);
  const draft = mergeClientBookingDraftRichness(record.draft, cached);
  return { ...record, draft };
}
