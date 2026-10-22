export type BookingCancellationReasonRecord = {
  reason: string;
  cancelledAt?: string;
};

/** In-memory only — durable reason lives on bookings.notes.cancellationReason. */
let memory: Record<string, BookingCancellationReasonRecord> = {};

function normalizeRef(bookingRef: string): string {
  return bookingRef.replace(/^#/, "").trim();
}

export function getBookingCancellationReason(
  bookingRef: string,
): BookingCancellationReasonRecord | null {
  if (!bookingRef) return null;
  const normalized = normalizeRef(bookingRef);
  const record =
    memory[bookingRef] ?? memory[normalized] ?? memory[`#${normalized}`];
  if (!record?.reason?.trim()) return null;
  return { reason: record.reason.trim(), cancelledAt: record.cancelledAt };
}

export function setBookingCancellationReason(
  bookingRef: string,
  reason: string,
): void {
  const trimmed = reason.trim();
  if (!bookingRef || !trimmed) return;
  const normalized = normalizeRef(bookingRef);
  const next: BookingCancellationReasonRecord = {
    reason: trimmed,
    cancelledAt: new Date().toISOString(),
  };
  memory = {
    ...memory,
    [normalized]: next,
    [`#${normalized}`]: next,
  };
}
