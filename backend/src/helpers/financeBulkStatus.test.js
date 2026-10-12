import assert from "node:assert/strict";
import {
  canBulkMarkPaid,
  canBulkMarkUnpaid,
  hasSettledRefund,
  isOfflineFinanceRow,
  resolveBulkVoidOutcome,
} from "./financeBulkStatus.js";

assert.equal(canBulkMarkUnpaid({ status: "Pending", entry_type: "onlineBooking" }), true);
assert.equal(canBulkMarkUnpaid({ status: "Pending", entry_type: "offlineBooking" }), true);
assert.equal(canBulkMarkUnpaid({ status: "Pending", entry_type: "manualEntry" }), true);

assert.equal(
  canBulkMarkUnpaid({
    status: "Payment due",
    entry_type: "manualEntry",
    document: { reissueLevel: 2 },
  }),
  true,
);
assert.equal(
  canBulkMarkUnpaid({
    status: "Overdue",
    entry_type: "manualEntry",
    document: { reissueLevel: 3 },
  }),
  true,
);
assert.equal(
  canBulkMarkUnpaid({
    status: "Payment due",
    entry_type: "manualEntry",
    document: { reissueLevel: 1 },
  }),
  false,
);
assert.equal(
  canBulkMarkUnpaid({
    status: "Payment due",
    entry_type: "onlineBooking",
    document: { reissueLevel: 2 },
  }),
  false,
);

assert.equal(canBulkMarkUnpaid({ status: "Paid", entry_type: "manualEntry" }), false);
assert.equal(canBulkMarkUnpaid({ status: "Overdue", entry_type: "onlineBooking" }), false);
assert.equal(canBulkMarkUnpaid({ status: "Prepayment due" }), false);

// Offline post-booking invoice: Overdue/Paid → Unpaid; Payment due cannot Mark Unpaid
assert.equal(isOfflineFinanceRow({ entry_type: "offlineBooking" }), true);
assert.equal(isOfflineFinanceRow({ method_title: "Offline – invoice with due date" }), true);
assert.equal(isOfflineFinanceRow({ entry_type: "onlineBooking", method_title: "Online – direct" }), false);
assert.equal(canBulkMarkUnpaid({ status: "Overdue", entry_type: "offlineBooking" }), true);
assert.equal(canBulkMarkUnpaid({ status: "Paid", entry_type: "offlineBooking" }), true);
assert.equal(canBulkMarkUnpaid({ status: "Payment due", entry_type: "offlineBooking" }), false);
assert.equal(
  canBulkMarkUnpaid({
    status: "Paid",
    entry_type: "manualEntry",
    method_title: "Offline – invoice with due date",
  }),
  true,
);

// Offline markPaid: Payment due|Overdue|Unpaid; not online Stripe
assert.equal(canBulkMarkPaid({ status: "Payment due", entry_type: "offlineBooking" }), true);
assert.equal(canBulkMarkPaid({ status: "Overdue", entry_type: "offlineBooking" }), true);
assert.equal(canBulkMarkPaid({ status: "Unpaid", entry_type: "offlineBooking" }), true);
assert.equal(canBulkMarkPaid({ status: "Payment due", entry_type: "onlineBooking" }), false);
assert.equal(canBulkMarkPaid({ status: "Pending", entry_type: "offlineBooking" }), false);
assert.equal(canBulkMarkPaid({ status: "Payment due", entry_type: "manualEntry" }), true);
assert.equal(canBulkMarkPaid({ status: "Unpaid", entry_type: "manualEntry" }), true);

// Void Paid gate: in-place void / owed→Unpaid / settled refund block
assert.equal(resolveBulkVoidOutcome({ status: "Paid" }), "void");
assert.equal(resolveBulkVoidOutcome({ status: "Prepaid" }), "void");
assert.equal(resolveBulkVoidOutcome({ status: "Payment due" }), "unpaid");
assert.equal(resolveBulkVoidOutcome({ status: "Overdue" }), "unpaid");
assert.equal(resolveBulkVoidOutcome({ status: "Unpaid" }), "unpaid");
assert.equal(resolveBulkVoidOutcome({ status: "Refunded" }), "block");
assert.equal(hasSettledRefund({ status: "Paid", refund_amount: 12 }), true);
assert.equal(resolveBulkVoidOutcome({ status: "Paid", refund_amount: 12 }), "block");
assert.equal(resolveBulkVoidOutcome({ status: "Paid", document: { refundAmount: 0 } }), "void");
assert.equal(resolveBulkVoidOutcome({ status: "Pending" }), "block");
assert.equal(resolveBulkVoidOutcome({ status: "Voided" }), "block");

console.log("financeBulkStatus.test.js: ok");
