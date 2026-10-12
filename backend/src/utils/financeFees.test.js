/**
 * Run with: node src/utils/financeFees.test.js
 */
import assert from "node:assert/strict";
import {
  computeFinanceFees,
  estimateOnlineFees,
  feeMajorFromBalanceTransaction,
} from "./financeFees.js";

assert.deepEqual(estimateOnlineFees(100), {
  stripeFee: 2.9,
  mollureFee: 1,
  net: 96.1,
  source: "estimate",
});

assert.deepEqual(computeFinanceFees(50, { isOnline: false }), {
  stripeFee: null,
  mollureFee: null,
  net: 50,
  source: "offline",
});

assert.equal(computeFinanceFees(50, { isOnline: true }).source, "estimate");
assert.equal(computeFinanceFees(50, { isOnline: true }).stripeFee, 1.45);

assert.deepEqual(
  computeFinanceFees(100, { isOnline: true, stripeFee: 3.2, mollureFee: 1 }),
  { stripeFee: 3.2, mollureFee: 1, net: 95.8, source: "live" },
);

// Live Stripe fee + estimated Mollure leg
assert.deepEqual(
  computeFinanceFees(100, { isOnline: true, stripeFee: 2.55 }),
  { stripeFee: 2.55, mollureFee: 1, net: 96.45, source: "live" },
);

assert.equal(
  feeMajorFromBalanceTransaction({ fee: 290, currency: "eur" }, "eur"),
  2.9,
);
assert.equal(
  feeMajorFromBalanceTransaction(
    { fee: 580, currency: "usd", exchange_rate: 2 },
    "eur",
  ),
  2.9,
);
assert.equal(
  feeMajorFromBalanceTransaction({ fee: 100, currency: "usd" }, "eur"),
  null,
);

console.log("financeFees.test.js: ok");
