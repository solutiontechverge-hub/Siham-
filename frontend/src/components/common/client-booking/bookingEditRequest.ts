export type BookingEditRequestStatus = "none" | "pending" | "approved";

export type BookingEditRequestRecord = {
  status: BookingEditRequestStatus;
  requestedAt?: string;
  approvedAt?: string;
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
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, BookingEditRequestRecord>;
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, BookingEditRequestRecord>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  notifyBookingEditRequestUpdated();
}

export function getBookingEditRequest(bookingRef: string): BookingEditRequestRecord {
  const record = loadAll()[bookingRef];
  return record ?? { status: "none" };
}

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

/** Called when the professional approves the client's edit request. */
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

export function isBookingEditApproved(bookingRef: string): boolean {
  return getBookingEditRequest(bookingRef).status === "approved";
}
