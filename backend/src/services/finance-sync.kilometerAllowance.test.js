import assert from "node:assert/strict";
import {
  resolveKilometerAllowanceAmount,
  withKilometerAllowanceLine,
} from "./finance-sync.service.js";

assert.equal(
  resolveKilometerAllowanceAmount({
    kilometerAllowance: { eurPerKm: "50", totalKilometer: "1" },
  }),
  50,
);
assert.equal(
  resolveKilometerAllowanceAmount({
    kilometerAllowance: { eurPerKm: "0", totalKilometer: "10" },
  }),
  0,
);

const lines = withKilometerAllowanceLine(
  [
    {
      description: "hair dye",
      sourceReference: "s1",
      sourceType: "serviceId",
      quantity: 1,
      vat: "21%",
      vatRate: 21,
      pricePerUnit: 44,
      totalPrice: 44,
    },
    {
      description: "buzz cutt",
      sourceReference: "s2",
      sourceType: "serviceId",
      quantity: 1,
      vat: "21%",
      vatRate: 21,
      pricePerUnit: 44,
      totalPrice: 44,
    },
  ],
  { kilometerAllowance: { eurPerKm: "50", totalKilometer: "1" } },
);

assert.equal(lines.length, 3);
assert.equal(lines[2].description, "Kilometer Allowance");
assert.equal(lines[2].totalPrice, 50);
assert.equal(lines[2].sourceReference, "kilometer-allowance");

const again = withKilometerAllowanceLine(lines, {
  kilometerAllowance: { eurPerKm: "50", totalKilometer: "1" },
});
assert.equal(again.length, 3, "must not duplicate km line");

console.log("finance-sync.kilometerAllowance.test.js: ok");
