import assert from "node:assert/strict";
import { shouldReuseOpenFinanceRow } from "./finance-sync.service.js";

assert.equal(
  shouldReuseOpenFinanceRow({
    sameLabel: true,
    prevGross: 40,
    nextGross: 40,
    prevStatus: "Prepayment due",
    nextStatus: "Prepayment due",
  }),
  true,
  "identical open row is reused",
);

assert.equal(
  shouldReuseOpenFinanceRow({
    forceReplace: true,
    sameLabel: true,
    prevGross: 40,
    nextGross: 40,
    prevStatus: "Prepayment due",
    nextStatus: "Prepayment due",
  }),
  false,
  "negotiation forceReplace always voids/replaces",
);

assert.equal(
  shouldReuseOpenFinanceRow({
    sameLabel: true,
    prevGross: 40,
    nextGross: 55,
    prevStatus: "Prepayment due",
    nextStatus: "Prepayment due",
  }),
  false,
  "amount drift voids/replaces",
);

console.log("finance-sync.supersede.test.js: ok");
