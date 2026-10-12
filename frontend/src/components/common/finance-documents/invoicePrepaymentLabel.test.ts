/**
 * Run with: npx --yes tsx src/components/common/finance-documents/invoicePrepaymentLabel.test.ts
 */
import assert from "node:assert/strict";
import {
  formatInvoicePrepaymentLabel,
  isInvoicePrepaymentCollected,
} from "./financeDocumentUtils";

assert.equal(isInvoicePrepaymentCollected("Prepaid"), true);
assert.equal(isInvoicePrepaymentCollected("Paid"), true);
assert.equal(isInvoicePrepaymentCollected("Payment due"), true);
assert.equal(isInvoicePrepaymentCollected("Prepayment due"), false);
assert.equal(isInvoicePrepaymentCollected("Pending"), false);
assert.equal(isInvoicePrepaymentCollected("Failed"), false);

assert.equal(
  formatInvoicePrepaymentLabel("Prepaid", "2026-10-09"),
  "Prepaid · 2026-10-09",
);
assert.equal(formatInvoicePrepaymentLabel("Prepayment due"), "Prepayment");
assert.equal(
  formatInvoicePrepaymentLabel("Prepayment due", "2026-10-09"),
  "Prepayment · 2026-10-09",
);

console.log("invoicePrepaymentLabel.test.ts: ok");
