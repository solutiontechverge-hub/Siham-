const NOTES_META_PREFIX = "---mollure-meta---";

/** Minutes after scheduled end without checkout/payment → walk-out (no auto-complete). */
export const BOOKING_WALKOUT_GRACE_MINUTES = Number(
  process.env.BOOKING_WALKOUT_GRACE_MINUTES || 30,
);

/** Parse ---mollure-meta--- JSON (or raw JSON notes). */
export function parseBookingNotesMeta(notes) {
  if (!notes || typeof notes !== "string") return {};
  const marker = notes.indexOf(NOTES_META_PREFIX);
  const raw =
    marker === -1
      ? notes.trim()
      : notes.slice(marker + NOTES_META_PREFIX.length).trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Close-out ready for Completed — not merely because the clock passed.
 * Every billed payer must be paid. Invoice / waitingForPayment alone is not
 * settlement — stay In Progress until the pending amount is paid.
 */
export function isCheckoutCloseOutComplete(meta) {
  if (meta?.waitingForPayment) return false;
  const payers = meta?.splitBill?.payers;
  if (!Array.isArray(payers) || payers.length === 0) return false;
  return payers.every(
    (payer) => !(Number(payer?.paymentAmount) > 0) || payer?.paid === true,
  );
}

/**
 * Walk-out: scheduled end + BOOKING_WALKOUT_GRACE_MINUTES passed and still no
 * checkout/payment close-out → block auto-complete (stay in_progress for
 * manual unpaid marking). Intentional invoice / payment-pending is not a walk-out.
 */
export function isWalkOutBlockingAutoComplete(
  meta,
  endTime,
  bookingDate,
  now = new Date(),
  graceMinutes = BOOKING_WALKOUT_GRACE_MINUTES,
) {
  if (isCheckoutCloseOutComplete(meta)) return false;
  const due =
    typeof meta?.invoiceDueDate === "string" ? meta.invoiceDueDate.trim() : "";
  if (due || meta?.waitingForPayment) return false;
  const graceMs = graceMinutes * 60 * 1000;
  if (endTime != null) {
    const endMs = new Date(endTime).getTime();
    if (!Number.isNaN(endMs)) return now.getTime() >= endMs + graceMs;
  }
  if (bookingDate != null) {
    const day = String(bookingDate).slice(0, 10);
    const today = now.toISOString().slice(0, 10);
    return Boolean(day) && day < today;
  }
  return false;
}
