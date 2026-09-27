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

console.log("bookingAutoCompleteCloseOut.test.js: ok");
