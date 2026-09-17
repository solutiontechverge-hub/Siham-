import type {
  CalendarBookingDetails,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  mainDrawerServicesFromClientSnapshot,
} from "./bookingEventDetails.guestScope";

export {
  filterMainClientAssignedLines,
  isMainClientAssignedLine,
  mainDrawerServicesFromClientSnapshot,
  requesterPersonIds,
} from "./bookingEventDetails.guestScope";

const NOTES_META_PREFIX = "---mollure-meta---";

/** Auto-appended booking note lines (services/project boilerplate) â€” not Internal Note. */
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
  /** Preferred for clientâ†’pro rounds so the drawer can show â€œEditedâ€. */
  clientEditedServiceIds?: string[];
  suggestedServices?: NonNullable<CalendarBookingDetails["services"]>;
  suggestedProducts?: NonNullable<CalendarBookingDetails["products"]>;
  /** Proposed schedule â€” booking columns stay original until professional Accept. */
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

/** Confirmed booking Edit Request (ER) â€” note-only permission handshake. */
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
    | "originalGuests"
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

/** Prefer details, then notes â€” never invent a rate or distance. */
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
    ...(details?.originalGuests?.length ? { originalGuests: details.originalGuests } : {}),
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

/** Mark notes meta paid so professional Accept unlocks even if column sync lags. */
export function markNotesPrepaymentPaid(
  notes: string | null | undefined,
  paymentMethod?: string | null,
): string | null {
  const details = parseCalendarEntryNotes(notes);
  const internalNote = sanitizeInternalNoteText(details?.internalNote) || "";
  return rewriteCalendarNotesPreservingNegotiation(notes, internalNote, {
    ...details,
    showPrepayment: true,
    prepaymentStatus: "confirmed",
    paymentMethod: (paymentMethod || details?.paymentMethod) as
      | "online"
      | "offline"
      | undefined,
  });
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
      originalGuests: applied?.originalGuests ?? details?.originalGuests,
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
      ...(meta.originalGuests?.length ? { originalGuests: meta.originalGuests } : {}),
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

export type ParsedCalendarEventId =
  | { kind: "booking"; id: string }
  | { kind: "calendar_entry"; id: string };

export function parseApiCalendarEventId(
  eventId: string | null | undefined,
): ParsedCalendarEventId | null {
  if (!eventId) return null;
  const parentId = eventId.replace(/::segment-\d+$/i, "");
  if (parentId.startsWith("b-")) {
    return { kind: "booking", id: parentId.slice(2) };
  }
  if (parentId.startsWith("ce-")) {
    return { kind: "calendar_entry", id: parentId.slice(3) };
  }
  return null;
}

/** Live chat open: unique code or UUID â€” never `extractBookingId` (it mangles hyphenated ids). */
export function resolveCalendarMessagingRef(event: {
  id: string;
  bookingCode?: string;
  details?: { customerId?: string | null };
}): { bookingRef: string; customerId?: string } {
  const parsed = parseApiCalendarEventId(event.id);
  const parsedId = String(parsed?.id ?? "").replace(/::segment-\d+$/i, "");
  const bookingRef =
    String(event.bookingCode ?? "").trim() ||
    parsedId ||
    String(event.id ?? "").trim();
  const customerId = String(event.details?.customerId ?? "").trim();
  return {
    bookingRef,
    ...(customerId ? { customerId } : {}),
  };
}

export type { BookingDrawerHydration } from "./bookingEventDetails.drawer";
export {
  emptyDesiredLocation,
  resolveBookingDetailsFromEvent,
  hydrateBookingDrawerFromEvent,
  buildBookingDetailsSnapshot,
} from "./bookingEventDetails.drawer";

