/**
 * Run with: npx --yes tsx src/components/common/BookingStartEndTimeRow.test.ts
 */
import assert from "node:assert/strict";
import { bookingStartEndRangeLabel } from "./BookingStartEndTimeRow";

assert.equal(bookingStartEndRangeLabel("10:00", null), "10:00");
assert.equal(bookingStartEndRangeLabel("10:00", undefined), "10:00");
assert.equal(bookingStartEndRangeLabel("10:00", ""), "10:00");
assert.equal(bookingStartEndRangeLabel("10:00", "10:45"), "10:00-10:45");
assert.equal(bookingStartEndRangeLabel(null, "10:45"), null);

console.log("BookingStartEndTimeRow.test.ts: ok");
