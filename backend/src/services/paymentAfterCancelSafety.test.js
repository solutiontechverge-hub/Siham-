/**
 * Run with: node src/services/paymentAfterCancelSafety.test.js
 */
import assert from "node:assert/strict";
import {
  PAYMENT_AFTER_CANCEL_DETAIL,
  PAYMENT_AFTER_CANCEL_FLAG,
  buildPaymentAfterCancelDocumentPatch,
  isSettledFinanceStatus,
  shouldFlagPaymentAfterCancel,
} from "./finance-sync.service.js";

assert.equal(isSettledFinanceStatus("Paid"), true);
assert.equal(isSettledFinanceStatus("Prepaid"), true);
assert.equal(isSettledFinanceStatus("Pending"), false);
assert.equal(isSettledFinanceStatus("Voided"), false);

assert.equal(shouldFlagPaymentAfterCancel("Paid", true), true);
assert.equal(shouldFlagPaymentAfterCancel("Prepaid", true), true);
assert.equal(shouldFlagPaymentAfterCancel("Paid", false), false);
assert.equal(shouldFlagPaymentAfterCancel("Pending", true), false);

const patch = buildPaymentAfterCancelDocumentPatch({
  intendedStatus: "Prepaid",
  amount: 42.5,
});
assert.equal(patch.safetyFlag, PAYMENT_AFTER_CANCEL_FLAG);
assert.equal(patch.needsReview, true);
assert.equal(patch.paymentReceivedStatus, "Prepaid");
assert.equal(patch.paymentReceivedAmount, 42.5);
assert.ok(typeof patch.paymentReceivedAt === "string");
assert.ok(PAYMENT_AFTER_CANCEL_DETAIL.includes("review"));

console.log("paymentAfterCancelSafety.test.js: ok");
