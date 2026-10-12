/**
 * Run with: npx --yes tsx src/components/common/finance-documents/protectiveFeeInvoice.test.ts
 */
import assert from "node:assert/strict";
import {
  ensureProtectiveFeeLineDescription,
  formatProtectiveFeeLineDescription,
  isProtectiveFeeEntryLabel,
  isProtectiveFeeLineDescription,
  LATE_CANCELLATION_BOOKING_FEE,
  LATE_RESCHEDULING_FEE,
} from "./protectiveFeeInvoice";

assert.equal(
  formatProtectiveFeeLineDescription("lateRescheduling", 10, 230),
  "Late Rescheduling Fee (10% Of €230)",
);
assert.equal(
  formatProtectiveFeeLineDescription("lateCancellation", 10, 230),
  "Late Cancellation Booking Fee (10% Of €230)",
);
assert.equal(
  formatProtectiveFeeLineDescription("lateCancellation", 10, 230.5),
  "Late Cancellation Booking Fee (10% Of €230.50)",
);
assert.equal(isProtectiveFeeEntryLabel(LATE_CANCELLATION_BOOKING_FEE), true);
assert.equal(isProtectiveFeeEntryLabel(LATE_RESCHEDULING_FEE), true);
assert.equal(isProtectiveFeeEntryLabel("Booking"), false);
assert.equal(
  isProtectiveFeeLineDescription("Late Rescheduling Fee (10% Of €230)"),
  true,
);
assert.equal(
  ensureProtectiveFeeLineDescription(LATE_CANCELLATION_BOOKING_FEE, {
    entryLabel: LATE_CANCELLATION_BOOKING_FEE,
    percent: 10,
    baseAmount: 230,
  }),
  "Late Cancellation Booking Fee (10% Of €230)",
);
assert.equal(
  ensureProtectiveFeeLineDescription(
    "Late Cancellation Booking Fee (10% Of €230)",
    { percent: 10, baseAmount: 230 },
  ),
  "Late Cancellation Booking Fee (10% Of €230)",
);

console.log("protectiveFeeInvoice.test.ts: ok");
