export type BookingCancellationReasonRecord = {
  reason: string;
  cancelledAt?: string;
};

const STORAGE_KEY = "mollure:booking_cancellation_reasons";

function normalizeRef(bookingRef: string): string {
  return bookingRef.replace(/^#/, "").trim();
}

function loadAll(): Record<string, BookingCancellationReasonRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, BookingCancellationReasonRecord>;
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, BookingCancellationReasonRecord>) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(data);
  window.localStorage.setItem(STORAGE_KEY, raw);
  window.sessionStorage.setItem(STORAGE_KEY, raw);
}

export function getBookingCancellationReason(bookingRef: string): BookingCancellationReasonRecord | null {
  if (!bookingRef) return null;
  const all = loadAll();
  const normalized = normalizeRef(bookingRef);
  const record = all[bookingRef] ?? all[normalized] ?? all[`#${normalized}`];
  if (!record?.reason?.trim()) return null;
  return { reason: record.reason.trim(), cancelledAt: record.cancelledAt };
}

export function setBookingCancellationReason(bookingRef: string, reason: string): void {
  const trimmed = reason.trim();
  if (!bookingRef || !trimmed) return;
  const all = loadAll();
  const normalized = normalizeRef(bookingRef);
  const next: BookingCancellationReasonRecord = {
    reason: trimmed,
    cancelledAt: new Date().toISOString(),
  };
  all[normalized] = next;
  all[`#${normalized}`] = next;
  saveAll(all);
}
