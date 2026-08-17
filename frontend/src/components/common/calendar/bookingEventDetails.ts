import type {
  CalendarBookingDetails,
  CalendarBookingServiceItem,
  CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { ensureServiceStartEndTimes } from "../../../data/bookingServiceEdit.data";
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
    | "showLateRescheduling"
    | "lateRescheduleFeePercent"
    | "showLateCancellation"
    | "lateCancellationFeePercent"
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
    | "hiddenForProfessional"
    | "hiddenForCustomer"
    | "addedServiceIds"
    | "cancelledServiceIds"
    | "silentUpdated"
    | "refunded"
    | "waitingForPayment"
    | "invoiceDueDate"
    | "splitBill"
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
    showLateRescheduling: details?.showLateRescheduling,
    lateRescheduleFeePercent: details?.lateRescheduleFeePercent,
    showLateCancellation: details?.showLateCancellation,
    lateCancellationFeePercent: details?.lateCancellationFeePercent,
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
    ...(details?.hiddenForProfessional ? { hiddenForProfessional: true } : {}),
    ...(details?.hiddenForCustomer ? { hiddenForCustomer: true } : {}),
    ...(details?.addedServiceIds?.length ? { addedServiceIds: details.addedServiceIds } : {}),
    ...(details?.cancelledServiceIds?.length
      ? { cancelledServiceIds: details.cancelledServiceIds }
      : {}),
    ...(details?.silentUpdated ? { silentUpdated: true } : {}),
    ...(details?.refunded ? { refunded: true } : {}),
    ...(details?.waitingForPayment ? { waitingForPayment: true } : {}),
    ...(details?.invoiceDueDate ? { invoiceDueDate: details.invoiceDueDate } : {}),
    ...(details?.splitBill ? { splitBill: details.splitBill } : {}),
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
      showLateCancellation: details?.showLateCancellation,
      lateCancellationFeePercent: details?.lateCancellationFeePercent,
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
      showLateCancellation: details?.showLateCancellation,
      lateCancellationFeePercent: details?.lateCancellationFeePercent,
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

  const nonRequesterIds = new Set(
    (snapshot?.people ?? []).filter((person) => !person.isRequester).map((person) => person.id),
  );

  const mainServices = services.filter((service) => {
    const guestId = service.guestId != null ? String(service.guestId) : "";
    if (!guestId) return true;
    return !nonRequesterIds.has(guestId);
  });

  if (!mainServices.length) return undefined;

  return mainServices.map((service) => ({
    id: service.id,
    name: service.name,
    price: Number(service.price) || 0,
    durationMins: Math.max(15, Number(service.durationMins) || 15),
    ...(service.teamMemberId ? { staffResourceId: String(service.teamMemberId) } : {}),
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
  const internalNote = sanitizeInternalNoteText(notes.slice(0, markerIndex));
  const metaRaw = notes.slice(markerIndex + NOTES_META_PREFIX.length).trim();
  try {
    const meta = JSON.parse(metaRaw) as StoredBookingNoteMeta;
    const ebr = meta.ebr;
    const snapshotServices = mainDrawerServicesFromClientSnapshot(meta.clientSnapshot);
    return {
      internalNote,
      showInternalNote: Boolean(internalNote),
      showLateRescheduling: Boolean(meta.showLateRescheduling),
      lateRescheduleFeePercent: meta.lateRescheduleFeePercent ?? "",
      showLateCancellation: Boolean(meta.showLateCancellation),
      lateCancellationFeePercent: meta.lateCancellationFeePercent ?? "",
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
      ...(meta.hiddenForProfessional ? { hiddenForProfessional: true } : {}),
      ...(meta.hiddenForCustomer ? { hiddenForCustomer: true } : {}),
      ...(meta.addedServiceIds?.length ? { addedServiceIds: meta.addedServiceIds } : {}),
      ...(meta.cancelledServiceIds?.length
        ? { cancelledServiceIds: meta.cancelledServiceIds }
        : {}),
      ...(meta.silentUpdated ? { silentUpdated: true } : {}),
      ...(meta.refunded ? { refunded: true } : {}),
      ...(meta.waitingForPayment ? { waitingForPayment: true } : {}),
      ...(meta.invoiceDueDate ? { invoiceDueDate: meta.invoiceDueDate } : {}),
      ...(meta.splitBill ? { splitBill: meta.splitBill } : {}),
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
  showLateRescheduling: boolean;
  lateRescheduleFeePercent: string;
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
  if (ev.details) return ev.details;

  return {
    services: [],
    products: [],
    clientEmail: "",
    phoneCode: "",
    phoneNumber: "",
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
  const rawServices =
    details.services?.length
      ? details.services
      : (mainDrawerServicesFromClientSnapshot(details.clientSnapshot) ?? []);
  const services = ensureServiceStartEndTimes(rawServices, ev.start);

  const splitPhone = splitContactPhone(
    details.phoneNumber ?? "",
    details.phoneCode,
  );

  return {
    clientEmail: details.clientEmail ?? "",
    services,
    products: details.products ?? [],
    guests: details.guests ?? [],
    phoneCode: splitPhone.countryCode,
    phoneNumber: splitPhone.phone,
    desiredLocation: details.desiredLocation ?? emptyDesiredLocation(),
    showPrepayment: Boolean(details.showPrepayment),
    prepaymentPercent: details.prepaymentPercent ?? "",
    paymentMethod: details.paymentMethod ?? "online",
    showLateCancellation: Boolean(details.showLateCancellation),
    lateCancellationFeePercent: details.lateCancellationFeePercent ?? "",
    showLateRescheduling: Boolean(details.showLateRescheduling),
    lateRescheduleFeePercent: details.lateRescheduleFeePercent ?? "",
    showInternalNote: Boolean(sanitizeInternalNoteText(details.internalNote)),
    internalNote: sanitizeInternalNoteText(details.internalNote),
    totalDiscount: details.totalDiscount ?? null,
    showKilometerAllowance: Boolean(details.showKilometerAllowance),
    kilometerAllowance: details.kilometerAllowance ?? { eurPerKm: "", totalKilometer: "" },
  };
}

export function buildBookingDetailsSnapshot(input: {
  selectedClient: { name: string; email: string } | null;
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
  showLateRescheduling: boolean;
  lateRescheduleFeePercent: string;
  showInternalNote: boolean;
  bookingInternalNote: string;
  bookingTotalDiscount: ManualEntryDiscount | null;
  showKilometerAllowance: boolean;
  kilometerAllowanceDraft: BookingDrawerHydration["kilometerAllowance"];
  requestDirection?: CalendarBookingDetails["requestDirection"];
  originalServices?: CalendarBookingDetails["originalServices"];
  editedServiceIds?: CalendarBookingDetails["editedServiceIds"];
  clientEditedServiceIds?: CalendarBookingDetails["clientEditedServiceIds"];
  lastEditedBy?: CalendarBookingDetails["lastEditedBy"];
}): CalendarBookingDetails {
  return {
    clientEmail: input.selectedClient?.email ?? "",
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
    showLateRescheduling: input.showLateRescheduling,
    lateRescheduleFeePercent: input.lateRescheduleFeePercent,
    showInternalNote: input.showInternalNote || Boolean(input.bookingInternalNote.trim()),
    internalNote: input.bookingInternalNote,
    totalDiscount: input.bookingTotalDiscount,
    showKilometerAllowance: input.showKilometerAllowance,
    kilometerAllowance: input.kilometerAllowanceDraft,
    ...(input.requestDirection ? { requestDirection: input.requestDirection } : {}),
    ...(input.originalServices ? { originalServices: input.originalServices } : {}),
    ...(input.editedServiceIds ? { editedServiceIds: input.editedServiceIds } : {}),
    ...(input.clientEditedServiceIds ? { clientEditedServiceIds: input.clientEditedServiceIds } : {}),
    ...(input.lastEditedBy ? { lastEditedBy: input.lastEditedBy } : {}),
  };
}
