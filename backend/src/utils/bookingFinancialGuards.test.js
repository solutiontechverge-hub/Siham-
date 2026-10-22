/**
 * Run with: node src/utils/bookingFinancialGuards.test.js
 */
import assert from "node:assert/strict";
import {
  clampPaymentAmount,
  clampRefundAmount,
  guardOutstandingBalance,
  maxPayableAmount,
  maxRefundableAmount,
  withFinancialAuditMetadata,
} from "./bookingFinancialGuards.js";

assert.equal(maxRefundableAmount({ total_paid: 100, total_refunded: 30 }), 70);
assert.equal(maxRefundableAmount({ totalPaid: 50, totalRefunded: 50 }), 0);
assert.equal(maxRefundableAmount({ total_paid: 20, total_refunded: 40 }), 0);

const overRefund = clampRefundAmount(100, { total_paid: 40, total_refunded: 0 });
assert.equal(overRefund.amount, 40);
assert.equal(overRefund.capped, true);

assert.equal(maxPayableAmount({ outstanding_balance: 21.03 }), 21.03);
assert.equal(maxPayableAmount({ outstanding_balance: -5 }), 0);

const overPay = clampPaymentAmount(100, { outstanding_balance: 21.03 });
assert.equal(overPay.amount, 21.03);
assert.equal(overPay.capped, true);

const credit = clampPaymentAmount(100, { outstanding_balance: 0 }, { storeCredit: true });
assert.equal(credit.amount, 100);
assert.equal(credit.storeCredit, true);

assert.equal(guardOutstandingBalance(-12), 0);
assert.equal(guardOutstandingBalance(-12, { allowStoreCredit: true }), -12);

const audited = withFinancialAuditMetadata({ reason: "test" }, {
  performedByUserId: "user-1",
  actor: "professional",
  idempotencyKey: "idem-1",
});
assert.equal(audited.performed_by_user_id, "user-1");
assert.equal(audited.actor, "professional");
assert.equal(audited.idempotency_key, "idem-1");
assert.ok(audited.performed_at);

console.log("bookingFinancialGuards.test.js: ok");
