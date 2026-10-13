/**
 * Run with: npx --yes tsx src/components/common/finance-documents/lockOnlineImmediate.test.ts
 */
import assert from "node:assert/strict";
import { resolveCheckoutPaymentOptions } from "../client-booking/checkoutPaymentOptions";
import {
  defaultFinanceTransactionOptions,
  lockOnlineImmediate,
} from "./useFinanceTransactionOptions";

const allOff = {
  onlineImmediate: false,
  onlineInvoiceDueDate: false,
  offlineImmediate: false,
  offlineInvoiceDueDate: false,
} as const;

assert.equal(lockOnlineImmediate(allOff).onlineImmediate, true);
assert.deepEqual(lockOnlineImmediate(allOff), {
  ...allOff,
  onlineImmediate: true,
});

assert.equal(defaultFinanceTransactionOptions.onlineImmediate, true);

const checkout = resolveCheckoutPaymentOptions(allOff, "fixed");
assert.ok(
  checkout.some((option) => option.id === "onlineDirect"),
  "online immediate must stay featured at checkout even if deselected in stored options",
);
assert.equal(checkout[0]?.id, "onlineDirect");

const deselectAttempt = lockOnlineImmediate({
  ...defaultFinanceTransactionOptions,
  onlineImmediate: false,
});
assert.equal(deselectAttempt.onlineImmediate, true);

console.log("lockOnlineImmediate.test.ts: ok");
