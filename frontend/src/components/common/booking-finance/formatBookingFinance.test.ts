/**
 * Run with: npx --yes tsx src/components/common/booking-finance/formatBookingFinance.test.ts
 */
import assert from "node:assert/strict";
import {
  prepaidBreakdownLabel,
  remainingBreakdownLabel,
} from "./formatBookingFinance";

assert.equal(prepaidBreakdownLabel(50, true), "Prepaid (50%)");
assert.equal(prepaidBreakdownLabel(25, false), "Prepayment (25%)");
assert.equal(prepaidBreakdownLabel(0, true), "Prepaid");

assert.equal(remainingBreakdownLabel(50), "Remaining (50%)");
assert.equal(remainingBreakdownLabel(30), "Remaining (70%)");
assert.equal(remainingBreakdownLabel(0, 77, 154), "Remaining (50%)");
assert.equal(remainingBreakdownLabel(0), "Remaining");
assert.equal(remainingBreakdownLabel(20, 70.4, 88, true), "100% Paid");
assert.equal(remainingBreakdownLabel(0, undefined, undefined, true), "100% Paid");

console.log("formatBookingFinance.test.ts: ok");
