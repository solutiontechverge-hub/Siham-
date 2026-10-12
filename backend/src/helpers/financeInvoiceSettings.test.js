/**
 * Run with: node src/helpers/financeInvoiceSettings.test.js
 *
 * Clock reset contract: reissue due date = dispatch calendar day + settings duration.
 */
import assert from "node:assert/strict";
import {
  addDaysIso,
  computePenaltyAmount,
  durationToDays,
  isAutomaticTrigger,
  mergeInvoiceSettings,
  resolveOverdueReissueAction,
  uniqueById,
} from "./financeInvoiceSettings.js";

const dispatchDay = "2026-10-13";
const dueDays = durationToDays("2", "Weeks");
assert.equal(dueDays, 14);
assert.equal(addDaysIso(dispatchDay, dueDays), "2026-10-27");

assert.equal(isAutomaticTrigger("Automatic"), true);
assert.equal(isAutomaticTrigger("Manual"), false);

// After final reissue → close; Manual banner only for the pending Manual stage.
assert.equal(
  resolveOverdueReissueAction(0, { firstReissueTrigger: "Manual" }),
  "manual",
);
assert.equal(
  resolveOverdueReissueAction(0, { firstReissueTrigger: "Automatic" }),
  "automatic",
);
assert.equal(
  resolveOverdueReissueAction(1, {
    firstReissueTrigger: "Automatic",
    secondReissueTrigger: "Manual",
  }),
  "manual",
);
assert.equal(resolveOverdueReissueAction(2, { secondReissueTrigger: "Manual" }), "close");
assert.equal(resolveOverdueReissueAction(3, {}), "close");

assert.equal(computePenaltyAmount(100, "20", "%"), 20);
assert.equal(computePenaltyAmount(100, "15", "fixed"), 15);

assert.deepEqual(
  uniqueById([
    { id: "a", price: "€10" },
    { id: "a", price: 99 },
    { id: "", price: 1 },
    { id: "b", price: 2 },
  ]),
  [
    { id: "a", price: "€10" },
    { id: "b", price: 2 },
  ],
);

const merged = mergeInvoiceSettings({
  products: [
    { id: "p1", name: "Shampoo", price: "€12,50", discountAmount: "1" },
    { id: "p1", name: "Dup", price: 99 },
  ],
});
assert.equal(merged.products.length, 1);
assert.equal(merged.products[0].price, 12.5);
assert.equal(merged.products[0].discountAmount, 1);

console.log("financeInvoiceSettings.test.js: ok");
