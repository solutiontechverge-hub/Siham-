import type { ClientBookingDraft } from "../../../components/common/client-booking/types";
import type { ClientBookingRecord } from "./clientBookingRecords";
import { liveMediaUrl } from "../../../lib/projectUploadMedia";
import {
  extraBookingParticipantIds,
  dedupeServicesByOwner,
} from "../../../data/bookingChronologicalBlocks";

const DRAFT_SNAPSHOT_KEY = "mollure:booking_draft_snapshots_v1";

type DraftSnapshot = {
  people?: ClientBookingDraft["people"];
  services?: ClientBookingDraft["services"];
  products?: ClientBookingDraft["products"];
  projectDetails?: ClientBookingDraft["projectDetails"];
  teamMembers?: ClientBookingDraft["teamMembers"];
  total?: number;
  selectedDateISO?: string;
  selectedTime?: string;
  combineServices?: boolean;
  clientNote?: string;
};

function clearLegacyLocalDraftCache() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_SNAPSHOT_KEY);
  } catch {
    // Ignore quota / private mode.
  }
}

function sanitizeProjectDetails(
  project?: ClientBookingDraft["projectDetails"],
): ClientBookingDraft["projectDetails"] | undefined {
  if (!project) return undefined;
  return {
    description: project.description ?? "",
    uploads: (project.uploads ?? []).map((upload) => {
      const url = liveMediaUrl(upload.url);
      const previewUrl = liveMediaUrl(upload.previewUrl) || url;
      return {
        ...upload,
        url,
        previewUrl,
      };
    }),
  };
}

function sanitizeDraft(draft: ClientBookingDraft): ClientBookingDraft {
  return {
    ...draft,
    projectDetails: sanitizeProjectDetails(draft.projectDetails),
  };
}

function hasPeople(draft?: ClientBookingDraft | DraftSnapshot | null) {
  return (draft?.people?.length ?? 0) > 0;
}

function hasProject(draft?: ClientBookingDraft | DraftSnapshot | null) {
  const project = draft?.projectDetails;
  return Boolean(project?.description?.trim()) || (project?.uploads?.length ?? 0) > 0;
}

function mergeProjectUploads(
  primary?: ClientBookingDraft["projectDetails"],
  fallback?: ClientBookingDraft["projectDetails"],
): NonNullable<ClientBookingDraft["projectDetails"]>["uploads"] {
  type Upload = NonNullable<ClientBookingDraft["projectDetails"]>["uploads"][number];
  const primaryUploads: Upload[] = sanitizeProjectDetails(primary)?.uploads ?? [];
  const fallbackUploads: Upload[] = sanitizeProjectDetails(fallback)?.uploads ?? [];
  if (!primaryUploads.length) return fallbackUploads;
  if (!fallbackUploads.length) return primaryUploads;

  const fallbackById = new Map(fallbackUploads.map((u) => [u.id, u]));
  const fallbackByName = new Map(fallbackUploads.map((u) => [u.name, u]));
  const used = new Set<string>();

  const merged: Upload[] = primaryUploads.map((upload) => {
    const match = fallbackById.get(upload.id) ?? fallbackByName.get(upload.name);
    if (match) used.add(match.id);
    const url = liveMediaUrl(upload.url) || liveMediaUrl(match?.url);
    const previewUrl =
      liveMediaUrl(upload.previewUrl) || liveMediaUrl(match?.previewUrl) || url;
    return {
      ...upload,
      ...match,
      ...upload,
      url,
      previewUrl,
      mimeType: upload.mimeType || match?.mimeType,
      kind: upload.kind || match?.kind,
    };
  });

  for (const upload of fallbackUploads) {
    if (used.has(upload.id)) continue;
    if (merged.some((row) => row.id === upload.id || row.name === upload.name)) continue;
    merged.push(upload);
  }
  return merged;
}

/** Booking drafts stay on the live API — never write them to localStorage. */
export function cacheClientBookingDraftSnapshot(_record: ClientBookingRecord) {
  clearLegacyLocalDraftCache();
}

export function getCachedClientBookingDraftSnapshot(
  _record: Pick<ClientBookingRecord, "id" | "apiBookingId" | "bookingRef">,
): DraftSnapshot | null {
  clearLegacyLocalDraftCache();
  return null;
}

/**
 * Prefer API draft, then fill missing people/guest/project fields from the
 * in-memory session draft. Project media only keeps live server URLs.
 */
export function mergeClientBookingDraftRichness(
  primary: ClientBookingDraft,
  fallback?: DraftSnapshot | ClientBookingDraft | null,
): ClientBookingDraft {
  const livePrimary = sanitizeDraft(primary);
  if (!fallback) return livePrimary;
  const liveFallback = sanitizeDraft(fallback as ClientBookingDraft);

  const people = hasPeople(livePrimary)
    ? livePrimary.people
    : liveFallback.people ?? livePrimary.people;
  const projectDetails =
    hasProject(livePrimary) || hasProject(liveFallback)
      ? {
          description:
            livePrimary.projectDetails?.description?.trim() ||
            liveFallback.projectDetails?.description ||
            "",
          uploads: mergeProjectUploads(
            livePrimary.projectDetails,
            liveFallback.projectDetails,
          ),
        }
      : livePrimary.projectDetails;
  const teamMembers = livePrimary.teamMembers?.length
    ? livePrimary.teamMembers
    : liveFallback.teamMembers ?? livePrimary.teamMembers;

  const primaryServices = livePrimary.services ?? [];
  const fallbackServices = liveFallback.services ?? [];
  let services = primaryServices;

  if (fallbackServices.length > 0) {
    const byId = new Map(fallbackServices.map((s) => [s.id, s]));
    const byName = new Map(fallbackServices.map((s) => [s.name, s]));
    services = primaryServices.map((service) => {
      const match = byId.get(service.id) ?? byName.get(service.name);
      return {
        ...service,
        // Missing guestId is the main client. Do not copy another person's id.
        guestId: service.guestId === undefined ? null : service.guestId,
        teamMemberId: service.teamMemberId ?? match?.teamMemberId ?? null,
      };
    });

    const lineKey = (row: { id: string; guestId?: string | null }) =>
      `${row.id}::${row.guestId ?? ""}`;
    const primaryKeys = new Set(services.map(lineKey));
    for (const fb of fallbackServices) {
      const key = lineKey(fb);
      if (primaryKeys.has(key)) continue;
      services = [
        ...services,
        {
          id: fb.id,
          name: fb.name,
          durationMins: fb.durationMins,
          price: fb.price,
          guestId: fb.guestId ?? null,
          teamMemberId: fb.teamMemberId ?? null,
          isAddOn: fb.isAddOn,
        },
      ];
      primaryKeys.add(key);
    }
  }

  services = dedupeServicesByOwner(
    services,
    extraBookingParticipantIds(people),
  );

  const fallbackProducts = liveFallback.products;
  const products =
    (livePrimary.products?.length ?? 0) > 0
      ? livePrimary.products
      : fallbackProducts?.length
        ? fallbackProducts
        : livePrimary.products;

  const primaryTotal =
    typeof livePrimary.total === "number" && livePrimary.total > 0
      ? livePrimary.total
      : null;
  const fallbackTotal =
    typeof liveFallback.total === "number" && liveFallback.total > 0
      ? liveFallback.total
      : null;

  return {
    ...livePrimary,
    people,
    projectDetails,
    teamMembers,
    services,
    products,
    total: primaryTotal ?? fallbackTotal ?? livePrimary.total,
    clientNote:
      livePrimary.clientNote?.trim() ||
      liveFallback.clientNote ||
      livePrimary.clientNote,
  };
}

export function enrichClientBookingRecord(record: ClientBookingRecord): ClientBookingRecord {
  if (!record.draft) return record;
  return { ...record, draft: sanitizeDraft(record.draft) };
}
