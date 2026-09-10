export type BookingEditRequestStatus =
  | "none"
  | "pending"
  | "approved"
  | "suggested"
  | "rejected"
  | "accepted";

export type EditRequestInitiator = "client" | "professional";

export type BookingEditSuggestedService = {
  id: string;
  name: string;
  durationMins: number;
  price: number;
  teamMemberId?: string | null;
  teamMemberName?: string;
  guestId?: string | null;
  startTime?: string;
  endTime?: string;
};

export type BookingEditSuggestedProduct = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  originalPrice?: number;
  discountType?: "fixed" | "percentage";
  discountAmount?: number;
  guestId?: string | null;
};

export type BookingEditSuggestionPayload = {
  professionalNote?: string;
  editedServiceIds?: string[];
  editedProductIds?: string[];
  addedServiceIds?: string[];
  cancelledServiceIds?: string[];
  addedProductIds?: string[];
  cancelledProductIds?: string[];
  suggestedServices?: BookingEditSuggestedService[];
  suggestedProducts?: BookingEditSuggestedProduct[];
  suggestedDateISO?: string;
  suggestedTime?: string;
  originalDateISO?: string;
  originalTime?: string;
};

export type BookingEditRequestRecord = {
  status: BookingEditRequestStatus;
  requestedAt?: string;
  approvedAt?: string;
  suggestedAt?: string;
  rejectedAt?: string;
  acceptedAt?: string;
  /** Who started this Confirmed Edit Request (ER). */
  initiatedBy?: EditRequestInitiator;
  /** Required notepad message for Confirmed ER. */
  note?: string;
  /**
   * After Accept: one edit/save window is open.
   * Cleared when the requester saves once (then a new ER is required).
   */
  editGrantActive?: boolean;
  /** Optional note from professional when suggesting changes */
  professionalNote?: string;
  /** Optional note from client when suggesting changes on an EBR */
  clientNote?: string;
  editedServiceIds?: string[];
  editedProductIds?: string[];
  addedServiceIds?: string[];
  cancelledServiceIds?: string[];
  addedProductIds?: string[];
  cancelledProductIds?: string[];
  suggestedServices?: BookingEditSuggestedService[];
  suggestedProducts?: BookingEditSuggestedProduct[];
  /** Client-requested schedule kept when professional rejects an EBR. */
  suggestedDateISO?: string;
  suggestedTime?: string;
  originalDateISO?: string;
  originalTime?: string;
};

const STORAGE_KEY = "mollure:booking_edit_requests";
export const BOOKING_EDIT_REQUEST_UPDATED_EVENT = "mollure:booking-edit-request-updated";

export function notifyBookingEditRequestUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(BOOKING_EDIT_REQUEST_UPDATED_EVENT));
}

function loadAll(): Record<string, BookingEditRequestRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, BookingEditRequestRecord>;
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, BookingEditRequestRecord>) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(data);
  window.localStorage.setItem(STORAGE_KEY, raw);
  // Keep legacy session copy in sync for same-tab readers.
  window.sessionStorage.setItem(STORAGE_KEY, raw);
  notifyBookingEditRequestUpdated();
}

export function getBookingEditRequest(bookingRef: string): BookingEditRequestRecord {
  if (!bookingRef) return { status: "none" };
  const all = loadAll();
  const normalized = bookingRef.replace(/^#/, "").trim();
  return all[bookingRef] ?? all[normalized] ?? all[`#${normalized}`] ?? { status: "none" };
}

/** Client or professional sends a Confirmed Edit Request (ER). Note is required. */
export function sendBookingEditRequest(
  bookingRef: string,
  options?: {
    note?: string;
    initiatedBy?: EditRequestInitiator;
  },
): BookingEditRequestRecord {
  const note = options?.note?.trim() ?? "";
  const all = loadAll();
  const next: BookingEditRequestRecord = {
    status: "pending",
    requestedAt: new Date().toISOString(),
    initiatedBy: options?.initiatedBy ?? "client",
    note: note || undefined,
    editGrantActive: false,
  };
  const normalized = bookingRef.replace(/^#/, "").trim();
  all[bookingRef] = next;
  if (normalized && normalized !== bookingRef) all[normalized] = next;
  saveAll(all);
  return next;
}

/** Professional or peer approves the edit request — opens one save window for the requester. */
export function approveBookingEditRequest(bookingRef: string): BookingEditRequestRecord {
  const all = loadAll();
  const prev = all[bookingRef] ?? getBookingEditRequest(bookingRef);
  const next: BookingEditRequestRecord = {
    status: "approved",
    requestedAt: prev?.requestedAt,
    approvedAt: new Date().toISOString(),
    initiatedBy: prev?.initiatedBy,
    note: prev?.note,
    editGrantActive: true,
  };
  const normalized = bookingRef.replace(/^#/, "").trim();
  all[bookingRef] = next;
  if (normalized && normalized !== bookingRef) all[normalized] = next;
  saveAll(all);
  return next;
}

/** True when the requester may open the normal edit flow (after Accept, before first save). */
export function isConfirmedEditGrantActive(
  bookingRef: string,
  forInitiator?: EditRequestInitiator,
): boolean {
  const record = getBookingEditRequest(bookingRef);
  if (record.status !== "approved" || !record.editGrantActive) return false;
  if (forInitiator && record.initiatedBy !== forInitiator) return false;
  return true;
}

/** Call after a successful Update/save to require a new ER next time. */
export function consumeConfirmedEditGrant(bookingRef: string): BookingEditRequestRecord {
  const all = loadAll();
  const prev = all[bookingRef] ?? getBookingEditRequest(bookingRef);
  const next: BookingEditRequestRecord = {
    ...prev,
    status: "none",
    editGrantActive: false,
  };
  const normalized = bookingRef.replace(/^#/, "").trim();
  all[bookingRef] = next;
  if (normalized && normalized !== bookingRef) all[normalized] = next;
  saveAll(all);
  return next;
}

/** Hydrate local ER cache from API notes (cross-user sync). */
export function syncBookingEditRequestFromRemote(
  bookingRef: string,
  remote: Partial<BookingEditRequestRecord> | null | undefined,
): void {
  if (!bookingRef || !remote) return;
  const all = loadAll();
  const normalized = bookingRef.replace(/^#/, "").trim();
  const next: BookingEditRequestRecord = {
    status: remote.status ?? "none",
    requestedAt: remote.requestedAt,
    approvedAt: remote.approvedAt,
    suggestedAt: remote.suggestedAt,
    rejectedAt: remote.rejectedAt,
    acceptedAt: remote.acceptedAt,
    initiatedBy: remote.initiatedBy,
    note: remote.note,
    editGrantActive: remote.editGrantActive,
    professionalNote: remote.professionalNote,
    clientNote: remote.clientNote,
  };
  all[bookingRef] = next;
  if (normalized && normalized !== bookingRef) all[normalized] = next;
  saveAll(all);
}

/** Professional suggests changes — client must accept to confirm. */
export function professionalSuggestBookingChanges(
  bookingRef: string,
  professionalNoteOrPayload?: string | BookingEditSuggestionPayload,
): BookingEditRequestRecord {
  const payload: BookingEditSuggestionPayload =
    typeof professionalNoteOrPayload === "string" || professionalNoteOrPayload == null
      ? { professionalNote: professionalNoteOrPayload }
      : professionalNoteOrPayload;

  const all = loadAll();
  const next: BookingEditRequestRecord = {
    status: "suggested",
    suggestedAt: new Date().toISOString(),
    professionalNote: payload.professionalNote,
    editedServiceIds: payload.editedServiceIds ?? [],
    editedProductIds: payload.editedProductIds ?? [],
    addedServiceIds: payload.addedServiceIds,
    cancelledServiceIds: payload.cancelledServiceIds,
    addedProductIds: payload.addedProductIds,
    cancelledProductIds: payload.cancelledProductIds,
    suggestedServices: payload.suggestedServices,
    suggestedProducts: payload.suggestedProducts,
    suggestedDateISO: payload.suggestedDateISO,
    suggestedTime: payload.suggestedTime,
    originalDateISO: payload.originalDateISO,
    originalTime: payload.originalTime,
  };
  const normalized = bookingRef.replace(/^#/, "").trim();
  all[bookingRef] = next;
  if (normalized && normalized !== bookingRef) all[normalized] = next;
  saveAll(all);
  return next;
}

/** Professional rejects the client's edit request (optionally keep what the client asked for). */
export function professionalRejectEditRequest(
  bookingRef: string,
  payload?: Partial<
    Pick<
      BookingEditRequestRecord,
      | "clientNote"
      | "editedServiceIds"
      | "editedProductIds"
      | "suggestedServices"
      | "suggestedProducts"
      | "suggestedDateISO"
      | "suggestedTime"
      | "originalDateISO"
      | "originalTime"
    >
  >,
): BookingEditRequestRecord {
  const all = loadAll();
  const prev = all[bookingRef] ?? getBookingEditRequest(bookingRef);
  const next: BookingEditRequestRecord = {
    status: "rejected",
    requestedAt: prev?.requestedAt,
    rejectedAt: new Date().toISOString(),
    clientNote: payload?.clientNote ?? prev?.clientNote,
    editedServiceIds: payload?.editedServiceIds ?? prev?.editedServiceIds,
    editedProductIds: payload?.editedProductIds ?? prev?.editedProductIds,
    suggestedServices: payload?.suggestedServices ?? prev?.suggestedServices,
    suggestedProducts: payload?.suggestedProducts ?? prev?.suggestedProducts,
    suggestedDateISO: payload?.suggestedDateISO ?? prev?.suggestedDateISO,
    suggestedTime: payload?.suggestedTime ?? prev?.suggestedTime,
    originalDateISO: payload?.originalDateISO ?? prev?.originalDateISO,
    originalTime: payload?.originalTime ?? prev?.originalTime,
  };
  const normalized = bookingRef.replace(/^#/, "").trim();
  all[bookingRef] = next;
  if (normalized && normalized !== bookingRef) all[normalized] = next;
  saveAll(all);
  return next;
}

/** Professional accepted the client's post-confirm EBR (outcome banner on client). */
export function professionalAcceptClientEditRequest(
  bookingRef: string,
  payload?: Partial<
    Pick<
      BookingEditRequestRecord,
      | "clientNote"
      | "editedServiceIds"
      | "editedProductIds"
      | "suggestedServices"
      | "suggestedProducts"
      | "suggestedDateISO"
      | "suggestedTime"
      | "originalDateISO"
      | "originalTime"
    >
  >,
): BookingEditRequestRecord {
  const all = loadAll();
  const prev = all[bookingRef] ?? getBookingEditRequest(bookingRef);
  const next: BookingEditRequestRecord = {
    status: "accepted",
    requestedAt: prev?.requestedAt,
    acceptedAt: new Date().toISOString(),
    clientNote: payload?.clientNote ?? prev?.clientNote,
    editedServiceIds: payload?.editedServiceIds ?? prev?.editedServiceIds,
    editedProductIds: payload?.editedProductIds ?? prev?.editedProductIds,
    suggestedServices: payload?.suggestedServices ?? prev?.suggestedServices,
    suggestedProducts: payload?.suggestedProducts ?? prev?.suggestedProducts,
    suggestedDateISO: payload?.suggestedDateISO ?? prev?.suggestedDateISO,
    suggestedTime: payload?.suggestedTime ?? prev?.suggestedTime,
    originalDateISO: payload?.originalDateISO ?? prev?.originalDateISO,
    originalTime: payload?.originalTime ?? prev?.originalTime,
  };
  const normalized = bookingRef.replace(/^#/, "").trim();
  all[bookingRef] = next;
  if (normalized && normalized !== bookingRef) all[normalized] = next;
  saveAll(all);
  return next;
}

/** Client accepts professional's suggested changes — booking can move to confirmed. */
export function clientAcceptSuggestedChanges(bookingRef: string): BookingEditRequestRecord {
  const all = loadAll();
  const next: BookingEditRequestRecord = {
    status: "none",
    approvedAt: new Date().toISOString(),
  };
  const normalized = bookingRef.replace(/^#/, "").trim();
  all[bookingRef] = next;
  if (normalized && normalized !== bookingRef) all[normalized] = next;
  saveAll(all);
  return next;
}

/** Client rejects professional's EBR — booking becomes invalid. */
export function clientRejectSuggestedChanges(bookingRef: string): BookingEditRequestRecord {
  const all = loadAll();
  const prev = all[bookingRef] ?? getBookingEditRequest(bookingRef);
  const next: BookingEditRequestRecord = {
    status: "rejected",
    requestedAt: prev?.requestedAt,
    suggestedAt: prev?.suggestedAt,
    rejectedAt: new Date().toISOString(),
    professionalNote: prev?.professionalNote,
    editedServiceIds: prev?.editedServiceIds,
    editedProductIds: prev?.editedProductIds,
    suggestedServices: prev?.suggestedServices,
    suggestedProducts: prev?.suggestedProducts,
  };
  const normalized = bookingRef.replace(/^#/, "").trim();
  all[bookingRef] = next;
  if (normalized && normalized !== bookingRef) all[normalized] = next;
  saveAll(all);
  return next;
}

export function clearBookingEditRequest(bookingRef: string): void {
  if (!bookingRef) return;
  const all = loadAll();
  const normalized = bookingRef.replace(/^#/, "").trim();
  delete all[bookingRef];
  if (normalized && normalized !== bookingRef) delete all[normalized];
  saveAll(all);
}

/**
 * Client suggests changes on an EBR — returns a pending BR to the professional
 * with an optional notepad message and edited line ids.
 */
export function clientSuggestEbrChanges(
  bookingRef: string,
  clientNoteOrPayload?: string | (BookingEditSuggestionPayload & { clientNote?: string }),
): BookingEditRequestRecord {
  const payload: BookingEditSuggestionPayload & { clientNote?: string } =
    typeof clientNoteOrPayload === "string" || clientNoteOrPayload == null
      ? { clientNote: clientNoteOrPayload ?? undefined }
      : clientNoteOrPayload;

  const all = loadAll();
  const prev = all[bookingRef] ?? getBookingEditRequest(bookingRef);
  const next: BookingEditRequestRecord = {
    status: "pending",
    requestedAt: new Date().toISOString(),
    suggestedAt: prev?.suggestedAt,
    professionalNote: prev?.professionalNote,
    clientNote: payload.clientNote?.trim() || undefined,
    editedServiceIds: payload.editedServiceIds ?? prev?.editedServiceIds,
    editedProductIds: payload.editedProductIds ?? prev?.editedProductIds,
    addedServiceIds: payload.addedServiceIds ?? prev?.addedServiceIds,
    cancelledServiceIds:
      payload.cancelledServiceIds ?? prev?.cancelledServiceIds,
    addedProductIds: payload.addedProductIds ?? prev?.addedProductIds,
    cancelledProductIds:
      payload.cancelledProductIds ?? prev?.cancelledProductIds,
    suggestedServices: payload.suggestedServices ?? prev?.suggestedServices,
    suggestedProducts: payload.suggestedProducts ?? prev?.suggestedProducts,
  };
  const normalized = bookingRef.replace(/^#/, "").trim();
  all[bookingRef] = next;
  if (normalized && normalized !== bookingRef) all[normalized] = next;
  saveAll(all);
  return next;
}

/** Client acknowledges rejection (Ok) — clears ER state. */
export function clientAcknowledgeRejectedEdit(bookingRef: string): BookingEditRequestRecord {
  const all = loadAll();
  const next: BookingEditRequestRecord = { status: "none" };
  const normalized = bookingRef.replace(/^#/, "").trim();
  all[bookingRef] = next;
  if (normalized && normalized !== bookingRef) all[normalized] = next;
  saveAll(all);
  return next;
}

export function isBookingEditApproved(bookingRef: string): boolean {
  return getBookingEditRequest(bookingRef).status === "approved";
}
