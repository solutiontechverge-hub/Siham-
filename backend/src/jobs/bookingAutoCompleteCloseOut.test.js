/**
 * Run with: node src/jobs/bookingAutoCompleteCloseOut.test.js
 */
import assert from "node:assert/strict";
import {
  BOOKING_WALKOUT_GRACE_MINUTES,
  isCheckoutCloseOutComplete,
  isWalkOutBlockingAutoComplete,
  parseBookingNotesMeta,
} from "./bookingAutoCompleteCloseOut.js";

assert.equal(BOOKING_WALKOUT_GRACE_MINUTES, 30);

assert.deepEqual(parseBookingNotesMeta(null), {});
assert.equal(
  parseBookingNotesMeta("---mollure-meta---\n{\"invoiceDueDate\":\"2026-09-30\"}").invoiceDueDate,
  "2026-09-30",
);

assert.equal(isCheckoutCloseOutComplete({}), false);
assert.equal(isCheckoutCloseOutComplete({ waitingForPayment: true }), false);
assert.equal(
  isCheckoutCloseOutComplete({ invoiceDueDate: "2026-09-30", waitingForPayment: true }),
  false,
);
assert.equal(isCheckoutCloseOutComplete({ invoiceDueDate: "2026-09-30" }), false);
assert.equal(
  isCheckoutCloseOutComplete({
    splitBill: {
      payers: [
        { paymentAmount: 40, paid: true },
        { paymentAmount: 20, paid: false },
      ],
    },
  }),
  false,
);
assert.equal(
  isCheckoutCloseOutComplete({
    waitingForPayment: true,
    splitBill: {
      payers: [
        { paymentAmount: 40, paid: true },
        { paymentAmount: 20, paid: true },
      ],
    },
  }),
  false,
);
assert.equal(
  isCheckoutCloseOutComplete({
    splitBill: {
      payers: [
        { paymentAmount: 40, paid: true },
        { paymentAmount: 20, paid: true },
      ],
    },
  }),
  true,
);

const end = new Date("2026-09-23T10:00:00.000Z");
assert.equal(
  isWalkOutBlockingAutoComplete({}, end, null, new Date("2026-09-23T10:20:00.000Z")),
  false,
);
assert.equal(
  isWalkOutBlockingAutoComplete({}, end, null, new Date("2026-09-23T10:30:00.000Z")),
  true,
);
assert.equal(
  isWalkOutBlockingAutoComplete(
    { invoiceDueDate: "2026-09-30", waitingForPayment: true },
    end,
    null,
    new Date("2026-09-23T11:00:00.000Z"),
  ),
  false,
);

/** Mirrors PAST_END_SQL in bookingAutoComplete.job.js (confirmed → completed). */
function isPastScheduledEnd(endTime, bookingDate, now) {
  if (endTime != null) {
    const endMs = new Date(endTime).getTime();
    if (!Number.isNaN(endMs)) return now.getTime() >= endMs;
  }
  if (bookingDate != null) {
    const day = String(bookingDate).slice(0, 10);
    const today = now.toISOString().slice(0, 10);
    return Boolean(day) && day < today;
  }
  return false;
}

assert.equal(
  isPastScheduledEnd(end, null, new Date("2026-09-23T09:59:00.000Z")),
  false,
);
assert.equal(
  isPastScheduledEnd(end, null, new Date("2026-09-23T10:00:00.000Z")),
  true,
);
assert.equal(
  isPastScheduledEnd(null, "2026-09-22", new Date("2026-09-23T00:00:00.000Z")),
  true,
);

console.log("bookingAutoCompleteCloseOut.test.js: ok");
