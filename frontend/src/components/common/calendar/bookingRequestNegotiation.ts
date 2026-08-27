import type {
  CalendarBookingDetails,
  CalendarBookingServiceItem,
  CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";

export type BookingEditTagVariant = "edited" | "client_edited" | "added" | "cancelled" | "updated";

export function isOutgoingBookingRequest(
  event: Pick<CalendarEvent, "status" | "bookingScenario" | "details"> | null | undefined,
) {
  if (!event || event.status !== "Requested") return false;
  if (event.bookingScenario !== "BR" && event.bookingScenario !== "EBR") return false;
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
  addedServiceIds?: string[];
  cancelledServiceIds?: string[];
} | null;

function hasId(ids: readonly string[] | undefined, serviceId: string) {
  return Boolean(ids?.includes(serviceId));
}

/**
 * Line-change tags after EBR accept (client or professional).
 * Cancelled > added > edited.
 */
export function getServiceEditTag(
  serviceId: string,
  details?: CalendarBookingDetails | null,
  ebr?: EditTagEbrSource,
): BookingEditTagVariant | null {
  if (
    hasId(details?.cancelledServiceIds, serviceId) ||
    hasId(ebr?.cancelledServiceIds, serviceId)
  ) {
    return "cancelled";
  }
  if (
    hasId(details?.addedServiceIds, serviceId) ||
    hasId(ebr?.addedServiceIds, serviceId)
  ) {
    return "added";
  }
  if (
    hasId(details?.clientEditedServiceIds, serviceId) ||
    hasId(ebr?.clientEditedServiceIds, serviceId) ||
    hasId(details?.editedServiceIds, serviceId) ||
    hasId(ebr?.editedServiceIds, serviceId)
  ) {
    return "edited";
  }
  return null;
}

export function cancelledOriginalServicesForDisplay(
  originalServices: readonly CalendarBookingServiceItem[] | undefined,
  currentIds: ReadonlySet<string>,
  cancelledIds?: readonly string[],
): CalendarBookingServiceItem[] {
  if (!originalServices?.length || !cancelledIds?.length) return [];
  const cancelled = new Set(cancelledIds);
  return originalServices.filter(
    (service) => cancelled.has(service.id) && !currentIds.has(service.id),
  );
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

export function detectServiceLineChanges(
  originalServices: readonly CalendarBookingServiceItem[],
  currentServices: readonly CalendarBookingServiceItem[],
) {
  const originalById = new Map(originalServices.map((service) => [service.id, service]));
  const currentIds = new Set(currentServices.map((service) => service.id));
  const added: string[] = [];
  const edited: string[] = [];
  const cancelled: string[] = [];

  for (const service of currentServices) {
    const original = originalById.get(service.id);
    if (!original) added.push(service.id);
    else if (serviceSignature(original) !== serviceSignature(service)) {
      edited.push(service.id);
    }
  }

  for (const original of originalServices) {
    if (!currentIds.has(original.id)) cancelled.push(original.id);
  }

  return {
    added: [...new Set(added)],
    edited: [...new Set(edited)],
    cancelled: [...new Set(cancelled)],
  };
}

export function detectEditedServiceIds(
  originalServices: readonly CalendarBookingServiceItem[],
  currentServices: readonly CalendarBookingServiceItem[],
) {
  const changes = detectServiceLineChanges(originalServices, currentServices);
  return [...new Set([...changes.added, ...changes.edited, ...changes.cancelled])];
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
