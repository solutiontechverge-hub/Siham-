/**
 * Run with: npx --yes tsx src/components/common/client-booking/clientBookingDetails.helpers.afterTreatment.test.ts
 */
import assert from "node:assert/strict";
import { filterVisiblePaymentSummarySections } from "./clientBookingDetails.helpers";

const sections = [
  { id: "prepayment", title: "Prepayment" },
  { id: "after-treatment", title: "After Treatment Payment" },
  { id: "fee-summary", title: "Fee Summary" },
];

const beforeCheckout = filterVisiblePaymentSummarySections(sections, {
  isPrepaymentPaid: true,
  isOfflinePay: false,
  isCompleted: true,
  isPaymentDue: false,
  hasAfterTreatmentCheckout: false,
});
assert.deepEqual(
  beforeCheckout.map((s) => s.id),
  ["prepayment", "fee-summary"],
  "completed without checkout → no after-treatment",
);

const afterCheckout = filterVisiblePaymentSummarySections(sections, {
  isPrepaymentPaid: true,
  isOfflinePay: false,
  isCompleted: true,
  isPaymentDue: false,
  hasAfterTreatmentCheckout: true,
});
assert.deepEqual(
  afterCheckout.map((s) => s.id),
  ["prepayment", "after-treatment", "fee-summary"],
  "checkout done → after-treatment visible",
);

// Regression: In Progress + prepaid used to strip After Treatment after split checkout.
const inProgressAfterSplit = filterVisiblePaymentSummarySections(sections, {
  isPrepaymentPaid: true,
  isOfflinePay: false,
  isCompleted: false,
  isPaymentDue: false,
  hasAfterTreatmentCheckout: true,
});
assert.deepEqual(
  inProgressAfterSplit.map((s) => s.id),
  ["prepayment", "after-treatment", "fee-summary"],
  "In Progress + checkout signal → after-treatment stays",
);

console.log("clientBookingDetails.helpers.afterTreatment.test.ts: ok");
