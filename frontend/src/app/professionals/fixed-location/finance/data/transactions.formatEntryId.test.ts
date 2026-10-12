/**
 * Run with: npx --yes tsx src/app/professionals/fixed-location/finance/data/transactions.formatEntryId.test.ts
 */
import assert from "node:assert/strict";
import { formatEntryIdDisplay } from "./transactions";

// Offline: OF + full code body (hex suffix preserved; of/OF not doubled)
assert.equal(formatEntryIdDisplay("offlineBooking", "of1730123456ab12"), "OF1730123456ab12");
assert.equal(formatEntryIdDisplay("offlineBooking", "OF1730123456ab12"), "OF1730123456ab12");
assert.equal(formatEntryIdDisplay("offlineBooking", "1730xyz"), "OF1730xyz");

// Online: numbers only (ol stripped, non-digits removed; hex digits in suffix remain)
assert.equal(formatEntryIdDisplay("onlineBooking", "ol1730123456ab12"), "173012345612");
assert.equal(formatEntryIdDisplay("onlineBooking", "1730123456"), "1730123456");

// Manual: M + code
assert.equal(formatEntryIdDisplay("manualEntry", "456"), "M456");
assert.equal(formatEntryIdDisplay("manualEntry", "M456"), "M456");
assert.equal(formatEntryIdDisplay("onlineBooking", "789", "Manual entry"), "M789");

assert.equal(formatEntryIdDisplay("onlineBooking", null, "Manual entry"), "Manual entry");
assert.equal(formatEntryIdDisplay("offlineBooking", null), "");

console.log("transactions.formatEntryId.test.ts: ok");
