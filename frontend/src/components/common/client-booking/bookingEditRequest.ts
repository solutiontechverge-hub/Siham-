export type BookingEditRequestStatus =
  | "none"
  | "pending"
  | "approved"
  | "suggested"
  | "rejected";

export type BookingEditRequestRecord = {
  status: BookingEditRequestStatus;
  requestedAt?: string;
  approvedAt?: string;
  suggestedAt?: string;
  rejectedAt?: string;
  /** Optional note from professional when suggesting changes */
  professionalNote?: string;
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
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, BookingEditRequestRecord>;
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, BookingEditRequestRecord>) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  notifyBookingEditRequestUpdated();
}

export function getBookingEditRequest(bookingRef: string): BookingEditRequestRecord {
  const record = loadAll()[bookingRef];
  return record ?? { status: "none" };
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
  const prev = all[bookingRef];
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
  professionalNote?: string,
): BookingEditRequestRecord {
  const all = loadAll();
  const next: BookingEditRequestRecord = {
    status: "suggested",
    suggestedAt: new Date().toISOString(),
    professionalNote,
  };
  all[bookingRef] = next;
  saveAll(all);
  return next;
}

/** Professional rejects the client's edit request. */
export function professionalRejectEditRequest(bookingRef: string): BookingEditRequestRecord {
  const all = loadAll();
  const prev = all[bookingRef];
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
  all[bookingRef] = next;
  saveAll(all);
  return next;
}

/** Client acknowledges rejection (Ok) — clears ER state. */
export function clientAcknowledgeRejectedEdit(bookingRef: string): BookingEditRequestRecord {
  const all = loadAll();
  const next: BookingEditRequestRecord = { status: "none" };
  all[bookingRef] = next;
  saveAll(all);
  return next;
}

export function isBookingEditApproved(bookingRef: string): boolean {
  return getBookingEditRequest(bookingRef).status === "approved";
}
