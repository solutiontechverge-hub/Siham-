import type {
  CalendarBookingClientSnapshot,
  CalendarBookingGuestItem,
  CalendarBookingProductItem,
  CalendarEvent,
} from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingDrawerHydration } from "../bookingEventDetails";
import { isExtraBookingParticipant } from "../../../../data/bookingChronologicalBlocks";
import { stampProductsToEarliestBlock } from "../../../../data/bookingProductPlacement";
import { normalizeServiceLinePricing } from "../../../../data/bookingLinePricing";
import { resolveMediaUrl } from "../../../../lib/resolveMediaUrl";

export function resolveDrawerAddClientSource(
  ev: CalendarEvent,
  isGuest: boolean,
): "client-list" | "guest" | "non-mollure" {
  if (ev.details?.customerId && !isGuest) return "client-list";
  if (isGuest) return "guest";
  if (ev.bookingType === "Offline") return "non-mollure";
  return "client-list";
}

type SnapshotPerson = NonNullable<
  CalendarBookingClientSnapshot["people"]
>[number];

export function mapSnapshotPersonToDrawerGuest(
  person: SnapshotPerson,
  snapServices: NonNullable<CalendarBookingClientSnapshot["services"]>,
  products: readonly CalendarBookingProductItem[],
): CalendarBookingGuestItem {
  return {
    id: person.id,
    name: person.name,
    email: person.email,
    phoneCode: person.phoneCode,
    phoneNumber: person.phoneNumber,
    services: (snapServices ?? [])
      .filter(
        (service) =>
          String(service.guestId ?? "").trim() === String(person.id),
      )
      .map((service) => {
        const priced = normalizeServiceLinePricing({
          price: service.price,
          originalPrice: service.originalPrice,
          discount: service.discount ?? null,
          pricingMode: service.pricingMode,
          discountPct: service.discountPct,
        });
        return {
          id: service.id,
          name: service.name,
          durationMins: service.durationMins,
          startTime: service.startTime,
          endTime: service.endTime,
          staffResourceId: service.teamMemberId ?? undefined,
          guestId: service.guestId ?? person.id,
          ...priced,
        };
      }),
    products: products.filter(
      (product) =>
        String(product.guestId ?? "").trim() === String(person.id),
    ),
    participantType: person.participantType ?? "guest",
    planningActivity: person.planningActivity,
    planningDuration: person.planningDuration,
    planningStartTime: person.planningStartTime,
    planningEndTime: person.planningEndTime,
    bufferTeamMemberId: person.bufferTeamMemberId,
    bufferStartTime: person.bufferStartTime,
    bufferEndTime: person.bufferEndTime,
  };
}

export function resolveOpenExistingBookingGuests(
  hydration: BookingDrawerHydration,
  resolved: CalendarEvent,
): CalendarBookingGuestItem[] {
  const stampedHydrationGuests = hydration.guests.map((guest) => ({
    ...guest,
    products: stampProductsToEarliestBlock(
      guest.products,
      guest.services,
      guest.id,
    ),
  }));
  const snap = resolved.details?.clientSnapshot;
  if (!snap?.people?.length) return stampedHydrationGuests;

  const products = resolved.details?.products ?? [];
  const snapServices = snap.services ?? [];

  if (!hydration.guests || hydration.guests.length === 0) {
    return snap.people
      .filter((person) => isExtraBookingParticipant(person))
      .map((person) =>
        mapSnapshotPersonToDrawerGuest(person, snapServices, products),
      );
  }

  const existingIds = new Set(
    hydration.guests.map((guest) => String(guest.id)),
  );
  const extras = snap.people
    .filter(
      (person) =>
        isExtraBookingParticipant(person) &&
        !existingIds.has(String(person.id)),
    )
    .map((person) =>
      mapSnapshotPersonToDrawerGuest(person, snapServices, products),
    );
  // Preserve prior apply order: extras replace with unstamped hydration guests.
  return extras.length
    ? [...hydration.guests, ...extras]
    : stampedHydrationGuests;
}

export function resolveOpenExistingProjectDetails(
  snap: CalendarBookingClientSnapshot | undefined,
): {
  enabled: boolean;
  description: string;
  uploads: Array<{
    id: string;
    name: string;
    previewUrl?: string;
    url?: string;
    mimeType?: string;
    kind?: "image" | "document";
  }>;
} {
  const project = snap?.projectDetails;
  return {
    enabled: Boolean(
      project?.description?.trim() || (project?.uploads?.length ?? 0) > 0,
    ),
    description: project?.description ?? "",
    uploads: (project?.uploads ?? []).map((upload) => {
      const durable = resolveMediaUrl(upload.url || upload.previewUrl);
      return {
        id: upload.id,
        name: upload.name,
        previewUrl: durable,
        url: durable ?? upload.url,
        mimeType: upload.mimeType,
        kind: upload.kind,
      };
    }),
  };
}
