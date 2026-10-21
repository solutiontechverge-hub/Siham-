/**
 * Run with: node src/utils/bookingFinancialLedger.test.js
 */
import assert from "node:assert/strict";
import {
  computeBookingFinancials,
  derivePaymentStatus,
  deriveStatusesFromFinancials,
  isValidLedgerRow,
  selectBurstDedupedAddonRows,
} from "./bookingFinancialLedger.js";

assert.equal(isValidLedgerRow({ status: "completed" }), true);
assert.equal(isValidLedgerRow({ status: "voided" }), false);
assert.equal(isValidLedgerRow({ status: "pending" }), false);

const rows = [
  { type: "ADD_ON", amount: 20, status: "completed" },
  { type: "ADD_ON", amount: 10, status: "voided" },
  { type: "DISCOUNT", amount: 5, status: "completed" },
  { type: "CANCELLATION_FEE", amount: 15, status: "completed" },
  { type: "PREPAYMENT", amount: 30, status: "completed" },
  { type: "PAYMENT", amount: 50, status: "completed" },
  { type: "REFUND", amount: 10, status: "completed" },
  { type: "PAYMENT", amount: 100, status: "pending" },
  {
    type: "ADD_ON",
    amount: 0,
    status: "completed",
    metadata: { tax: 2.5 },
  },
];

const f = computeBookingFinancials(rows, { basePrice: 100, baseTax: 1 });
// subtotal = 100 + 20 = 120 (voided add-on ignored)
assert.equal(f.subtotal, 120);
assert.equal(f.cancellation_fee, 15);
assert.equal(f.total_paid, 80); // 30 + 50
assert.equal(f.total_refunded, 10);
assert.equal(f.prepayment_total, 30);
assert.equal(f.prepaid_refunded, 10);
assert.equal(f.net_prepayment_credit, 20); // 30 − 10
assert.equal(f.net_total, 130); // 120 + 15 - 5
assert.equal(f.outstanding_balance, 60); // 130 - 80 + 10
assert.equal(f.net_revenue, 70); // 80 - 10
assert.equal(f.total_tax, 3.5); // 2.5 + 1

// Partial prepaid refund: 58.25 − 55.98 = 2.27 credit (backend-owned).
const partialPrepay = computeBookingFinancials(
  [
    { type: "PREPAYMENT", amount: 58.25, status: "completed" },
    { type: "REFUND", amount: 55.98, status: "completed" },
  ],
  { basePrice: 233 },
);
assert.equal(partialPrepay.prepayment_total, 58.25);
assert.equal(partialPrepay.prepaid_refunded, 55.98);
assert.equal(partialPrepay.net_prepayment_credit, 2.27);

assert.equal(derivePaymentStatus(f), "Pending");

const paidOff = computeBookingFinancials(
  [
    { type: "PREPAYMENT", amount: 50, status: "completed" },
    { type: "PAYMENT", amount: 50, status: "completed" },
  ],
  { basePrice: 100 },
);
assert.equal(paidOff.outstanding_balance, 0);
assert.equal(derivePaymentStatus(paidOff), "Paid");

const refunded = computeBookingFinancials(
  [
    { type: "PAYMENT", amount: 100, status: "completed" },
    { type: "REFUND", amount: 100, status: "completed" },
  ],
  { basePrice: 100 },
);
assert.equal(derivePaymentStatus(refunded), "Refunded");
assert.equal(
  deriveStatusesFromFinancials(refunded).suggested_booking_status,
  "cancelled",
);

// Burst multi-save: 10× €111 within 60s → one ADD_ON in aggregates.
const burst = Array.from({ length: 10 }, (_, i) => ({
  type: "ADD_ON",
  amount: 111,
  status: "completed",
  created_at: new Date(Date.parse("2026-10-21T12:00:00.000Z") + i * 200).toISOString(),
  metadata: { addonId: `addon-burst-${i}` },
}));
const burstFin = computeBookingFinancials(burst, { basePrice: 233 });
assert.equal(burstFin.addOns, 111, "burst ADD_ON sum is one charge");
assert.equal(burstFin.subtotal, 344);
assert.equal(selectBurstDedupedAddonRows(burst).drop.length, 9);

console.log("bookingFinancialLedger.test.js: ok");
