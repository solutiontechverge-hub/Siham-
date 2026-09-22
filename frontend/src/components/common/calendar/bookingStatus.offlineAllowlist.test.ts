/**
 * Run with: npx --yes tsx src/components/common/calendar/bookingStatus.offlineAllowlist.test.ts
 */
import assert from "node:assert/strict";
import {
  isAllowedStatusForBookingType,
  OFFLINE_BOOKING_STATUSES,
} from "./bookingStatus";
import { resolveProfessionalBookingActions } from "./bookingStatusActions";

assert.deepEqual(
  [...OFFLINE_BOOKING_STATUSES],
  ["Confirmed", "In Progress", "Completed", "Cancelled"],
);

for (const status of ["Invalid", "Requested", "No Show", "BR Accepted"] as const) {
  assert.equal(isAllowedStatusForBookingType(status, "Offline"), false);
}
for (const status of OFFLINE_BOOKING_STATUSES) {
  assert.equal(isAllowedStatusForBookingType(status, "Offline"), true);
}
assert.equal(isAllowedStatusForBookingType("Requested", "Online"), true);
assert.equal(isAllowedStatusForBookingType("No Show", "Online"), true);

const offlineConfirmed = {
  bookingType: "Offline" as const,
  status: "Confirmed" as const,
  bookingScenario: undefined,
  details: {},
};
assert.equal(resolveProfessionalBookingActions(offlineConfirmed).no_show, false);
assert.equal(
  resolveProfessionalBookingActions({
    ...offlineConfirmed,
    bookingType: "Online",
  }).no_show,
  true,
);

console.log("bookingStatus.offlineAllowlist.test.ts: ok");
