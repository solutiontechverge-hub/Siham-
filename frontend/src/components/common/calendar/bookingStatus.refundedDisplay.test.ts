/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingStatus.refundedDisplay.test.ts
 */
import assert from "node:assert/strict";
import {
  professionalCalendarDisplayStatus,
  professionalCalendarStatusLabel,
} from "./bookingStatus";

const confirmed = {
  status: "Confirmed" as const,
  bookingType: "Online" as const,
  details: {},
};

assert.equal(professionalCalendarStatusLabel(confirmed), "Confirmed");
assert.equal(professionalCalendarDisplayStatus(confirmed), "Confirmed");

const refunded = {
  ...confirmed,
  details: { refunded: true },
};

assert.equal(professionalCalendarStatusLabel(refunded), "Refunded");
assert.equal(professionalCalendarDisplayStatus(refunded), "Refunded");

console.log("bookingStatus.refundedDisplay.test.ts: ok");
