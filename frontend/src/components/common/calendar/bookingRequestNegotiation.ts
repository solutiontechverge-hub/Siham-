import type {
  CalendarBookingDetails,
  CalendarBookingServiceItem,
  CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";

export type BookingEditTagVariant = "edited" | "client_edited";

export function isOutgoingBookingRequest(
  event: Pick<CalendarEvent, "status" | "bookingScenario" | "details"> | null | undefined,
) {
  if (!event || event.status !== "Requested" || event.bookingScenario !== "BR") return false;
  return event.details?.requestDirection === "outgoing";
}

/** Booking created/sent by a client (incoming BR/EBR or online request). */
export function isClientOriginatedBooking(
  event: Pick<CalendarEvent, "details" | "bookingScenario" | "bookingType"> | null | undefined,
) {
  if (!event) return false;
  if (event.details?.requestDirection === "outgoing") return false;
  if (event.details?.requestDirection === "incoming") return true;
  if (event.bookingScenario === "BR" || event.bookingScenario === "EBR") return true;
  if (event.bookingType === "Online" || event.bookingType === "Requests") return true;
  return false;
}

/** Client sent a booking request (BR) or returned an edited booking request (EBR). */
export function canRespondToIncomingRequest(
  event: Pick<CalendarEvent, "status" | "bookingScenario" | "details"> | null | undefined,
) {
  if (!event || event.status !== "Requested") return false;
  if (event.details?.requestDirection === "outgoing") return false;
  return event.bookingScenario === "BR" || event.bookingScenario === "EBR";
}

export function canDiscardEbr(
  event: Pick<CalendarEvent, "status" | "bookingScenario" | "details"> | null | undefined,
) {
  if (!event || event.status !== "Requested" || event.bookingScenario !== "EBR") return false;
  return event.details?.lastEditedBy === "professional";
}

export function getServiceEditTag(
  serviceId: string,
  details?: CalendarBookingDetails | null,
): BookingEditTagVariant | null {
  if (details?.clientEditedServiceIds?.includes(serviceId)) return "client_edited";
  if (details?.editedServiceIds?.includes(serviceId)) return "edited";
  return null;
}

function serviceSignature(service: CalendarBookingServiceItem) {
  return JSON.stringify({
    name: service.name,
    price: service.price,
    durationMins: service.durationMins,
    startTime: service.startTime ?? "",
    endTime: service.endTime ?? "",
    staffResourceId: service.staffResourceId ?? "",
  });
}

export function detectEditedServiceIds(
  originalServices: readonly CalendarBookingServiceItem[],
  currentServices: readonly CalendarBookingServiceItem[],
) {
  const originalById = new Map(originalServices.map((service) => [service.id, service]));
  const editedIds: string[] = [];

  for (const service of currentServices) {
    const original = originalById.get(service.id);
    if (!original || serviceSignature(original) !== serviceSignature(service)) {
      editedIds.push(service.id);
    }
  }

  for (const original of originalServices) {
    if (!currentServices.some((service) => service.id === original.id)) {
      editedIds.push(original.id);
    }
  }

  return [...new Set(editedIds)];
}

export function resolveOriginalServices(
  event: CalendarEvent,
  hydratedServices: CalendarBookingServiceItem[],
) {
  return event.details?.originalServices ?? hydratedServices;
}
