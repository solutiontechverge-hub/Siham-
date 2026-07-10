export type BookingEditRequestStatus =
  | "none"
  | "pending"
  | "approved"
  | "suggested"
  | "rejected";

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
};

export type BookingEditSuggestionPayload = {
  professionalNote?: string;
  editedServiceIds?: string[];
  editedProductIds?: string[];
  suggestedServices?: BookingEditSuggestedService[];
  suggestedProducts?: BookingEditSuggestedProduct[];
};

export type BookingEditRequestRecord = {
  status: BookingEditRequestStatus;
  requestedAt?: string;
  approvedAt?: string;
  suggestedAt?: string;
  rejectedAt?: string;
  /** Optional note from professional when suggesting changes */
  professionalNote?: string;
  editedServiceIds?: string[];
  editedProductIds?: string[];
  suggestedServices?: BookingEditSuggestedService[];
  suggestedProducts?: BookingEditSuggestedProduct[];
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

/** Client sends an edit request to the professional. */
export function sendBookingEditRequest(bookingRef: string): BookingEditRequestRecord {
  const all = loadAll();
  const next: BookingEditRequestRecord = {
    status: "pending",
    requestedAt: new Date().toISOString(),
  };
  all[bookingRef] = next;
  saveAll(all);
  return next;
}

/** Professional approves the client's edit request. */
export function approveBookingEditRequest(bookingRef: string): BookingEditRequestRecord {
  const all = loadAll();
  const prev = all[bookingRef] ?? getBookingEditRequest(bookingRef);
  const next: BookingEditRequestRecord = {
    status: "approved",
    requestedAt: prev?.requestedAt,
    approvedAt: new Date().toISOString(),
  };
  all[bookingRef] = next;
  saveAll(all);
  return next;
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
    suggestedServices: payload.suggestedServices,
    suggestedProducts: payload.suggestedProducts,
  };
  const normalized = bookingRef.replace(/^#/, "").trim();
  all[bookingRef] = next;
  if (normalized && normalized !== bookingRef) all[normalized] = next;
  saveAll(all);
  return next;
}

/** Professional rejects the client's edit request. */
export function professionalRejectEditRequest(bookingRef: string): BookingEditRequestRecord {
  const all = loadAll();
  const prev = all[bookingRef] ?? getBookingEditRequest(bookingRef);
  const next: BookingEditRequestRecord = {
    status: "rejected",
    requestedAt: prev?.requestedAt,
    rejectedAt: new Date().toISOString(),
  };
  all[bookingRef] = next;
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
