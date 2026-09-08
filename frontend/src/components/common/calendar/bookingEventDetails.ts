import type {
  CalendarBookingDetails,
  CalendarBookingGuestItem,
  CalendarBookingServiceItem,
  CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { extraBookingParticipantIds, isExtraBookingParticipant } from "../../../data/bookingChronologicalBlocks";
import { ensureGroupedServiceStartEndTimes } from "../../../data/bookingServiceEdit.data";
import { splitContactPhone } from "../../../lib/phone-validation";
import type { ManualEntryDiscount } from "../../sections/finance/manualEntry.data";

const NOTES_META_PREFIX = "---mollure-meta---";

/** Auto-appended booking note lines (services/project boilerplate) — not Internal Note. */
const AUTO_GENERATED_NOTE_LINE_RE =
  /^(Services:\s*.+|Project:\s*.+|Requested schedule:\s*.+|Team member will be provided by professional)$/i;

/**
 * Strip create/EBR boilerplate from the human notes prefix so Internal Note
 * stays blank unless someone typed a real note.
 */
export function sanitizeInternalNoteText(note?: string | null): string {
  if (!note?.trim()) return "";
  const parts = note
    .split(/\n+/)
    .flatMap((line) => line.split(/\s*\|\s*/))
    .map((part) => part.trim())
    .filter(Boolean);
  return parts
    .filter((part) => !AUTO_GENERATED_NOTE_LINE_RE.test(part))
    .join("\n")
    .trim();
}

export type StoredEbrNotePayload = {
  status: "suggested" | "pending" | "rejected" | "accepted" | "none";
  suggestedAt?: string;
  professionalNote?: string;
  clientNote?: string;
  editedServiceIds?: string[];
  editedProductIds?: string[];
  addedServiceIds?: string[];
  cancelledServiceIds?: string[];
  addedProductIds?: string[];
  cancelledProductIds?: string[];
  /** Preferred for client→pro rounds so the drawer can show “Edited”. */
  clientEditedServiceIds?: string[];
  suggestedServices?: NonNullable<CalendarBookingDetails["services"]>;
  suggestedProducts?: NonNullable<CalendarBookingDetails["products"]>;
  /** Proposed schedule — booking columns stay original until professional Accept. */
  suggestedDateISO?: string;
  suggestedTime?: string;
  suggestedStart?: string;
  suggestedEnd?: string;
  /** Confirmed booking schedule before this client EBR (for outcome diffs). */
  originalDateISO?: string;
  originalTime?: string;
  suggestedTotalPrice?: number;
  suggestedProjectDetails?: NonNullable<CalendarBookingDetails["clientSnapshot"]>["projectDetails"];
  responseStatus?: CalendarBookingDetails["responseStatus"];
  requestDirection?: CalendarBookingDetails["requestDirection"];
  lastEditedBy?: CalendarBookingDetails["lastEditedBy"];
};

/** Confirmed booking Edit Request (ER) — note-only permission handshake. */
export type StoredErNotePayload = {
  status: "pending" | "approved" | "rejected" | "suggested" | "none";
  note?: string;
  initiatedBy?: "client" | "professional";
  requestedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  suggestedAt?: string;
  /** One save window after Accept. */
  editGrantActive?: boolean;
  /** Message-only suggest reply. */
  suggestNote?: string;
};

type StoredBookingNoteMeta = Partial<
  Pick<
    CalendarBookingDetails,
    | "showInternalNote"
    | "clientNote"
    | "showLateRescheduling"
    | "lateRescheduleFeePercent"
    | "lateRescheduleFeePercentCeiling"
    | "showLateCancellation"
    | "lateCancellationFeePercent"
    | "lateCancellationFeePercentCeiling"
    | "showNoShowFee"
    | "noShowFeePercent"
    | "noShowFeePercentCeiling"
    | "cancellationFeeAt"
    | "exceededCancellationWindow"
    | "showPrepayment"
    | "prepaymentPercent"
    | "prepaymentStatus"
    | "paymentMethod"
    | "showKilometerAllowance"
    | "kilometerAllowance"
    | "cancellationReason"
    | "responseStatus"
    | "responseStartedAt"
    | "respondBy"
    | "responseWindowMinutes"
    | "requestDirection"
    | "editedServiceIds"
    | "editedProductIds"
    | "lastEditedBy"
    | "clientSnapshot"
    | "services"
    | "products"
    | "guests"
    | "clientEmail"
    | "phoneCode"
    | "phoneNumber"
    | "desiredLocation"
    | "totalDiscount"
    | "originalServices"
    | "needsOk"
    | "ackScenario"
    | "ackRecipient"
    | "hiddenForProfessional"
    | "hiddenForCustomer"
    | "addedServiceIds"
    | "cancelledServiceIds"
    | "addedProductIds"
    | "cancelledProductIds"
    | "silentUpdated"
    | "silentUpdateSnapshot"
    | "scheduleEdited"
    | "refunded"
    | "waitingForPayment"
    | "invoiceDueDate"
    | "splitBill"
    | "clientKind"
    | "isGuest"
  >
> & {
  ebr?: StoredEbrNotePayload;
  er?: StoredErNotePayload;
};

export function resolveKilometerAllowanceAmount(
  kilometerAllowance?: CalendarBookingDetails["kilometerAllowance"] | null,
): number {
  const rate = Number(kilometerAllowance?.eurPerKm);
  const km = Number(kilometerAllowance?.totalKilometer);
  if (!Number.isFinite(rate) || !Number.isFinite(km) || rate <= 0 || km <= 0) return 0;
  return Math.round((rate * km + Number.EPSILON) * 100) / 100;
}

export function hasKilometerAllowanceValues(
  kilometerAllowance?: CalendarBookingDetails["kilometerAllowance"] | null,
): boolean {
  return Boolean(
    String(kilometerAllowance?.eurPerKm ?? "").trim() ||
      String(kilometerAllowance?.totalKilometer ?? "").trim(),
  );
}

/** Prefer details, then notes — never invent a rate or distance. */
export function resolveEventKilometerAllowance(
  details:
    | Pick<CalendarBookingDetails, "showKilometerAllowance" | "kilometerAllowance">
    | null
    | undefined,
  notes?: string | null,
): {
  showKilometerAllowance: boolean;
  kilometerAllowance: NonNullable<CalendarBookingDetails["kilometerAllowance"]>;
} {
  const parsed = notes?.trim() ? parseCalendarEntryNotes(notes) : undefined;
  const kilometerAllowance = hasKilometerAllowanceValues(details?.kilometerAllowance)
    ? {
        eurPerKm: String(details?.kilometerAllowance?.eurPerKm ?? ""),
        totalKilometer: String(details?.kilometerAllowance?.totalKilometer ?? ""),
      }
    : {
        eurPerKm: parsed?.kilometerAllowance?.eurPerKm ?? "",
        totalKilometer: parsed?.kilometerAllowance?.totalKilometer ?? "",
      };
  return {
    showKilometerAllowance:
      Boolean(details?.showKilometerAllowance) ||
      Boolean(parsed?.showKilometerAllowance) ||
      hasKilometerAllowanceValues(kilometerAllowance),
    kilometerAllowance,
  };
}

function metaHasValues(meta: StoredBookingNoteMeta) {
  return Object.entries(meta).some(([key, value]) => {
    if (key === "ebr") return Boolean(value && typeof value === "object");
    if (Array.isArray(value)) return value.length > 0;
    return value != null && value !== false && value !== "";
  });
}

export function serializeCalendarEntryNotes(
  internalNote: string,
  details?: CalendarBookingDetails,
  ebr?: StoredEbrNotePayload | null,
  er?: StoredErNotePayload | null,
): string | null {
  const trimmed = internalNote.trim();
  const meta: StoredBookingNoteMeta = {
    showInternalNote: Boolean(trimmed) || Boolean(details?.showInternalNote),
    ...(details?.clientNote?.trim() ? { clientNote: details.clientNote.trim() } : {}),
    showLateRescheduling: details?.showLateRescheduling,
    lateRescheduleFeePercent: details?.lateRescheduleFeePercent,
    ...(details?.lateRescheduleFeePercentCeiling
      ? { lateRescheduleFeePercentCeiling: details.lateRescheduleFeePercentCeiling }
      : {}),
    showLateCancellation: details?.showLateCancellation,
    lateCancellationFeePercent: details?.lateCancellationFeePercent,
    ...(details?.lateCancellationFeePercentCeiling
      ? {
          lateCancellationFeePercentCeiling:
            details.lateCancellationFeePercentCeiling,
        }
      : {}),
    showNoShowFee: details?.showNoShowFee,
    noShowFeePercent: details?.noShowFeePercent,
    ...(details?.noShowFeePercentCeiling
      ? { noShowFeePercentCeiling: details.noShowFeePercentCeiling }
      : {}),
    ...(details?.cancellationFeeAt
      ? { cancellationFeeAt: details.cancellationFeeAt }
      : {}),
    ...(typeof details?.exceededCancellationWindow === "boolean"
      ? { exceededCancellationWindow: details.exceededCancellationWindow }
      : {}),
    showPrepayment: details?.showPrepayment,
    prepaymentPercent: details?.prepaymentPercent,
    prepaymentStatus: details?.prepaymentStatus,
    paymentMethod: details?.paymentMethod,
    showKilometerAllowance: details?.showKilometerAllowance,
    kilometerAllowance: details?.kilometerAllowance,
    cancellationReason: details?.cancellationReason?.trim() || undefined,
    responseStatus: details?.responseStatus,
    responseStartedAt: details?.responseStartedAt,
    respondBy: details?.respondBy,
    responseWindowMinutes: details?.responseWindowMinutes,
    requestDirection: details?.requestDirection,
    editedServiceIds: details?.editedServiceIds,
    editedProductIds: details?.editedProductIds,
    lastEditedBy: details?.lastEditedBy,
    clientSnapshot: details?.clientSnapshot,
    ...(details?.services?.length ? { services: details.services } : {}),
    ...(details?.products?.length ? { products: details.products } : {}),
    ...(details?.guests?.length ? { guests: details.guests } : {}),
    ...(details?.clientEmail ? { clientEmail: details.clientEmail } : {}),
    ...(details?.phoneCode ? { phoneCode: details.phoneCode } : {}),
    ...(details?.phoneNumber ? { phoneNumber: details.phoneNumber } : {}),
    ...(details?.desiredLocation ? { desiredLocation: details.desiredLocation } : {}),
    ...(details?.totalDiscount ? { totalDiscount: details.totalDiscount } : {}),
    ...(details?.originalServices?.length ? { originalServices: details.originalServices } : {}),
    ...(details?.needsOk ? { needsOk: true } : {}),
    ...(details?.ackScenario ? { ackScenario: details.ackScenario } : {}),
    ...(details?.ackRecipient ? { ackRecipient: details.ackRecipient } : {}),
    ...(details?.hiddenForProfessional ? { hiddenForProfessional: true } : {}),
    ...(details?.hiddenForCustomer ? { hiddenForCustomer: true } : {}),
    ...(details?.addedServiceIds?.length ? { addedServiceIds: details.addedServiceIds } : {}),
    ...(details?.cancelledServiceIds?.length
      ? { cancelledServiceIds: details.cancelledServiceIds }
      : {}),
    ...(details?.addedProductIds?.length ? { addedProductIds: details.addedProductIds } : {}),
    ...(details?.cancelledProductIds?.length
      ? { cancelledProductIds: details.cancelledProductIds }
      : {}),
    ...(details?.silentUpdated ? { silentUpdated: true } : {}),
    ...(details?.silentUpdateSnapshot
      ? { silentUpdateSnapshot: details.silentUpdateSnapshot }
      : {}),
    ...(details?.scheduleEdited ? { scheduleEdited: true } : {}),
    ...(details?.refunded ? { refunded: true } : {}),
    ...(details?.waitingForPayment ? { waitingForPayment: true } : {}),
    ...(details?.invoiceDueDate ? { invoiceDueDate: details.invoiceDueDate } : {}),
    ...(details?.splitBill ? { splitBill: details.splitBill } : {}),
    ...(details?.clientKind ? { clientKind: details.clientKind } : {}),
    ...(details?.isGuest ? { isGuest: true } : {}),
    ...(ebr ? { ebr } : {}),
    ...(er ? { er } : {}),
  };
  const hasMeta = metaHasValues(meta);
  if (!trimmed && !hasMeta) return null;
  if (!hasMeta) return trimmed;
  return `${trimmed}${trimmed ? "\n" : ""}${NOTES_META_PREFIX}\n${JSON.stringify(meta)}`;
}

export function parseStoredEbrFromNotes(notes?: string | null): StoredEbrNotePayload | null {
  if (!notes?.trim()) return null;
  const markerIndex = notes.indexOf(NOTES_META_PREFIX);
  if (markerIndex === -1) return null;
  const metaRaw = notes.slice(markerIndex + NOTES_META_PREFIX.length).trim();
  try {
    const meta = JSON.parse(metaRaw) as StoredBookingNoteMeta;
    return meta.ebr ?? null;
  } catch {
    return null;
  }
}

export function parseStoredErFromNotes(notes?: string | null): StoredErNotePayload | null {
  if (!notes?.trim()) return null;
  const markerIndex = notes.indexOf(NOTES_META_PREFIX);
  if (markerIndex === -1) return null;
  const metaRaw = notes.slice(markerIndex + NOTES_META_PREFIX.length).trim();
  try {
    const meta = JSON.parse(metaRaw) as StoredBookingNoteMeta;
    return meta.er ?? null;
  } catch {
    return null;
  }
}

/** Preserve ebr/er when rewriting notes for unrelated fields. */
export function rewriteCalendarNotesPreservingNegotiation(
  notes: string | null | undefined,
  internalNote: string,
  details?: CalendarBookingDetails,
  nextEbr?: StoredEbrNotePayload | null,
  nextEr?: StoredErNotePayload | null,
): string | null {
  const ebr =
    nextEbr === undefined ? parseStoredEbrFromNotes(notes) : nextEbr;
  const er = nextEr === undefined ? parseStoredErFromNotes(notes) : nextEr;
  return serializeCalendarEntryNotes(internalNote, details, ebr, er);
}

/** Keep suggested changes but mark EBR as rejected (booking columns stay original). */
export function markClientEbrRejectedInNotes(notes?: string | null): string | null {
  const details = parseCalendarEntryNotes(notes);
  const ebr = parseStoredEbrFromNotes(notes);
  const internalNote = (details?.internalNote ?? "").trim();
  if (!ebr) {
    return clearEbrSuggestionsFromNotes(notes, {
      internalNote,
      requestDirection: details?.requestDirection,
      clientSnapshot: details?.clientSnapshot,
    });
  }
  return serializeCalendarEntryNotes(
    internalNote,
    {
      showInternalNote: Boolean(internalNote) || Boolean(details?.showInternalNote),
      showLateRescheduling: details?.showLateRescheduling,
      lateRescheduleFeePercent: details?.lateRescheduleFeePercent,
      lateRescheduleFeePercentCeiling: details?.lateRescheduleFeePercentCeiling,
      showLateCancellation: details?.showLateCancellation,
      lateCancellationFeePercent: details?.lateCancellationFeePercent,
      lateCancellationFeePercentCeiling: details?.lateCancellationFeePercentCeiling,
      showNoShowFee: details?.showNoShowFee,
      noShowFeePercent: details?.noShowFeePercent,
      noShowFeePercentCeiling: details?.noShowFeePercentCeiling,
      cancellationFeeAt: details?.cancellationFeeAt,
      exceededCancellationWindow: details?.exceededCancellationWindow,
      showPrepayment: details?.showPrepayment,
      prepaymentPercent: details?.prepaymentPercent,
      paymentMethod: details?.paymentMethod,
      showKilometerAllowance: details?.showKilometerAllowance,
      kilometerAllowance: details?.kilometerAllowance,
      cancellationReason: details?.cancellationReason,
      requestDirection: details?.requestDirection,
      clientSnapshot: details?.clientSnapshot,
    },
    {
      ...ebr,
      status: "rejected",
      lastEditedBy: ebr.lastEditedBy ?? "client",
      responseStatus: undefined,
    },
  );
}

/** Apply accepted changes into clientSnapshot, keep ebr status=accepted for client outcome banner. */
export function markClientEbrAcceptedInNotes(
  notes?: string | null,
  applied?: Partial<CalendarBookingDetails> | null,
): string | null {
  const details = parseCalendarEntryNotes(notes);
  const ebr = parseStoredEbrFromNotes(notes);
  const internalNote = (applied?.internalNote ?? details?.internalNote ?? "").trim();
  if (!ebr) {
    return clearEbrSuggestionsFromNotes(notes, applied);
  }

  const nextSnapshot = {
    ...(details?.clientSnapshot ?? {}),
    ...(applied?.clientSnapshot ?? {}),
  };

  return serializeCalendarEntryNotes(
    internalNote,
    {
      showInternalNote: Boolean(internalNote) || Boolean(details?.showInternalNote),
      showLateRescheduling: details?.showLateRescheduling,
      lateRescheduleFeePercent: details?.lateRescheduleFeePercent,
      lateRescheduleFeePercentCeiling: details?.lateRescheduleFeePercentCeiling,
      showLateCancellation: details?.showLateCancellation,
      lateCancellationFeePercent: details?.lateCancellationFeePercent,
      lateCancellationFeePercentCeiling: details?.lateCancellationFeePercentCeiling,
      showNoShowFee: details?.showNoShowFee,
      noShowFeePercent: details?.noShowFeePercent,
      noShowFeePercentCeiling: details?.noShowFeePercentCeiling,
      cancellationFeeAt: details?.cancellationFeeAt,
      exceededCancellationWindow: details?.exceededCancellationWindow,
      showPrepayment: details?.showPrepayment,
      prepaymentPercent: details?.prepaymentPercent,
      paymentMethod: details?.paymentMethod,
      showKilometerAllowance: details?.showKilometerAllowance,
      kilometerAllowance: details?.kilometerAllowance,
      cancellationReason: details?.cancellationReason,
      requestDirection: details?.requestDirection,
      clientSnapshot: nextSnapshot,
      lastEditedBy:
        applied?.lastEditedBy ?? ebr.lastEditedBy ?? details?.lastEditedBy,
      editedServiceIds: applied?.editedServiceIds ?? ebr.editedServiceIds,
      editedProductIds: applied?.editedProductIds ?? ebr.editedProductIds,
      addedServiceIds: applied?.addedServiceIds,
      cancelledServiceIds: applied?.cancelledServiceIds,
      originalServices: applied?.originalServices ?? details?.originalServices,
      ...(applied?.services ? { services: applied.services } : {}),
      ...(applied?.products ? { products: applied.products } : {}),
    },
    {
      ...ebr,
      status: "accepted",
      lastEditedBy: ebr.lastEditedBy ?? "client",
      responseStatus: undefined,
    },
  );
}

/** Rebuild notes without pending EBR suggestions (optionally with applied booking details). */
export function clearEbrSuggestionsFromNotes(
  notes?: string | null,
  applied?: Partial<CalendarBookingDetails> | null,
): string | null {
  const details = parseCalendarEntryNotes(notes);
  const internalNote = (applied?.internalNote ?? details?.internalNote ?? "").trim();
  const nextDetails: CalendarBookingDetails = {
    ...(details ?? {}),
    ...(applied ?? {}),
    // Drop negotiation markers after accept/reject/cancel.
    responseStatus: undefined,
    lastEditedBy: undefined,
    requestDirection: undefined,
    editedServiceIds: applied?.editedServiceIds,
    clientEditedServiceIds: undefined,
    ...(applied?.cancellationReason?.trim()
      ? { cancellationReason: applied.cancellationReason.trim() }
      : details?.cancellationReason?.trim()
        ? { cancellationReason: details.cancellationReason.trim() }
        : {}),
  };
  // When clearing without applying, do not keep suggested service overlays as permanent lines.
  if (!applied?.services) {
    delete nextDetails.services;
    delete nextDetails.products;
  }
  return serializeCalendarEntryNotes(internalNote, nextDetails, null);
}

function normalizeAssignmentId(value: string | null | undefined): string {
  return value != null ? String(value).trim() : "";
}

export function requesterPersonIds(
  snapshot?: CalendarBookingDetails["clientSnapshot"],
): Set<string> {
  const extraIds = extraBookingParticipantIds(snapshot?.people);
  const ids = new Set<string>();
  for (const person of snapshot?.people ?? []) {
    const id = normalizeAssignmentId(person.id);
    if (!id || extraIds.has(id)) continue;
    ids.add(id);
  }
  return ids;
}

/**
 * Main-client lines are unassigned, tagged to the requester, or tagged to a
 * company contact. Guest/model/planning/buffer ids stay on their own cards.
 */
export function isMainClientAssignedLine(
  guestId: string | null | undefined,
  requesterIds: Set<string>,
): boolean {
  const id = normalizeAssignmentId(guestId);
  if (!id) return true;
  return requesterIds.has(id);
}

export function filterMainClientAssignedLines<T extends { guestId?: string | null }>(
  lines: readonly T[] | null | undefined,
  requesterIds: Set<string>,
): T[] {
  return (lines ?? []).filter((line) =>
    isMainClientAssignedLine(line.guestId, requesterIds),
  );
}

function assignedLinesForPerson<T extends { guestId?: string | null }>(
  nested: readonly T[] | null | undefined,
  flat: readonly T[] | null | undefined,
  personId: string,
): T[] {
  if (nested?.length) return [...nested];
  const id = normalizeAssignmentId(personId);
  if (!id) return [];
  return (flat ?? []).filter(
    (line) => normalizeAssignmentId(line.guestId) === id,
  );
}

type SnapshotPerson = NonNullable<
  NonNullable<CalendarBookingDetails["clientSnapshot"]>["people"]
>[number];

function isDisplayableSnapshotPerson(person: SnapshotPerson) {
  return isExtraBookingParticipant(person);
}

function guestFromSnapshotPerson(
  person: SnapshotPerson,
  snapshotServices: NonNullable<
    NonNullable<CalendarBookingDetails["clientSnapshot"]>["services"]
  >,
  details: CalendarBookingDetails,
): CalendarBookingGuestItem {
  return {
    id: person.id,
    name: person.name,
    email: person.email,
    phoneCode: person.phoneCode,
    phoneNumber: person.phoneNumber,
    services: assignedLinesForPerson<CalendarBookingServiceItem>(
      snapshotServices
        .filter(
          (service) =>
            normalizeAssignmentId(service.guestId) ===
            normalizeAssignmentId(person.id),
        )
        .map((service) => ({
          id: service.id,
          name: service.name,
          price: service.price,
          durationMins: service.durationMins,
          startTime: service.startTime,
          endTime: service.endTime,
          staffResourceId: service.teamMemberId ?? undefined,
          guestId: service.guestId ?? person.id,
          discount: service.discount ?? null,
          originalPrice: service.originalPrice,
        })),
      details.services,
      person.id,
    ),
    products: assignedLinesForPerson([], details.products, person.id),
    participantType: person.participantType ?? ("guest" as const),
    planningActivity: person.planningActivity,
    planningDuration: person.planningDuration,
    planningStartTime: person.planningStartTime,
    planningEndTime: person.planningEndTime,
    bufferTeamMemberId: person.bufferTeamMemberId,
    bufferStartTime: person.bufferStartTime,
    bufferEndTime: person.bufferEndTime,
  };
}

/**
 * Client bookings store every line in `clientSnapshot.services`, while the API
 * booking row only keeps a single `service_id`. Map requester / unassigned lines
 * into drawer `services` so each appears as its own card. Guest / model lines stay
 * under BookingDrawerClientSnapshotSection.
 */
export function mainDrawerServicesFromClientSnapshot(
  snapshot: CalendarBookingDetails["clientSnapshot"] | undefined,
): CalendarBookingServiceItem[] | undefined {
  const services = snapshot?.services;
  if (!services?.length) return undefined;

  const requesterIds = requesterPersonIds(snapshot);
  const mainServices = filterMainClientAssignedLines(services, requesterIds);

  if (!mainServices.length) return undefined;

  return mainServices.map((service) => ({
    id: service.id,
    name: service.name,
    price: Number(service.price) || 0,
    durationMins: Math.max(15, Number(service.durationMins) || 15),
    ...(service.startTime ? { startTime: service.startTime } : {}),
    ...(service.endTime ? { endTime: service.endTime } : {}),
    ...(service.teamMemberId ? { staffResourceId: String(service.teamMemberId) } : {}),
    ...(service.teamMemberName ? { teamMemberName: service.teamMemberName } : {}),
    guestId: service.guestId == null || !String(service.guestId).trim()
      ? null
      : String(service.guestId),
    ...(service.originalPrice != null ? { originalPrice: Number(service.originalPrice) } : {}),
    ...(service.discount ? { discount: service.discount } : {}),
  }));
}

export function parseCalendarEntryNotes(notes?: string | null): CalendarBookingDetails | undefined {
  if (!notes?.trim()) return undefined;
  const markerIndex = notes.indexOf(NOTES_META_PREFIX);
  if (markerIndex === -1) {
    const plainNote = sanitizeInternalNoteText(notes);
    return {
      internalNote: plainNote,
      showInternalNote: Boolean(plainNote),
    };
  }
  const prefixNote = sanitizeInternalNoteText(notes.slice(0, markerIndex));
  const metaRaw = notes.slice(markerIndex + NOTES_META_PREFIX.length).trim();
  try {
    const meta = JSON.parse(metaRaw) as StoredBookingNoteMeta;
    const ebr = meta.ebr;
    const snapshotServices = mainDrawerServicesFromClientSnapshot(meta.clientSnapshot);
    const storedClientNote = sanitizeInternalNoteText(meta.clientNote);
    const incomingClientPrefix =
      !storedClientNote && meta.requestDirection === "incoming" ? prefixNote : "";
    const clientNote = storedClientNote || incomingClientPrefix;
    const internalNote = clientNote && prefixNote === clientNote ? "" : prefixNote;
    return {
      internalNote,
      showInternalNote: Boolean(internalNote),
      ...(clientNote ? { clientNote } : {}),
      showLateRescheduling: Boolean(meta.showLateRescheduling),
      lateRescheduleFeePercent: meta.lateRescheduleFeePercent ?? "",
      ...(meta.lateRescheduleFeePercentCeiling
        ? {
            lateRescheduleFeePercentCeiling: meta.lateRescheduleFeePercentCeiling,
          }
        : {}),
      showLateCancellation: Boolean(meta.showLateCancellation),
      lateCancellationFeePercent: meta.lateCancellationFeePercent ?? "",
      ...(meta.lateCancellationFeePercentCeiling
        ? {
            lateCancellationFeePercentCeiling:
              meta.lateCancellationFeePercentCeiling,
          }
        : {}),
      showNoShowFee: Boolean(meta.showNoShowFee),
      noShowFeePercent: meta.noShowFeePercent ?? "",
      ...(meta.noShowFeePercentCeiling
        ? { noShowFeePercentCeiling: meta.noShowFeePercentCeiling }
        : {}),
      ...(meta.cancellationFeeAt
        ? { cancellationFeeAt: meta.cancellationFeeAt }
        : {}),
      ...(typeof meta.exceededCancellationWindow === "boolean"
        ? { exceededCancellationWindow: meta.exceededCancellationWindow }
        : {}),
      showPrepayment: Boolean(meta.showPrepayment),
      prepaymentPercent: meta.prepaymentPercent ?? "",
      ...(meta.prepaymentStatus
        ? { prepaymentStatus: meta.prepaymentStatus }
        : {}),
      paymentMethod: meta.paymentMethod ?? "online",
      showKilometerAllowance: Boolean(meta.showKilometerAllowance),
      ...(meta.kilometerAllowance
        ? {
            kilometerAllowance: {
              eurPerKm: meta.kilometerAllowance.eurPerKm ?? "",
              totalKilometer: meta.kilometerAllowance.totalKilometer ?? "",
            },
          }
        : {}),
      ...(meta.cancellationReason?.trim()
        ? { cancellationReason: meta.cancellationReason.trim() }
        : {}),
      ...(meta.responseStatus ? { responseStatus: meta.responseStatus } : {}),
      ...(meta.responseStartedAt
        ? { responseStartedAt: meta.responseStartedAt }
        : {}),
      ...(meta.respondBy ? { respondBy: meta.respondBy } : {}),
      ...(typeof meta.responseWindowMinutes === "number"
        ? { responseWindowMinutes: meta.responseWindowMinutes }
        : {}),
      ...(meta.requestDirection ? { requestDirection: meta.requestDirection } : {}),
      ...(meta.editedServiceIds?.length ? { editedServiceIds: meta.editedServiceIds } : {}),
      ...(meta.editedProductIds?.length ? { editedProductIds: meta.editedProductIds } : {}),
      ...(meta.lastEditedBy ? { lastEditedBy: meta.lastEditedBy } : {}),
      ...(ebr?.clientEditedServiceIds?.length
        ? { clientEditedServiceIds: ebr.clientEditedServiceIds }
        : ebr?.lastEditedBy === "client" && ebr.editedServiceIds?.length
          ? { clientEditedServiceIds: ebr.editedServiceIds }
          : {}),
      ...(meta.clientSnapshot ? { clientSnapshot: meta.clientSnapshot } : {}),
      ...(meta.services?.length
        ? { services: meta.services }
        : ebr?.status !== "rejected" && ebr?.suggestedServices?.length
          ? { services: ebr.suggestedServices }
          : snapshotServices?.length
            ? { services: snapshotServices }
            : {}),
      ...(meta.products?.length
        ? { products: meta.products }
        : ebr?.status !== "rejected" && ebr?.suggestedProducts?.length
          ? { products: ebr.suggestedProducts }
          : {}),
      ...(meta.guests?.length ? { guests: meta.guests } : {}),
      ...(meta.clientEmail ? { clientEmail: meta.clientEmail } : {}),
      ...(meta.phoneCode ? { phoneCode: meta.phoneCode } : {}),
      ...(meta.phoneNumber ? { phoneNumber: meta.phoneNumber } : {}),
      ...(meta.desiredLocation ? { desiredLocation: meta.desiredLocation } : {}),
      ...(meta.totalDiscount ? { totalDiscount: meta.totalDiscount } : {}),
      ...(meta.originalServices?.length ? { originalServices: meta.originalServices } : {}),
      ...(meta.needsOk ? { needsOk: true } : {}),
      ...(meta.ackScenario ? { ackScenario: meta.ackScenario } : {}),
      ...(meta.ackRecipient === "client" || meta.ackRecipient === "professional"
        ? { ackRecipient: meta.ackRecipient }
        : {}),
      ...(meta.hiddenForProfessional ? { hiddenForProfessional: true } : {}),
      ...(meta.hiddenForCustomer ? { hiddenForCustomer: true } : {}),
      ...(meta.addedServiceIds?.length ? { addedServiceIds: meta.addedServiceIds } : {}),
      ...(meta.cancelledServiceIds?.length
        ? { cancelledServiceIds: meta.cancelledServiceIds }
        : {}),
      ...(ebr?.status !== "rejected" && ebr?.addedServiceIds?.length && !meta.addedServiceIds?.length
        ? { addedServiceIds: ebr.addedServiceIds }
        : {}),
      ...(ebr?.status !== "rejected" &&
      ebr?.cancelledServiceIds?.length &&
      !meta.cancelledServiceIds?.length
        ? { cancelledServiceIds: ebr.cancelledServiceIds }
        : {}),
      ...(meta.addedProductIds?.length ? { addedProductIds: meta.addedProductIds } : {}),
      ...(meta.cancelledProductIds?.length
        ? { cancelledProductIds: meta.cancelledProductIds }
        : {}),
      ...(ebr?.status !== "rejected" && ebr?.addedProductIds?.length && !meta.addedProductIds?.length
        ? { addedProductIds: ebr.addedProductIds }
        : {}),
      ...(ebr?.status !== "rejected" &&
      ebr?.cancelledProductIds?.length &&
      !meta.cancelledProductIds?.length
        ? { cancelledProductIds: ebr.cancelledProductIds }
        : {}),
      ...(meta.silentUpdated ? { silentUpdated: true } : {}),
      ...(meta.silentUpdateSnapshot
        ? { silentUpdateSnapshot: meta.silentUpdateSnapshot }
        : {}),
      ...(meta.scheduleEdited ? { scheduleEdited: true } : {}),
      ...(meta.refunded ? { refunded: true } : {}),
      ...(meta.waitingForPayment ? { waitingForPayment: true } : {}),
      ...(meta.invoiceDueDate ? { invoiceDueDate: meta.invoiceDueDate } : {}),
      ...(meta.splitBill ? { splitBill: meta.splitBill } : {}),
      ...(meta.clientKind ? { clientKind: meta.clientKind } : {}),
      ...(meta.isGuest ? { isGuest: true } : {}),
      ...(ebr?.status !== "rejected" && ebr?.editedServiceIds?.length && !meta.editedServiceIds?.length
        ? { editedServiceIds: ebr.editedServiceIds }
        : {}),
      ...(ebr?.status !== "rejected" && ebr?.suggestedProjectDetails
        ? {
            clientSnapshot: {
              ...(meta.clientSnapshot ?? {}),
              projectDetails: ebr.suggestedProjectDetails,
            },
          }
        : {}),
    };
  } catch {
    return {
      internalNote: notes.trim(),
      showInternalNote: true,
    };
  }
}

export function parseApiCalendarEventId(eventId: string | null | undefined):
  | { kind: "booking"; id: string }
  | { kind: "calendar_entry"; id: string }
  | null {
  if (!eventId) return null;
  if (eventId.startsWith("b-")) return { kind: "booking", id: eventId.slice(2) };
  if (eventId.startsWith("ce-")) return { kind: "calendar_entry", id: eventId.slice(3) };
  return null;
}

export type BookingDrawerHydration = {
  clientEmail: string;
  services: NonNullable<CalendarBookingDetails["services"]>;
  products: NonNullable<CalendarBookingDetails["products"]>;
  guests: NonNullable<CalendarBookingDetails["guests"]>;
  phoneCode: string;
  phoneNumber: string;
  desiredLocation: NonNullable<CalendarBookingDetails["desiredLocation"]>;
  showPrepayment: boolean;
  prepaymentPercent: string;
  paymentMethod: "online" | "offline";
  showLateCancellation: boolean;
  lateCancellationFeePercent: string;
  lateCancellationFeePercentCeiling: string;
  showLateRescheduling: boolean;
  lateRescheduleFeePercent: string;
  lateRescheduleFeePercentCeiling: string;
  showNoShowFee: boolean;
  noShowFeePercent: string;
  noShowFeePercentCeiling: string;
  showInternalNote: boolean;
  internalNote: string;
  totalDiscount: ManualEntryDiscount | null;
  showKilometerAllowance: boolean;
  kilometerAllowance: NonNullable<CalendarBookingDetails["kilometerAllowance"]>;
};

export const emptyDesiredLocation = () => ({
  street: "",
  number: "",
  postalCode: "",
  province: "",
  municipality: "",
});

export function resolveBookingDetailsFromEvent(ev: CalendarEvent): CalendarBookingDetails {
  const km = resolveEventKilometerAllowance(ev.details, ev.notes);
  if (ev.details) {
    return {
      ...ev.details,
      showKilometerAllowance: km.showKilometerAllowance,
      kilometerAllowance: km.kilometerAllowance,
    };
  }

  return {
    services: [],
    products: [],
    clientEmail: "",
    phoneCode: "",
    phoneNumber: "",
    showKilometerAllowance: km.showKilometerAllowance,
    kilometerAllowance: km.kilometerAllowance,
    ...(ev.location === "DL"
      ? {
          desiredLocation: {
            street: "",
            number: "",
            postalCode: "",
            province: "",
            municipality: "",
          },
        }
      : {}),
  };
}

export function hydrateBookingDrawerFromEvent(ev: CalendarEvent): BookingDrawerHydration {
  const details = resolveBookingDetailsFromEvent(ev);

  const splitPhone = splitContactPhone(
    details.phoneNumber ?? "",
    details.phoneCode,
  );

  const snapshotPeople = details.clientSnapshot?.people ?? [];
  const snapshotServices = details.clientSnapshot?.services ?? [];
  const guestsFromNotes = details.guests ?? [];
  const guests: CalendarBookingGuestItem[] =
    guestsFromNotes.length > 0
      ? guestsFromNotes.map((guest) => {
          const person = snapshotPeople.find(
            (p) => normalizeAssignmentId(p.id) === normalizeAssignmentId(guest.id),
          );
          return {
            ...guest,
            email: guest.email || person?.email || "",
            phoneCode: guest.phoneCode || person?.phoneCode || "",
            phoneNumber: guest.phoneNumber || person?.phoneNumber || "",
            participantType:
              guest.participantType ?? person?.participantType ?? "guest",
            planningActivity: guest.planningActivity || person?.planningActivity,
            planningDuration: guest.planningDuration || person?.planningDuration,
            planningStartTime: guest.planningStartTime || person?.planningStartTime,
            planningEndTime: guest.planningEndTime || person?.planningEndTime,
            bufferTeamMemberId:
              guest.bufferTeamMemberId || person?.bufferTeamMemberId,
            bufferStartTime: guest.bufferStartTime || person?.bufferStartTime,
            bufferEndTime: guest.bufferEndTime || person?.bufferEndTime,
            services: assignedLinesForPerson(
              guest.services,
              details.services,
              guest.id,
            ),
            products: assignedLinesForPerson(
              guest.products,
              details.products,
              guest.id,
            ),
          };
        })
      : snapshotPeople
          .filter(isDisplayableSnapshotPerson)
          .map((person) =>
            guestFromSnapshotPerson(person, snapshotServices, details),
          );

  if (guestsFromNotes.length > 0) {
    const existingIds = new Set(
      guests.map((guest) => normalizeAssignmentId(guest.id)),
    );
    const existingPlanningKeys = new Set(
      guests
        .filter(
          (guest) =>
            guest.participantType === "planning" || guest.name === "Planning",
        )
        .map((guest) =>
          [
            (guest.planningActivity ?? "").trim().toLowerCase(),
            (guest.planningStartTime ?? "").trim(),
            (guest.planningEndTime ?? "").trim(),
            (guest.planningDuration ?? "").trim().toLowerCase(),
          ].join("|"),
        ),
    );
    for (const person of snapshotPeople) {
      if (!isDisplayableSnapshotPerson(person)) continue;
      if (existingIds.has(normalizeAssignmentId(person.id))) continue;
      const isPlanning =
        person.participantType === "planning" || person.name === "Planning";
      if (isPlanning) {
        const fingerprint = [
          (person.planningActivity ?? "").trim().toLowerCase(),
          (person.planningStartTime ?? "").trim(),
          (person.planningEndTime ?? "").trim(),
          (person.planningDuration ?? "").trim().toLowerCase(),
        ].join("|");
        if (existingPlanningKeys.has(fingerprint)) continue;
        existingPlanningKeys.add(fingerprint);
      }
      guests.push(guestFromSnapshotPerson(person, snapshotServices, details));
    }
  }

  const requesterIds = requesterPersonIds(details.clientSnapshot);
  const rawServices = details.services?.length
    ? filterMainClientAssignedLines(details.services, requesterIds)
    : (mainDrawerServicesFromClientSnapshot(details.clientSnapshot) ?? []);
  const rawProducts = filterMainClientAssignedLines(
    details.products ?? [],
    requesterIds,
  );

  // One shared timeline: client lines first, then each guest's lines.
  const [services, ...guestServiceGroups] = ensureGroupedServiceStartEndTimes(
    [rawServices, ...guests.map((guest) => guest.services)],
    ev.start,
  );
  const guestsWithTimes = guests.map((guest, index) => ({
    ...guest,
    services: guestServiceGroups[index] ?? [],
  }));

  return {
    clientEmail: details.clientEmail ?? "",
    services,
    products: rawProducts,
    guests: guestsWithTimes,
    phoneCode: splitPhone.countryCode,
    phoneNumber: splitPhone.phone,
    desiredLocation: details.desiredLocation ?? emptyDesiredLocation(),
    showPrepayment: Boolean(details.showPrepayment),
    prepaymentPercent: details.prepaymentPercent ?? "",
    paymentMethod: details.paymentMethod ?? "online",
    showLateCancellation: Boolean(details.showLateCancellation),
    lateCancellationFeePercent: details.lateCancellationFeePercent ?? "",
    lateCancellationFeePercentCeiling:
      details.lateCancellationFeePercentCeiling ??
      details.lateCancellationFeePercent ??
      "",
    showLateRescheduling: Boolean(details.showLateRescheduling),
    lateRescheduleFeePercent: details.lateRescheduleFeePercent ?? "",
    lateRescheduleFeePercentCeiling:
      details.lateRescheduleFeePercentCeiling ??
      details.lateRescheduleFeePercent ??
      "",
    showNoShowFee: Boolean(details.showNoShowFee),
    noShowFeePercent: details.noShowFeePercent ?? "",
    noShowFeePercentCeiling:
      details.noShowFeePercentCeiling ?? details.noShowFeePercent ?? "",
    showInternalNote: Boolean(sanitizeInternalNoteText(details.internalNote)),
    internalNote: sanitizeInternalNoteText(details.internalNote),
    totalDiscount: details.totalDiscount ?? null,
    showKilometerAllowance: Boolean(details.showKilometerAllowance),
    kilometerAllowance: details.kilometerAllowance ?? { eurPerKm: "", totalKilometer: "" },
  };
}

export function buildBookingDetailsSnapshot(input: {
  selectedClient: {
    name: string;
    email: string;
    clientKind?: "individual" | "company";
    mollureUserId?: string | null;
    isGuest?: boolean;
  } | null;
  isGuest?: boolean;
  selectedServices: BookingDrawerHydration["services"];
  selectedProducts: BookingDrawerHydration["products"];
  bookingGuests: BookingDrawerHydration["guests"];
  bookingPhoneDraft: { phoneCode: string; phoneNumber: string };
  desiredLocationDraft: BookingDrawerHydration["desiredLocation"];
  showPrepayment: boolean;
  prepaymentPercent: string;
  paymentMethod: "online" | "offline";
  showLateCancellation: boolean;
  lateCancellationFeePercent: string;
  lateCancellationFeePercentCeiling?: string;
  showLateRescheduling: boolean;
  lateRescheduleFeePercent: string;
  lateRescheduleFeePercentCeiling?: string;
  showNoShowFee?: boolean;
  noShowFeePercent?: string;
  noShowFeePercentCeiling?: string;
  cancellationFeeAt?: string;
  exceededCancellationWindow?: boolean;
  showInternalNote: boolean;
  bookingInternalNote: string;
  bookingTotalDiscount: ManualEntryDiscount | null;
  showKilometerAllowance: boolean;
  kilometerAllowanceDraft: BookingDrawerHydration["kilometerAllowance"];
  requestDirection?: CalendarBookingDetails["requestDirection"];
  originalServices?: CalendarBookingDetails["originalServices"];
  editedServiceIds?: CalendarBookingDetails["editedServiceIds"];
  addedServiceIds?: CalendarBookingDetails["addedServiceIds"];
  cancelledServiceIds?: CalendarBookingDetails["cancelledServiceIds"];
  editedProductIds?: CalendarBookingDetails["editedProductIds"];
  addedProductIds?: CalendarBookingDetails["addedProductIds"];
  cancelledProductIds?: CalendarBookingDetails["cancelledProductIds"];
  clientEditedServiceIds?: CalendarBookingDetails["clientEditedServiceIds"];
  lastEditedBy?: CalendarBookingDetails["lastEditedBy"];
  clientNote?: string;
}): CalendarBookingDetails {
  const mollureId = String(input.selectedClient?.mollureUserId ?? "").trim();
  const customerId =
    mollureId && mollureId !== "platform" ? mollureId : undefined;
  const isGuest =
    Boolean(input.isGuest) || Boolean(input.selectedClient?.isGuest);
  return {
    clientEmail: input.selectedClient?.email ?? "",
    ...(customerId && !isGuest ? { customerId } : {}),
    ...(isGuest
      ? { isGuest: true }
      : input.selectedClient?.clientKind
        ? { clientKind: input.selectedClient.clientKind }
        : {}),
    services: input.selectedServices,
    products: input.selectedProducts,
    guests: input.bookingGuests,
    phoneCode: input.bookingPhoneDraft.phoneCode,
    phoneNumber: input.bookingPhoneDraft.phoneNumber,
    desiredLocation: input.desiredLocationDraft,
    showPrepayment: input.showPrepayment,
    prepaymentPercent: input.prepaymentPercent,
    paymentMethod: input.paymentMethod,
    showLateCancellation: input.showLateCancellation,
    lateCancellationFeePercent: input.lateCancellationFeePercent,
    ...(input.lateCancellationFeePercentCeiling
      ? {
          lateCancellationFeePercentCeiling:
            input.lateCancellationFeePercentCeiling,
        }
      : {}),
    showLateRescheduling: input.showLateRescheduling,
    lateRescheduleFeePercent: input.lateRescheduleFeePercent,
    ...(input.lateRescheduleFeePercentCeiling
      ? {
          lateRescheduleFeePercentCeiling: input.lateRescheduleFeePercentCeiling,
        }
      : {}),
    showNoShowFee: Boolean(input.showNoShowFee),
    noShowFeePercent: input.noShowFeePercent ?? "",
    ...(input.noShowFeePercentCeiling
      ? { noShowFeePercentCeiling: input.noShowFeePercentCeiling }
      : {}),
    ...(input.cancellationFeeAt
      ? { cancellationFeeAt: input.cancellationFeeAt }
      : {}),
    ...(typeof input.exceededCancellationWindow === "boolean"
      ? { exceededCancellationWindow: input.exceededCancellationWindow }
      : {}),
    showInternalNote: input.showInternalNote || Boolean(input.bookingInternalNote.trim()),
    internalNote: input.bookingInternalNote,
    ...(input.clientNote?.trim() ? { clientNote: input.clientNote.trim() } : {}),
    totalDiscount: input.bookingTotalDiscount,
    showKilometerAllowance: input.showKilometerAllowance,
    kilometerAllowance: input.kilometerAllowanceDraft,
    ...(input.requestDirection ? { requestDirection: input.requestDirection } : {}),
    ...(input.originalServices ? { originalServices: input.originalServices } : {}),
    ...(input.editedServiceIds ? { editedServiceIds: input.editedServiceIds } : {}),
    ...(input.addedServiceIds?.length ? { addedServiceIds: input.addedServiceIds } : {}),
    ...(input.cancelledServiceIds?.length
      ? { cancelledServiceIds: input.cancelledServiceIds }
      : {}),
    ...(input.editedProductIds?.length ? { editedProductIds: input.editedProductIds } : {}),
    ...(input.addedProductIds?.length ? { addedProductIds: input.addedProductIds } : {}),
    ...(input.cancelledProductIds?.length
      ? { cancelledProductIds: input.cancelledProductIds }
      : {}),
    ...(input.clientEditedServiceIds ? { clientEditedServiceIds: input.clientEditedServiceIds } : {}),
    ...(input.lastEditedBy ? { lastEditedBy: input.lastEditedBy } : {}),
  };
}
