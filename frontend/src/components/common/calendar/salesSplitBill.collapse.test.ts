/**
 * Run with: npx --yes tsx src/components/common/calendar/salesSplitBill.collapse.test.ts
 */
import assert from "node:assert/strict";
import { collapseSharesOntoPayer } from "./salesSplitBill";

const sara = {
  key: "sara",
  role: "main_client" as const,
  label: "Sara",
  displayName: "Sara",
  lines: [{ id: "s1", label: "Cut", amount: 100 }],
  subtotal: 100,
  paymentAmount: 100,
};
const ally = {
  key: "ally",
  role: "guest" as const,
  label: "Guest",
  displayName: "Ally",
  lines: [{ id: "s2", label: "Blow Dry", amount: 50 }],
  subtotal: 50,
  paymentAmount: 50,
};

const full = collapseSharesOntoPayer([sara, ally], "sara");
assert.equal(full.length, 1);
assert.equal(full[0].key, "sara");
assert.equal(full[0].paymentAmount, 150);
assert.equal(full[0].lines.length, 2);

// Sara pays for Ally only — payer identity outside covered set.
const forAlly = collapseSharesOntoPayer([ally], "sara", [sara, ally]);
assert.equal(forAlly.length, 1);
assert.equal(forAlly[0].key, "sara");
assert.equal(forAlly[0].paymentAmount, 50);
assert.deepEqual(
  forAlly[0].lines.map((line) => line.id),
  ["s2"],
);

console.log("salesSplitBill.collapse.test.ts: ok");
