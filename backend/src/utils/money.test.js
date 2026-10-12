/**
 * Run with: node src/utils/money.test.js
 */
import assert from "node:assert/strict";
import { normalizeMoneyJson, parseMoney, roundMoney } from "./money.js";

assert.equal(parseMoney(1111111), 1111111);
assert.equal(parseMoney("€1,111,111"), 1111111);
assert.equal(parseMoney("€1,234.56"), 1234.56);
assert.equal(parseMoney("€1.234,56"), 1234.56);
assert.equal(parseMoney("-€10.50"), -10.5);
assert.equal(parseMoney(""), 0);
assert.equal(parseMoney("nope", null), null);

assert.equal(roundMoney("€1,234.567"), 1234.57);

assert.deepEqual(
  normalizeMoneyJson({
    totalPrice: "€1,111,111",
    lineItems: [{ pricePerUnit: "€10,00", totalPrice: 20, vat: "21%" }],
    note: "keep me",
  }),
  {
    totalPrice: 1111111,
    lineItems: [{ pricePerUnit: 10, totalPrice: 20, vat: "21%" }],
    note: "keep me",
  },
);

console.log("money.test.js: ok");
