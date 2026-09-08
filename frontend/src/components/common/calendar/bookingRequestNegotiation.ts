import type {
  CalendarBookingDetails,
  CalendarBookingGuestItem,
  CalendarBookingProductItem,
  CalendarBookingServiceItem,
  CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";

export type BookingEditTagVariant =
  | "edited"
  | "client_edited"
  | "added"
  | "cancelled"
  | "pending"
  | "updated";

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
  if (event.bookingType === "Online") return true;
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
  status?: string;
  editedServiceIds?: string[];
  editedProductIds?: string[];
  clientEditedServiceIds?: string[];
  addedServiceIds?: string[];
  cancelledServiceIds?: string[];
  addedProductIds?: string[];
  cancelledProductIds?: string[];
} | null;

export type BookingEditTagResult =
  | BookingEditTagVariant
  | readonly BookingEditTagVariant[]
  | null
  | undefined;

function hasId(ids: readonly string[] | undefined, serviceId: string) {
  return Boolean(ids?.includes(serviceId));
}

export function normalizeBookingEditTags(
  tag: BookingEditTagResult,
): BookingEditTagVariant[] {
  if (!tag) return [];
  if (typeof tag === "string") return [tag];
  return [...tag];
}

/** True while a professional-sent EBR is waiting for the client. */
export function isAwaitingClientChangeApproval(
  details?: CalendarBookingDetails | null,
  ebr?: EditTagEbrSource,
) {
  if (ebr?.lastEditedBy === "professional") {
    const status = String(ebr.status ?? "").toLowerCase();
    if (status === "suggested" || status === "pending") return true;
  }
  return (
    details?.lastEditedBy === "professional" &&
    details.responseStatus === "suggestion_for_change"
  );
}

/**
 * Per-line change kind: cancelled > added > edited.
 */
export function resolveLineChangeKind(
  itemId: string,
  options: {
    editedIds?: readonly string[];
    addedIds?: readonly string[];
    cancelledIds?: readonly string[];
  },
): BookingEditTagVariant | null {
  if (hasId(options.cancelledIds, itemId)) return "cancelled";
  if (hasId(options.addedIds, itemId)) return "added";
  if (hasId(options.editedIds, itemId)) return "edited";
  return null;
}

/**
 * Individual line tags. When awaiting client approval, Pending is added
 * next to Edited / Added / Cancelled — it does not replace them.
 */
export function resolveLineChangeTags(
  itemId: string,
  options: {
    editedIds?: readonly string[];
    addedIds?: readonly string[];
    cancelledIds?: readonly string[];
    awaitingApproval?: boolean;
  },
): BookingEditTagVariant[] {
  const kind = resolveLineChangeKind(itemId, options);
  if (!kind) return [];
  return options.awaitingApproval ? [kind, "pending"] : [kind];
}

/**
 * Per-line tag for bundled edit changes.
 * Cancelled > added > edited. Pending is appended when awaiting approval.
 */
export function resolveServiceChangeTag(
  serviceId: string,
  options: {
    editedIds?: readonly string[];
    addedIds?: readonly string[];
    cancelledIds?: readonly string[];
    awaitingApproval?: boolean;
  },
): BookingEditTagVariant | null {
  return resolveLineChangeKind(serviceId, options);
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

/** Product/unique-item tags: cancelled > added > edited. */
export function getProductEditTag(
  productId: string,
  details?: CalendarBookingDetails | null,
  ebr?: EditTagEbrSource,
): BookingEditTagVariant | null {
  if (
    hasId(details?.cancelledProductIds, productId) ||
    hasId(ebr?.cancelledProductIds, productId)
  ) {
    return "cancelled";
  }
  if (
    hasId(details?.addedProductIds, productId) ||
    hasId(ebr?.addedProductIds, productId)
  ) {
    return "added";
  }
  if (
    hasId(details?.editedProductIds, productId) ||
    hasId(ebr?.editedProductIds, productId)
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

function serviceLineKey(service: CalendarBookingServiceItem) {
  return `${service.guestId ?? ""}:${service.id}`;
}

/** Name/price/duration/staff — ignores start/end so reorder is not treated as Edited. */
function serviceContentSignature(service: CalendarBookingServiceItem) {
  return JSON.stringify({
    name: service.name,
    price: service.price,
    durationMins: service.durationMins,
    staffResourceId: service.staffResourceId ?? service.teamMemberId ?? "",
    guestId: service.guestId ?? "",
  });
}

function listHasContentChanges(
  originalServices: readonly CalendarBookingServiceItem[],
  currentServices: readonly CalendarBookingServiceItem[],
) {
  const originalByKey = new Map(
    originalServices.map((service) => [serviceLineKey(service), service]),
  );
  const currentKeys = new Set(currentServices.map(serviceLineKey));
  for (const service of currentServices) {
    const original = originalByKey.get(serviceLineKey(service));
    if (!original) return true;
    if (serviceContentSignature(original) !== serviceContentSignature(service)) {
      return true;
    }
  }
  for (const original of originalServices) {
    if (!currentKeys.has(serviceLineKey(original))) return true;
  }
  return false;
}

function listHasTimeOnlyEdits(
  originalServices: readonly CalendarBookingServiceItem[],
  currentServices: readonly CalendarBookingServiceItem[],
) {
  if (isServiceReorderOnly(originalServices, currentServices)) return false;
  if (listHasContentChanges(originalServices, currentServices)) return false;
  return detectServiceLineChanges(originalServices, currentServices).edited.length > 0;
}

/** Same services (content) in a different sequence — times may shift as a side effect. */
export function isServiceReorderOnly(
  originalServices: readonly CalendarBookingServiceItem[],
  currentServices: readonly CalendarBookingServiceItem[],
): boolean {
  if (
    originalServices.length === 0 ||
    originalServices.length !== currentServices.length
  ) {
    return false;
  }
  const originalKeys = originalServices.map(serviceLineKey);
  const currentKeys = currentServices.map(serviceLineKey);
  if ([...originalKeys].sort().join("\0") !== [...currentKeys].sort().join("\0")) {
    return false;
  }
  if (listHasContentChanges(originalServices, currentServices)) return false;
  return originalKeys.join("\0") !== currentKeys.join("\0");
}

function guestKey(guest: CalendarBookingGuestItem) {
  return String(guest.id ?? "").trim();
}

function isIdentityGuest(guest: CalendarBookingGuestItem) {
  const kind = guest.participantType ?? "guest";
  return kind === "guest" || kind === "model";
}

function identityGuests(
  guests: readonly CalendarBookingGuestItem[] | undefined,
) {
  return (guests ?? []).filter(isIdentityGuest);
}

function guestIdsKey(guests: readonly CalendarBookingGuestItem[] | undefined) {
  return [...(guests ?? []).map(guestKey)].filter(Boolean).sort().join("\0");
}

function identityGuestIdsKey(
  guests: readonly CalendarBookingGuestItem[] | undefined,
) {
  return guestIdsKey(identityGuests(guests));
}

function guestsById(guests: readonly CalendarBookingGuestItem[]) {
  return new Map(guests.map((guest) => [guestKey(guest), guest]));
}

/** Guest/model name, email, or phone — same people, no add/remove. */
function guestIdentityChangedOnly(
  previous: readonly CalendarBookingGuestItem[] | undefined,
  next: readonly CalendarBookingGuestItem[] | undefined,
) {
  const prev = identityGuests(previous);
  const curr = identityGuests(next);
  if (prev.length === 0 && curr.length === 0) return false;
  if (identityGuestIdsKey(prev) !== identityGuestIdsKey(curr)) return false;
  const prevById = guestsById(prev);
  return curr.some((guest) => {
    const original = prevById.get(guestKey(guest));
    if (!original) return false;
    return (
      (original.name ?? "").trim() !== (guest.name ?? "").trim() ||
      (original.email ?? "").trim() !== (guest.email ?? "").trim() ||
      (original.phoneCode ?? "") !== (guest.phoneCode ?? "") ||
      (original.phoneNumber ?? "").trim() !== (guest.phoneNumber ?? "").trim()
    );
  });
}

function guestsHaveServiceReorderOnly(
  previous: readonly CalendarBookingGuestItem[] | undefined,
  next: readonly CalendarBookingGuestItem[] | undefined,
) {
  const prev = identityGuests(previous);
  const curr = identityGuests(next);
  if (identityGuestIdsKey(prev) !== identityGuestIdsKey(curr)) return false;
  const currById = guestsById(curr);
  let reordered = false;
  for (const guest of prev) {
    const updated = currById.get(guestKey(guest));
    if (!updated) return false;
    if (listHasContentChanges(guest.services ?? [], updated.services ?? [])) {
      return false;
    }
    if (listHasTimeOnlyEdits(guest.services ?? [], updated.services ?? [])) {
      return false;
    }
    if (isServiceReorderOnly(guest.services ?? [], updated.services ?? [])) {
      reordered = true;
    }
  }
  return reordered;
}

function guestsHaveApprovalRequiredServiceChanges(
  previous: readonly CalendarBookingGuestItem[] | undefined,
  next: readonly CalendarBookingGuestItem[] | undefined,
) {
  const prev = previous ?? [];
  const curr = next ?? [];
  if (guestIdsKey(prev) !== guestIdsKey(curr)) return true;
  const currById = guestsById(curr);
  for (const guest of prev) {
    const updated = currById.get(guestKey(guest));
    if (!updated) return true;
    if (listHasContentChanges(guest.services ?? [], updated.services ?? [])) {
      return true;
    }
    if (listHasTimeOnlyEdits(guest.services ?? [], updated.services ?? [])) {
      return true;
    }
  }
  return false;
}

/**
 * Contact number, guest names, and/or service reorder only.
 * No schedule, product, add/remove, or content edits that need client approval.
 */
export function isSilentSafeBookingChange(input: {
  previousServices?: readonly CalendarBookingServiceItem[];
  currentServices?: readonly CalendarBookingServiceItem[];
  previousGuests?: readonly CalendarBookingGuestItem[];
  currentGuests?: readonly CalendarBookingGuestItem[];
  previousPhoneCode?: string;
  currentPhoneCode?: string;
  previousPhoneNumber?: string;
  currentPhoneNumber?: string;
  previousProducts?: readonly CalendarBookingProductItem[];
  currentProducts?: readonly CalendarBookingProductItem[];
  scheduleChanged: boolean;
}): boolean {
  const previousServices = input.previousServices ?? [];
  const currentServices = input.currentServices ?? [];
  const phoneChanged =
    (input.previousPhoneCode ?? "") !== (input.currentPhoneCode ?? "") ||
    (input.previousPhoneNumber ?? "") !== (input.currentPhoneNumber ?? "");
  const namesChanged = guestIdentityChangedOnly(
    input.previousGuests,
    input.currentGuests,
  );
  const servicesReordered =
    isServiceReorderOnly(previousServices, currentServices) ||
    guestsHaveServiceReorderOnly(input.previousGuests, input.currentGuests);
  const hasSilentSafe = phoneChanged || namesChanged || servicesReordered;
  if (!hasSilentSafe) return false;

  const productChanged = detectEditedProductIds(
    input.previousProducts ?? [],
    input.currentProducts ?? [],
  ).length > 0;
  const clientContentChanged = listHasContentChanges(
    previousServices,
    currentServices,
  );
  const clientTimeOnlyEdits = listHasTimeOnlyEdits(
    previousServices,
    currentServices,
  );
  const guestSetChanged =
    guestIdsKey(input.previousGuests) !== guestIdsKey(input.currentGuests);
  const guestServiceApprovalRequired =
    !guestSetChanged &&
    guestsHaveApprovalRequiredServiceChanges(
      input.previousGuests,
      input.currentGuests,
    );

  return !(
    input.scheduleChanged ||
    productChanged ||
    clientContentChanged ||
    clientTimeOnlyEdits ||
    guestSetChanged ||
    guestServiceApprovalRequired
  );
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

export function detectProductLineChanges(
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
  const currentIds = new Set(currentProducts.map((product) => product.id));
  const added: string[] = [];
  const edited: string[] = [];
  const cancelled: string[] = [];

  for (const product of currentProducts) {
    const original = originalById.get(product.id);
    if (!original) added.push(product.id);
    else if (productSignature(original) !== productSignature(product)) {
      edited.push(product.id);
    }
  }

  for (const original of originalProducts) {
    if (!currentIds.has(original.id)) cancelled.push(original.id);
  }

  return {
    added: [...new Set(added)],
    edited: [...new Set(edited)],
    cancelled: [...new Set(cancelled)],
  };
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
  const changes = detectProductLineChanges(originalProducts, currentProducts);
  return [...new Set([...changes.added, ...changes.edited, ...changes.cancelled])];
}

export function resolveOriginalServices(
  event: CalendarEvent,
  hydratedServices: CalendarBookingServiceItem[],
) {
  return event.details?.originalServices ?? hydratedServices;
}
