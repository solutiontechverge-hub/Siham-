/**
 * Run with: node src/utils/cancellationFeePolicy.test.js
 */
import assert from "node:assert/strict";
import {
  deriveCancellationPaymentStatus,
  evaluateCancellationFeePolicy,
  hoursUntilAppointment,
  isLateCancellation,
} from "./cancellationFeePolicy.js";

const start = Date.parse("2026-10-22T15:00:00.000Z");

// Outside 24h window → free
assert.equal(
  isLateCancellation({
    appointmentStartMs: start,
    noticeHours: 24,
    nowMs: start - 25 * 60 * 60 * 1000,
  }),
  false,
);

// Inside 24h window → late
assert.equal(
  isLateCancellation({
    appointmentStartMs: start,
    noticeHours: 24,
    nowMs: start - 2 * 60 * 60 * 1000,
  }),
  true,
);

assert.equal(hoursUntilAppointment(start, start - 90 * 60 * 1000), 1.5);

// Free cancel: full prepay refunded
const free = evaluateCancellationFeePolicy({
  appointmentStartMs: start,
  noticeHours: 24,
  nowMs: start - 48 * 60 * 60 * 1000,
  bookingTotal: 200,
  feePercent: 50,
  prepaidPaid: 40,
});
assert.equal(free.isLateCancellation, false);
assert.equal(free.cancellationFee, 0);
assert.equal(free.refundAmount, 40);
assert.equal(free.amountDueNow, 0);
assert.equal(free.paymentStatus, "REFUNDED");

// Late: prepaid > fee → partial refund
const partial = evaluateCancellationFeePolicy({
  appointmentStartMs: start,
  noticeHours: 24,
  nowMs: start - 2 * 60 * 60 * 1000,
  bookingTotal: 200,
  feePercent: 25,
  prepaidPaid: 100,
});
assert.equal(partial.isLateCancellation, true);
assert.equal(partial.cancellationFee, 50);
assert.equal(partial.appliedFromPrepaid, 50);
assert.equal(partial.refundAmount, 50);
assert.equal(partial.amountDueNow, 0);
assert.equal(partial.paymentStatus, "PARTIALLY_REFUNDED");

// Late: prepaid < fee → outstanding
const due = evaluateCancellationFeePolicy({
  appointmentStartMs: start,
  noticeHours: 24,
  nowMs: start - 1 * 60 * 60 * 1000,
  bookingTotal: 200,
  feePercent: 50,
  prepaidPaid: 30,
});
assert.equal(due.cancellationFee, 100);
assert.equal(due.appliedFromPrepaid, 30);
assert.equal(due.refundAmount, 0);
assert.equal(due.amountDueNow, 70);
assert.equal(due.paymentStatus, "PENDING_FEE");

// Flat fee overrides percent when set
const flat = evaluateCancellationFeePolicy({
  appointmentStartMs: start,
  noticeHours: 24,
  nowMs: start - 1 * 60 * 60 * 1000,
  bookingTotal: 200,
  feePercent: 50,
  flatFeeAmount: 15,
  prepaidPaid: 0,
});
assert.equal(flat.cancellationFee, 15);
assert.equal(flat.paymentStatus, "PENDING_FEE");

assert.equal(
  deriveCancellationPaymentStatus({
    late: true,
    cancellationFee: 40,
    prepaidPaid: 40,
    refundAmount: 0,
    amountDueNow: 0,
  }),
  "REFUNDED",
);

console.log("cancellationFeePolicy.test.js: ok");
