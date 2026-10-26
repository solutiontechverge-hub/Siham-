/**
 * Run with: node --experimental-vm-modules src/services/finance-sync.noShowFee.test.js
 * (from backend/)
 */
import assert from "node:assert/strict";
import { resolveNoShowFeeAmountForTest } from "./finance-sync.service.js";

const booking = {
  total_price: 138,
  no_show_fee_percentage: 10,
};

const baseMeta = {
  clientSnapshot: {
    services: [{ id: "s1", name: "Cut", price: 138 }],
  },
};

const template = resolveNoShowFeeAmountForTest(baseMeta, booking);
assert.ok(template);
assert.equal(template.amount, 13.8, "template 10% of €138");

const decreased = resolveNoShowFeeAmountForTest(
  { ...baseMeta, showNoShowFee: true, noShowFeePercent: "4", noShowFeePercentCeiling: "10" },
  booking,
);
assert.ok(decreased);
assert.equal(decreased.amount, 5.52, "stamped 4% wins over template 10%");
assert.equal(decreased.percent, 4);

const capped = resolveNoShowFeeAmountForTest(
  { ...baseMeta, showNoShowFee: true, noShowFeePercent: "40", noShowFeePercentCeiling: "10" },
  booking,
);
assert.ok(capped);
assert.equal(capped.percent, 10, "cannot increase above ceiling");
assert.equal(capped.amount, 13.8);

const removed = resolveNoShowFeeAmountForTest(
  { ...baseMeta, showNoShowFee: false, noShowFeePercent: "" },
  booking,
);
assert.equal(removed, null, "removed fee → no NS finance row");

console.log("finance-sync.noShowFee.test.js: ok");
