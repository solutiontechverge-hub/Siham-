import type {
  CalendarBookingDetails,
  CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { ManualEntryDiscount } from "../../sections/finance/manualEntry.data";
import { allBookingCatalogServices } from "../../../data/bookingServiceCatalog.data";
import { minutesSinceMidnight } from "./calendar.utils";

const NOTES_META_PREFIX = "---mollure-meta---";

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
  >
>;

export function serializeCalendarEntryNotes(internalNote: string, details?: CalendarBookingDetails): string | null {
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
  };
  const hasMeta = Object.values(meta).some((value) => value != null && value !== false && value !== "");
  if (!trimmed && !hasMeta) return null;
  if (!hasMeta) return trimmed;
  return `${trimmed}${trimmed ? "\n" : ""}${NOTES_META_PREFIX}\n${JSON.stringify(meta)}`;
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

function bookingDurationMins(ev: CalendarEvent) {
  return Math.max(15, minutesSinceMidnight(ev.end) - minutesSinceMidnight(ev.start));
}

function matchCatalogService(title: string) {
  const normalized = title.toLowerCase().trim();
  return (
    allBookingCatalogServices.find((service) => service.name.toLowerCase() === normalized) ??
    allBookingCatalogServices.find(
      (service) =>
        normalized.includes(service.name.toLowerCase()) || service.name.toLowerCase().includes(normalized),
    )
  );
}

function defaultPriceForTitle(title: string) {
  const normalized = title.toLowerCase();
  if (/\bmassage\b/.test(normalized)) return 165;
  if (/\blash/.test(normalized)) return 85;
  if (/\bhair\b|\bcut\b/.test(normalized)) return 45;
  if (/\bmake-?up\b/.test(normalized)) return 60;
  return 65;
}

function buildFallbackService(ev: CalendarEvent) {
  const catalogMatch = matchCatalogService(ev.title);
  if (catalogMatch) {
    return { ...catalogMatch };
  }

  return {
    id: `svc-${ev.id}`,
    name: ev.title,
    durationMins: bookingDurationMins(ev),
    price: defaultPriceForTitle(ev.title),
  };
}

function mockClientEmail(name?: string) {
  if (!name) return "";
  return `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;
}

export function resolveBookingDetailsFromEvent(ev: CalendarEvent): CalendarBookingDetails {
  if (ev.details) return ev.details;

  return {
    services: [buildFallbackService(ev)],
    clientEmail: mockClientEmail(ev.showClientName),
    phoneCode: "+31",
    phoneNumber: "612345678",
    ...(ev.location === "DL"
      ? {
          desiredLocation: {
            street: "Main Street",
            number: "12",
            postalCode: "1012 AB",
            province: "North Holland",
            municipality: "Amsterdam",
          },
        }
      : {}),
  };
}

export function hydrateBookingDrawerFromEvent(ev: CalendarEvent): BookingDrawerHydration {
  const details = resolveBookingDetailsFromEvent(ev);

  return {
    clientEmail: details.clientEmail ?? mockClientEmail(ev.showClientName),
    services: details.services ?? [buildFallbackService(ev)],
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
