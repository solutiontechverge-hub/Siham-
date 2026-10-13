/**
 * Run with: npx --yes tsx src/app/professionals/fixed-location/finance/data/transactions.statusDisplay.test.ts
 */
import assert from "node:assert/strict";
import {
  formatTransactionStatusLabel,
  getTransactionStatusTone,
  isCancelledFeeDisplayStatus,
} from "./transactions";

const LCF = "Late Cancellation Booking Fee";

assert.equal(isCancelledFeeDisplayStatus("Paid", LCF), true);
assert.equal(isCancelledFeeDisplayStatus("Payment due", LCF), false);
assert.equal(isCancelledFeeDisplayStatus("Paid", "Prepayment"), false);
assert.equal(isCancelledFeeDisplayStatus("Paid", "Late Rescheduling Fee"), false);
assert.equal(isCancelledFeeDisplayStatus("Paid", "No-show fee"), false);

assert.equal(formatTransactionStatusLabel("Paid", LCF), "Cancelled");
assert.equal(formatTransactionStatusLabel("Paid", "Prepayment"), "Paid");
assert.equal(formatTransactionStatusLabel("Payment due", LCF), "Payment due");
assert.equal(formatTransactionStatusLabel("Voided"), "Voided");

assert.equal(getTransactionStatusTone("Paid", LCF), "danger");
assert.equal(getTransactionStatusTone("Paid", "Prepayment"), "success");

console.log("transactions.statusDisplay.test.ts: ok");
