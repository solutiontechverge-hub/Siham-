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

/** Confirmed Edit Request from client — professional may Accept / Reject / Suggest. */
export function canRespondToConfirmedEr(
  event: Pick<CalendarEvent, "status" | "bookingScenario" | "details"> | null | undefined,
) {
  if (!event || event.status !== "Confirmed" || event.bookingScenario !== "ER") return false;
  return event.details?.requestDirection !== "outgoing";
}

type EditTagEbrSource = {
  lastEditedBy?: "professional" | "client";
  editedServiceIds?: string[];
  editedProductIds?: string[];
  clientEditedServiceIds?: string[];
} | null;

/**
 * Professional drawer: show Edited only for client-originated line edits.
 * (Never show the professional's own edits back to themselves.)
 */
export function getServiceEditTag(
  serviceId: string,
  details?: CalendarBookingDetails | null,
  ebr?: EditTagEbrSource,
): BookingEditTagVariant | null {
  if (details?.clientEditedServiceIds?.includes(serviceId)) return "edited";
  if (ebr?.clientEditedServiceIds?.includes(serviceId)) return "edited";
  if (ebr?.lastEditedBy === "client" && ebr.editedServiceIds?.includes(serviceId)) {
    return "edited";
  }
  if (
    details?.lastEditedBy === "client" &&
    details.editedServiceIds?.includes(serviceId)
  ) {
    return "edited";
  }
  return null;
}

/** Professional drawer: Edited only when the client changed the product/unique line. */
export function getProductEditTag(
  productId: string,
  details?: CalendarBookingDetails | null,
  ebr?: EditTagEbrSource,
): BookingEditTagVariant | null {
  if (ebr?.lastEditedBy === "client" && ebr.editedProductIds?.includes(productId)) {
    return "edited";
  }
  if (
    details?.lastEditedBy === "client" &&
    details.editedProductIds?.includes(productId)
  ) {
    return "edited";
  }
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

function productSignature(product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unitPrice?: number;
}) {
  return JSON.stringify({
    name: product.name,
    price: product.price,
    quantity: product.quantity,
    unitPrice: product.unitPrice ?? product.price,
  });
}

export function detectEditedProductIds(
  originalProducts: readonly {
    id: string;
    name: string;
    price: number;
    quantity: number;
    unitPrice?: number;
  }[],
  currentProducts: readonly {
    id: string;
    name: string;
    price: number;
    quantity: number;
    unitPrice?: number;
  }[],
) {
  const originalById = new Map(originalProducts.map((product) => [product.id, product]));
  const editedIds: string[] = [];

  for (const product of currentProducts) {
    const original = originalById.get(product.id);
    if (!original || productSignature(original) !== productSignature(product)) {
      editedIds.push(product.id);
    }
  }

  for (const original of originalProducts) {
    if (!currentProducts.some((product) => product.id === original.id)) {
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
