/**
 * Run with: node src/services/receiptNumber.test.js
 */
import assert from "node:assert/strict";
import {
  isReceiptEligibleStatus,
  mintReceiptNumber,
} from "./finance-sync.service.js";

assert.equal(isReceiptEligibleStatus("Paid"), true);
assert.equal(isReceiptEligibleStatus("Prepaid"), true);
assert.equal(isReceiptEligibleStatus("Refunded"), true);
assert.equal(isReceiptEligibleStatus("Voided"), false);
assert.equal(isReceiptEligibleStatus("Pending"), false);
assert.equal(isReceiptEligibleStatus("Payment due"), false);

assert.equal(mintReceiptNumber("Paid", "ABC"), "RCP-ABC");
assert.equal(mintReceiptNumber("Prepaid", "G778"), "RCP-G778");
assert.equal(mintReceiptNumber("Refunded", "RCP-X"), "RCP-X");
assert.equal(mintReceiptNumber("Voided", "ABC"), undefined);
assert.equal(mintReceiptNumber("Pending", "ABC"), undefined);
assert.equal(mintReceiptNumber("Paid", ""), undefined);
assert.equal(mintReceiptNumber("Paid", null), undefined);

console.log("receiptNumber.test.js: ok");
