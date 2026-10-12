/**
 * Run with: npx --yes tsx src/components/common/finance-documents/displayReceiptNumber.test.ts
 */
import assert from "node:assert/strict";
import {
  displayReceiptNumber,
  receiptNumberLabelForStatus,
  receiptTitleForStatus,
} from "./financeDocumentUtils";

assert.equal(displayReceiptNumber("Voided", { receiptNumber: "RCP-1" }), "voided");
assert.equal(displayReceiptNumber("Paid", { receiptNumber: "RCP-1" }), "RCP-1");
assert.equal(displayReceiptNumber("Prepaid", { receiptNumber: "RCP-2" }), "RCP-2");
assert.equal(
  displayReceiptNumber("Refunded", { creditNoteNumber: "CN-1", receiptNumber: "RCP-1" }),
  "CN-1",
);
assert.equal(displayReceiptNumber("Pending", { receiptNumber: "RCP-1" }), undefined);
assert.equal(displayReceiptNumber("Payment due", { receiptNumber: "RCP-1" }), undefined);
assert.equal(displayReceiptNumber("Paid", {}), undefined);

assert.equal(receiptTitleForStatus("Refunded"), "Refund Receipt");
assert.equal(receiptTitleForStatus("Paid"), "Receipt");
assert.equal(receiptNumberLabelForStatus("Refunded"), "Receipt number");

console.log("displayReceiptNumber.test.ts: ok");
