import type {
  CalendarBookingDetails,
  CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { ManualEntryDiscount } from "../../sections/finance/manualEntry.data";

const NOTES_META_PREFIX = "---mollure-meta---";

export type StoredEbrNotePayload = {
  status: "suggested" | "pending" | "rejected" | "none";
  suggestedAt?: string;
  professionalNote?: string;
  clientNote?: string;
  editedServiceIds?: string[];
  editedProductIds?: string[];
  suggestedServices?: NonNullable<CalendarBookingDetails["services"]>;
  suggestedProducts?: NonNullable<CalendarBookingDetails["products"]>;
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
      ...(ebr?.suggestedServices?.length ? { services: ebr.suggestedServices } : {}),
      ...(ebr?.suggestedProducts?.length ? { products: ebr.suggestedProducts } : {}),
      ...(ebr?.editedServiceIds?.length && !meta.editedServiceIds?.length
        ? { editedServiceIds: ebr.editedServiceIds }
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
