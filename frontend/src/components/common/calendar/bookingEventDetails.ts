import type {
  CalendarBookingDetails,
  CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { ManualEntryDiscount } from "../../sections/finance/manualEntry.data";

const NOTES_META_PREFIX = "---mollure-meta---";

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
    | "paymentMethod"
    | "showKilometerAllowance"
    | "kilometerAllowance"
    | "cancellationReason"
    | "responseStatus"
    | "requestDirection"
    | "editedServiceIds"
    | "lastEditedBy"
    | "clientSnapshot"
  >
> & {
  ebr?: StoredEbrNotePayload;
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
    paymentMethod: details?.paymentMethod,
    showKilometerAllowance: details?.showKilometerAllowance,
    kilometerAllowance: details?.kilometerAllowance,
    cancellationReason: details?.cancellationReason?.trim() || undefined,
    responseStatus: details?.responseStatus,
    requestDirection: details?.requestDirection,
    editedServiceIds: details?.editedServiceIds,
    lastEditedBy: details?.lastEditedBy,
    clientSnapshot: details?.clientSnapshot,
    ...(ebr ? { ebr } : {}),
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
    return {
      internalNote: notes.trim(),
      showInternalNote: true,
    };
  }
  const internalNote = notes.slice(0, markerIndex).trim();
  const metaRaw = notes.slice(markerIndex + NOTES_META_PREFIX.length).trim();
  try {
    const meta = JSON.parse(metaRaw) as StoredBookingNoteMeta;
    const ebr = meta.ebr;
    return {
      internalNote,
      showInternalNote: Boolean(internalNote) || Boolean(meta.showInternalNote),
      showLateRescheduling: Boolean(meta.showLateRescheduling),
      lateRescheduleFeePercent: meta.lateRescheduleFeePercent ?? "",
      showLateCancellation: Boolean(meta.showLateCancellation),
      lateCancellationFeePercent: meta.lateCancellationFeePercent ?? "",
      showPrepayment: Boolean(meta.showPrepayment),
      prepaymentPercent: meta.prepaymentPercent ?? "",
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
      ...(meta.requestDirection ? { requestDirection: meta.requestDirection } : {}),
      ...(meta.editedServiceIds?.length ? { editedServiceIds: meta.editedServiceIds } : {}),
      ...(meta.lastEditedBy ? { lastEditedBy: meta.lastEditedBy } : {}),
      ...(meta.clientSnapshot ? { clientSnapshot: meta.clientSnapshot } : {}),
      ...(ebr?.status !== "rejected" && ebr?.suggestedServices?.length ? { services: ebr.suggestedServices } : {}),
      ...(ebr?.status !== "rejected" && ebr?.suggestedProducts?.length ? { products: ebr.suggestedProducts } : {}),
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

  return {
    clientEmail: details.clientEmail ?? "",
    services: details.services ?? [],
    products: details.products ?? [],
    guests: details.guests ?? [],
    phoneCode: details.phoneCode ?? "",
    phoneNumber: details.phoneNumber ?? "",
    desiredLocation: details.desiredLocation ?? emptyDesiredLocation(),
    showPrepayment: Boolean(details.showPrepayment),
    prepaymentPercent: details.prepaymentPercent ?? "",
    paymentMethod: details.paymentMethod ?? "online",
    showLateCancellation: Boolean(details.showLateCancellation),
    lateCancellationFeePercent: details.lateCancellationFeePercent ?? "",
    showLateRescheduling: Boolean(details.showLateRescheduling),
    lateRescheduleFeePercent: details.lateRescheduleFeePercent ?? "",
    showInternalNote: Boolean(details.showInternalNote) || Boolean(details.internalNote),
    internalNote: details.internalNote ?? "",
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
