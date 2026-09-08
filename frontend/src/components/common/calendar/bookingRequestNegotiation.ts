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

/** Client sent EBR or confirmed ER — professional still needs to respond. */
export function isAwaitingIncomingClientEdit(
  event: Pick<CalendarEvent, "status" | "bookingScenario" | "details"> | null | undefined,
) {
  if (canRespondToConfirmedEr(event)) return true;
  if (!event || event.status !== "Requested" || event.bookingScenario !== "EBR") {
    return false;
  }
  if (event.details?.requestDirection === "outgoing") return false;
  return event.details?.lastEditedBy !== "professional";
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

function phonePart(value?: string | null) {
  return String(value ?? "").replace(/[\s-]/g, "").trim();
}

/**
 * Notes store client+guest lines in `services`; the drawer keeps guests separate.
 * Flatten so silent/ER diffs do not mix those shapes.
 */
export function flattenBookingServices(input: {
  services?: readonly CalendarBookingServiceItem[];
  guests?: readonly CalendarBookingGuestItem[];
}): CalendarBookingServiceItem[] {
  const guestLinesFromGuests = (input.guests ?? []).flatMap((guest) =>
    (guest.services ?? []).map((service) => ({
      ...service,
      guestId: service.guestId ?? guest.id,
    })),
  );
  const clientLines = (input.services ?? []).filter(
    (service) => !String(service.guestId ?? "").trim(),
  );
  const guestLinesFromServices = (input.services ?? []).filter((service) =>
    Boolean(String(service.guestId ?? "").trim()),
  );
  const guestLines = guestLinesFromGuests.length
    ? guestLinesFromGuests
    : guestLinesFromServices;
  return [...clientLines, ...guestLines];
}

type IdentityPerson = {
  id?: string;
  name?: string;
  email?: string;
  phoneCode?: string;
  phoneNumber?: string;
  isRequester?: boolean;
  participantType?: CalendarBookingGuestItem["participantType"];
};

function productLineKey(product: {
  id: string;
  guestId?: string | null;
}) {
  return `${product.guestId ?? ""}:${product.id}`;
}

/** Notes store client+guest products flat; drawer keeps guest products nested. */
export function flattenBookingProducts(input: {
  products?: readonly CalendarBookingProductItem[];
  guests?: readonly CalendarBookingGuestItem[];
}): CalendarBookingProductItem[] {
  const guestLinesFromGuests = (input.guests ?? []).flatMap((guest) =>
    (guest.products ?? []).map((product) => ({
      ...product,
      guestId: product.guestId ?? guest.id,
    })),
  );
  const clientLines = (input.products ?? []).filter(
    (product) => !String(product.guestId ?? "").trim(),
  );
  const guestLinesFromProducts = (input.products ?? []).filter((product) =>
    Boolean(String(product.guestId ?? "").trim()),
  );
  const guestLines = guestLinesFromGuests.length
    ? guestLinesFromGuests
    : guestLinesFromProducts;
  const seen = new Set<string>();
  const next: CalendarBookingProductItem[] = [];
  for (const product of [...clientLines, ...guestLines]) {
    const key = productLineKey(product);
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(product);
  }
  return next;
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
  if (
    kind === "planning" ||
    kind === "buffer" ||
    kind === "notes" ||
    (guest.name ?? "").trim() === "Planning"
  ) {
    return false;
  }
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

function peopleAsIdentityGuests(
  people?: readonly IdentityPerson[],
): CalendarBookingGuestItem[] {
  return (people ?? [])
    .filter((person) => !person.isRequester && person.id)
    .filter((person) =>
      isIdentityGuest({
        id: String(person.id),
        name: person.name ?? "",
        participantType: person.participantType,
        services: [],
        products: [],
      }),
    )
    .map((person) => ({
      id: String(person.id),
      name: person.name ?? "",
      email: person.email,
      phoneCode: person.phoneCode,
      phoneNumber: person.phoneNumber,
      participantType: person.participantType ?? "guest",
      services: [],
      products: [],
    }));
}

/** Prefer drawer/notes guests; fall back to clientSnapshot people (DL models). */
export function resolveIdentityGuests(
  guests?: readonly CalendarBookingGuestItem[],
  people?: readonly IdentityPerson[],
): CalendarBookingGuestItem[] {
  const fromGuests = identityGuests(guests);
  if (fromGuests.length) return [...fromGuests];
  return peopleAsIdentityGuests(people);
}

function attachGuestServiceLines(
  guests: readonly CalendarBookingGuestItem[],
  services: readonly CalendarBookingServiceItem[],
): CalendarBookingGuestItem[] {
  return guests.map((guest) => {
    if (guest.services?.length) return guest;
    const attached = services.filter(
      (service) => String(service.guestId ?? "") === guestKey(guest),
    );
    return attached.length ? { ...guest, services: attached } : guest;
  });
}

function guestIdentityFieldsChanged(
  original: CalendarBookingGuestItem,
  guest: CalendarBookingGuestItem,
) {
  return (
    (original.name ?? "").trim() !== (guest.name ?? "").trim() ||
    (original.email ?? "").trim() !== (guest.email ?? "").trim() ||
    phonePart(original.phoneCode) !== phonePart(guest.phoneCode) ||
    phonePart(original.phoneNumber) !== phonePart(guest.phoneNumber)
  );
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
    return original ? guestIdentityFieldsChanged(original, guest) : false;
  });
}

function reorderedServiceIds(
  previous: readonly CalendarBookingServiceItem[],
  current: readonly CalendarBookingServiceItem[],
): string[] {
  if (!isServiceReorderOnly(previous, current)) return [];
  const ids: string[] = [];
  for (let i = 0; i < current.length; i += 1) {
    if (serviceLineKey(current[i]) !== serviceLineKey(previous[i])) {
      ids.push(current[i].id);
    }
  }
  return [...new Set(ids)];
}

export type SilentUpdatedFields = {
  phoneUpdated: boolean;
  guestIds: string[];
  serviceIds: string[];
};

const EMPTY_SILENT_UPDATED_FIELDS: SilentUpdatedFields = {
  phoneUpdated: false,
  guestIds: [],
  serviceIds: [],
};

export type SilentUpdateSnapshotInput = {
  phoneCode?: string | null;
  phoneNumber?: string | null;
  guests?: readonly CalendarBookingGuestItem[] | null;
  services?: readonly CalendarBookingServiceItem[] | null;
  people?: readonly IdentityPerson[] | null;
};

/**
 * Which silent-safe fields changed vs the saved snapshot.
 * Used for first-visit Updated chips on the changed item only.
 */
export function detectSilentUpdatedFields(input: {
  snapshot?: SilentUpdateSnapshotInput | null;
  currentPhoneCode?: string | null;
  currentPhoneNumber?: string | null;
  currentGuests?: readonly CalendarBookingGuestItem[] | null;
  currentPeople?: readonly IdentityPerson[] | null;
  currentServices?: readonly CalendarBookingServiceItem[] | null;
}): SilentUpdatedFields {
  const snapshot = input.snapshot;
  if (!snapshot) return { ...EMPTY_SILENT_UPDATED_FIELDS };

  const phoneUpdated =
    phonePart(snapshot.phoneCode) !== phonePart(input.currentPhoneCode) ||
    phonePart(snapshot.phoneNumber) !== phonePart(input.currentPhoneNumber);

  const previousGuests = resolveIdentityGuests(
    snapshot.guests ?? undefined,
    snapshot.people ?? undefined,
  );
  const currentGuests = resolveIdentityGuests(
    input.currentGuests ?? undefined,
    input.currentPeople ?? undefined,
  );
  const prevById = guestsById(previousGuests);
  const guestIds = currentGuests
    .filter((guest) => {
      const original = prevById.get(guestKey(guest));
      return original ? guestIdentityFieldsChanged(original, guest) : false;
    })
    .map((guest) => guestKey(guest))
    .filter(Boolean);

  const previousServices = flattenBookingServices({
    services: snapshot.services ?? undefined,
    guests: snapshot.guests ?? undefined,
  });
  const currentServices = flattenBookingServices({
    services: input.currentServices ?? undefined,
    guests: input.currentGuests ?? undefined,
  });
  const nestedReorderIds = identityGuests(snapshot.guests ?? undefined).flatMap(
    (guest) => {
      const updated = guestsById(currentGuests).get(guestKey(guest));
      if (!updated) return [];
      return reorderedServiceIds(guest.services ?? [], updated.services ?? []);
    },
  );

  return {
    phoneUpdated,
    guestIds: [...new Set(guestIds)],
    serviceIds: [
      ...new Set([
        ...reorderedServiceIds(previousServices, currentServices),
        ...nestedReorderIds,
      ]),
    ],
  };
}

export function guestsHaveServiceReorderOnly(
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

/** Client or guest service order changed, with no add/remove/content edits. */
export function hasServiceReorderOnly(input: {
  previousServices?: readonly CalendarBookingServiceItem[];
  currentServices?: readonly CalendarBookingServiceItem[];
  previousGuests?: readonly CalendarBookingGuestItem[];
  currentGuests?: readonly CalendarBookingGuestItem[];
}): boolean {
  return (
    isServiceReorderOnly(
      input.previousServices ?? [],
      input.currentServices ?? [],
    ) || guestsHaveServiceReorderOnly(input.previousGuests, input.currentGuests)
  );
}

function guestsHaveApprovalRequiredServiceChanges(
  previous: readonly CalendarBookingGuestItem[] | undefined,
  next: readonly CalendarBookingGuestItem[] | undefined,
) {
  const prev = identityGuests(previous);
  const curr = identityGuests(next);
  if (identityGuestIdsKey(prev) !== identityGuestIdsKey(curr)) return true;
  const currById = guestsById(curr);
  for (const guest of prev) {
    const updated = currById.get(guestKey(guest));
    if (!updated) return true;
    const previousLines = guest.services ?? [];
    const currentLines = updated.services ?? [];
    if (!previousLines.length || !currentLines.length) continue;
    if (listHasContentChanges(previousLines, currentLines)) {
      return true;
    }
    if (listHasTimeOnlyEdits(previousLines, currentLines)) {
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
  previousPeople?: readonly IdentityPerson[];
  currentPeople?: readonly IdentityPerson[];
  previousPhoneCode?: string;
  currentPhoneCode?: string;
  previousPhoneNumber?: string;
  currentPhoneNumber?: string;
  previousProducts?: readonly CalendarBookingProductItem[];
  currentProducts?: readonly CalendarBookingProductItem[];
  scheduleChanged: boolean;
}): boolean {
  const previousGuests = resolveIdentityGuests(
    input.previousGuests,
    input.previousPeople,
  );
  const currentGuests = resolveIdentityGuests(
    input.currentGuests,
    input.currentPeople,
  );
  const previousServices = flattenBookingServices({
    services: input.previousServices,
    guests: input.previousGuests,
  });
  const currentServices = flattenBookingServices({
    services: input.currentServices,
    guests: input.currentGuests,
  });
  const previousProducts = flattenBookingProducts({
    products: input.previousProducts,
    guests: input.previousGuests,
  });
  const currentProducts = flattenBookingProducts({
    products: input.currentProducts,
    guests: input.currentGuests,
  });
  const catalogProducts = (products: readonly CalendarBookingProductItem[]) =>
    products.filter((product) => !String(product.guestId ?? "").trim());
  const guestProducts = (products: readonly CalendarBookingProductItem[]) =>
    products.filter((product) => Boolean(String(product.guestId ?? "").trim()));
  const currentHasNestedGuestProducts = (input.currentGuests ?? []).some(
    (guest) => (guest.products ?? []).length > 0,
  );
  const phoneChanged =
    phonePart(input.previousPhoneCode) !== phonePart(input.currentPhoneCode) ||
    phonePart(input.previousPhoneNumber) !== phonePart(input.currentPhoneNumber);
  const namesChanged = guestIdentityChangedOnly(previousGuests, currentGuests);
  const servicesReordered = hasServiceReorderOnly({
    previousServices,
    currentServices,
    previousGuests,
    currentGuests,
  });
  const hasSilentSafe = phoneChanged || namesChanged || servicesReordered;
  if (!hasSilentSafe) return false;

  const catalogChanged =
    detectEditedProductIds(
      catalogProducts(previousProducts),
      catalogProducts(currentProducts),
    ).length > 0;
  const guestProductChanged = currentHasNestedGuestProducts
    ? detectEditedProductIds(
        guestProducts(previousProducts),
        guestProducts(currentProducts),
      ).length > 0
    : false;
  const productChanged = catalogChanged || guestProductChanged;
  const clientContentChanged = listHasContentChanges(
    previousServices,
    currentServices,
  );
  const clientTimeOnlyEdits = listHasTimeOnlyEdits(
    previousServices,
    currentServices,
  );
  const guestSetChanged =
    identityGuestIdsKey(previousGuests) !== identityGuestIdsKey(currentGuests);
  const guestServiceApprovalRequired =
    !guestSetChanged &&
    guestsHaveApprovalRequiredServiceChanges(
      attachGuestServiceLines(previousGuests, previousServices),
      attachGuestServiceLines(currentGuests, currentServices),
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
