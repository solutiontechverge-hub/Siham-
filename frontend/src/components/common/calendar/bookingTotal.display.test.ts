/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingTotal.display.test.ts
 */
import assert from "node:assert/strict";
import { resolveBookingPriceDisplay } from "./bookingTotal";

const prepaidBreakdown = {
  lineSubtotal: 88,
  extrasAmount: 0,
  discountAmount: 0,
  afterDiscount: 88,
  lateCancellationFeeAmount: 0,
  lateRescheduleFeeAmount: 0,
  noShowFeeAmount: 0,
  feesTotal: 0,
  bookingTotal: 88,
  prepaymentAmount: 17.6,
  prepaidApplied: 17.6,
  payableTotal: 70.4,
  remainingAfterPrepayment: 70.4,
};

const paid = resolveBookingPriceDisplay({
  breakdown: prepaidBreakdown,
  prepaymentPaid: true,
});
assert.equal(paid.displayTotal, 88);
assert.equal(paid.originalPrice, null);

const discounted = resolveBookingPriceDisplay({
  breakdown: { ...prepaidBreakdown, discountAmount: 10, bookingTotal: 78 },
  prepaymentPaid: true,
});
assert.equal(discounted.displayTotal, 78);
assert.equal(discounted.originalPrice, 88);

console.log("bookingTotal.display.test.ts: ok");
