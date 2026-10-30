/**
 * Run with: npx --yes tsx src/components/common/calendar/resolveAfterTreatmentPayerRows.test.ts
 */
import assert from "node:assert/strict";
import {
  bookingSharesIncludeGuestOrModel,
  hasAfterTreatmentCheckoutSignal,
  resolveAfterTreatmentPayerRows,
} from "./resolveAfterTreatmentPayerRows";
import type { BookingSplitBillState } from "./salesSplitBill";

assert.equal(
  bookingSharesIncludeGuestOrModel([{ role: "main_client" }]),
  false,
  "main only → no guest party",
);
assert.equal(
  bookingSharesIncludeGuestOrModel([
    { role: "main_client" },
    { role: "guest" },
  ]),
  true,
  "guest present",
);
assert.equal(
  bookingSharesIncludeGuestOrModel([
    { role: "main_client" },
    { role: "model" },
  ]),
  true,
  "model present",
);

assert.equal(
  hasAfterTreatmentCheckoutSignal({ splitBill: null }),
  false,
  "no signal → no after-treatment",
);

const split: BookingSplitBillState = {
  mode: "split",
  prepaidAmount: 40,
  payers: [
    {
      key: "main-client",
      role: "main_client",
      label: "Main Client",
      displayName: "Ali",
      subtotal: 100,
      paymentAmount: 60,
      lineIds: ["s1"],
      paid: false,
      paymentMethod: "onlineDirect",
    },
    {
      key: "guest-1",
      role: "guest",
      label: "Guest",
      displayName: "ALI",
      subtotal: 88,
      paymentAmount: 88,
      lineIds: ["s2"],
      paid: true,
      paymentMethod: "offlineDirect",
    },
  ],
};

assert.ok(
  hasAfterTreatmentCheckoutSignal({ splitBill: split }),
  "splitBill → checkout signal",
);

const empty = resolveAfterTreatmentPayerRows({
  splitBill: split,
  enabled: false,
});
assert.equal(empty.length, 0, "disabled → no rows (prepayment phase)");

const rows = resolveAfterTreatmentPayerRows({
  splitBill: split,
  enabled: true,
});
assert.equal(rows.length, 2);

const main = rows.find((r) => r.payerKey === "main-client")!;
assert.equal(main.labelName, "Main Client");
assert.equal(main.showPayNow, true, "online Direct unpaid → Pay Now");
assert.equal(main.showInvoice, false);
assert.equal(main.statusLabel, "Pending");

const guest = rows.find((r) => r.payerKey === "guest-1")!;
assert.ok(guest.labelName.toLowerCase().includes("ali") || guest.labelName.includes("Guest"));
assert.equal(guest.showPayNow, false, "offline Direct → no Pay Now");
assert.equal(guest.showInvoice, true);
assert.equal(guest.showReceipt, true);
assert.equal(guest.statusLabel, "Paid");
assert.match(guest.methodLabel, /Offline/i);

const modelSplit: BookingSplitBillState = {
  mode: "split",
  prepaidAmount: 0,
  payers: [
    {
      key: "model-1",
      role: "model",
      label: "Model",
      displayName: "Sam",
      subtotal: 50,
      paymentAmount: 50,
      lineIds: ["s3"],
      paid: false,
      paymentMethod: "onlineDirect",
    },
  ],
};
const modelRows = resolveAfterTreatmentPayerRows({
  splitBill: modelSplit,
  enabled: true,
});
assert.ok(
  modelRows[0]?.labelName.toLowerCase().includes("model") ||
    modelRows[0]?.labelName.includes("Sam"),
  "model label",
);
assert.equal(modelRows[0]?.showPayNow, true);

console.log("resolveAfterTreatmentPayerRows.test.ts: ok");
